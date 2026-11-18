import express from "express";
import rateLimit from "express-rate-limit";
import { db } from "../firebaseAdmin.js";

const spinRouter = express.Router();

// ---------- config ----------
const PRIZE_TIERS = [            // highest first
  { minGB: 40, prizeGB: 2 },
  { minGB: 20, prizeGB: 1 }
];
const DAILY_CAP_GB = Number(process.env.SPIN_DAILY_CAP_GB || 100); // max free GB per day
const SPIN_COOLDOWN_MS = 8000;
const lastSpinAt = new Map();    // phone -> timestamp (per instance)

// ---------- helpers ----------
export function normalizePhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("233")) d = "0" + d.slice(3);
  return d;
}

const isValidPhone = p => /^0\d{9}$/.test(p);

function spinStatus(data) {
  const credit = Math.max(0, (data?.deliveredGB || 0) - (data?.claimedGB || 0));
  const tier = PRIZE_TIERS.find(t => credit >= t.minGB) || null;
  const next = [...PRIZE_TIERS].reverse().find(t => credit < t.minGB) || null;

  return {
    creditGB: Number(credit.toFixed(2)),
    prizeGB: tier ? tier.prizeGB : 0,
    nextTier: next
      ? {
          minGB: next.minGB,
          prizeGB: next.prizeGB,
          remaining: Number((next.minGB - credit).toFixed(2))
        }
      : null
  };
}

// Ghana is UTC+0, so the UTC date is the local date
const todayKey = () => new Date().toISOString().slice(0, 10);

// ---------- 1GB / 2GB delivery (wire to your provider) ----------
// Must be idempotent: use `rewardId` as the provider reference so a retry
// can never send the same reward twice.
async function fulfilFreeGb(phone, gb, rewardId) {
  // TODO: call your DataMart buy function here with:
  //   recipient: phone, size: gb, reference: `SPIN-${rewardId}`
  // and mark the order isSpinReward: true when you save it.
  throw new Error("fulfilFreeGb is not connected yet");
}

async function sendReward(rewardRef, phone, gb) {
  try {
    await fulfilFreeGb(phone, gb, rewardRef.id);
    await rewardRef.update({ status: "sent", sentAt: new Date() });
    return true;
  } catch (err) {
    console.error(`❌ Spin reward ${rewardRef.id} failed:`, err.message);
    await rewardRef.update({
      status: "failed",
      error: String(err.message || err).slice(0, 300),
      attempts: (await rewardRef.get()).data()?.attempts + 1 || 1
    });
    return false;
  }
}

// ---------- rate limit ----------
const spinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,                       // use `max: 20` on express-rate-limit v6
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Wait a minute." }
});

// ---------- GET /api/spin/status/:phone ----------
spinRouter.get("/status/:phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!isValidPhone(phone))
      return res.status(400).json({ success: false, message: "Invalid number" });

    const snap = await db.collection("spinRecipients").doc(phone).get();
    res.json({ success: true, ...spinStatus(snap.data()) });
  } catch (err) {
    console.error("Spin status failed:", err.message);
    res.status(500).json({ success: false, message: "Could not check spins" });
  }
});

// ---------- POST /api/spin ----------
spinRouter.post("/", spinLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!isValidPhone(phone))
      return res.status(400).json({ success: false, message: "Invalid number" });

    const now = Date.now();
    if (now - (lastSpinAt.get(phone) || 0) < SPIN_COOLDOWN_MS)
      return res.status(429).json({ success: false, message: "Wait a few seconds." });
    lastSpinAt.set(phone, now);

    const rRef = db.collection("spinRecipients").doc(phone);
    const dayRef = db.collection("spinDaily").doc(todayKey());
    const rewardRef = db.collection("spinRewards").doc();

    let prizeGB = 0;

    await db.runTransaction(async tx => {
      // all reads first
      const [rSnap, daySnap] = await Promise.all([tx.get(rRef), tx.get(dayRef)]);

      const data = rSnap.data();
      const given = daySnap.data()?.givenGB || 0;
      const credit = Math.max(0, (data?.deliveredGB || 0) - (data?.claimedGB || 0));
      const tier = PRIZE_TIERS.find(t => credit >= t.minGB);

      if (!tier) return;                              // not unlocked
      if (given + tier.prizeGB > DAILY_CAP_GB) return; // daily cap reached: plain try again

      prizeGB = tier.prizeGB;

      tx.set(rRef, { claimedGB: (data?.claimedGB || 0) + tier.minGB, updatedAt: new Date() },
        { merge: true });
      tx.set(dayRef, { givenGB: given + prizeGB }, { merge: true });
      tx.set(rewardRef, {
        phone,
        gb: prizeGB,
        status: "pending",
        attempts: 0,
        createdAt: new Date()
      });
    });

    if (prizeGB > 0) await sendReward(rewardRef, phone, prizeGB);

    // The user sees a win even if delivery is retried later: the reward is already recorded
    res.json({ success: true, win: prizeGB > 0, gb: prizeGB });
  } catch (err) {
    console.error("Spin failed:", err.message);
    res.status(500).json({ success: false, message: "Spin failed. Try again." });
  }
});

export default spinRouter;

// ---------- called from your order sync cron when an order becomes delivered ----------
export async function creditSpinProgress(orderRef) {
  await db.runTransaction(async tx => {
    const o = await tx.get(orderRef);
    const d = o.data();

    if (!d || d.status !== "delivered" || d.spinCounted || d.isSpinReward) return;

    const phone = normalizePhone(d.recipient);
    if (!isValidPhone(phone)) return;

    const rRef = db.collection("spinRecipients").doc(phone);
    const r = await tx.get(rRef);
    const prev = r.exists ? r.data() : { deliveredGB: 0, claimedGB: 0 };

    tx.set(rRef, {
      deliveredGB: (prev.deliveredGB || 0) + Number(d.volume || 0),
      claimedGB: prev.claimedGB || 0,
      updatedAt: new Date()
    }, { merge: true });

    tx.update(orderRef, { spinCounted: true });
  });
}

// ---------- retry rewards that failed or got stuck ----------
export async function retryFailedSpinRewards() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);

  const snap = await db.collection("spinRewards")
    .where("status", "in", ["failed", "pending"])
    .get();

  for (const doc of snap.docs) {
    const r = doc.data();
    const created = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);

    if ((r.attempts || 0) >= 5) continue;           // give up, review manually
    if (r.status === "pending" && created > cutoff) continue; // still in flight

    await sendReward(doc.ref, r.phone, r.gb);
  }
}