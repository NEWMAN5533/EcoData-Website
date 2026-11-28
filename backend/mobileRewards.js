import { getAuth } from "@clerk/express";
import crypto from "node:crypto";
import sql from "./db.js";

export const REWARD_GB = { 1: 3, 2: 2, 3: 1 };

// The first month that is rewarded. "2026-11" means the first payout runs on 1 December 2026.
// For a competition that starts counting on 1 December, use "2026-12".
const FIRST_MONTH = "2026-11";
const MIN_GB = 1; // a winner must have bought at least this much
const SHOW_LIMIT = 9;

const MTN_PREFIXES = ["024", "025", "053", "054", "055", "059"];
const isMtn = (p) =>
  /^0\d{9}$/.test(String(p)) && MTN_PREFIXES.includes(String(p).slice(0, 3));

// ---- Months, always in UTC (Ghana time) ----
const pad = (n) => String(n).padStart(2, "0");
export const monthKey = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
const monthStart = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};
const addMonths = (key, n) => {
  const d = monthStart(key);
  d.setUTCMonth(d.getUTCMonth() + n);
  return monthKey(d);
};
const monthBounds = (key) => ({
  start: monthStart(key).toISOString(),
  end: monthStart(addMonths(key, 1)).toISOString(),
});
export const monthLabel = (key) =>
  monthStart(key).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const dayLabel = (d) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const monthsBetween = (from, to) => {
  const out = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
};

// "Kwame A." is all anyone else ever sees
const shortName = (r) => {
  const full = String(r.full_name || "")
    .trim()
    .split(/\s+/);
  const first = String(r.first_name || full[0] || "Member").trim();
  const last = String(r.last_name || full.slice(1).join(" ") || "").trim();
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
};

// GB bought in a month, best first
export async function ranking(month, limit = 200) {
  const { start, end } = monthBounds(month);
  const rows = await sql`
    SELECT t.clerk_user_id, t.gb, t.last_at, u.first_name, u.last_name, u.full_name
    FROM (
      SELECT clerk_user_id,
             SUM(NULLIF(substring(size from '[0-9]+(?:[.][0-9]+)?'), '')::numeric) AS gb,
             MAX(created_at) AS last_at
      FROM orders
      WHERE created_at >= ${start}::timestamptz AND created_at < ${end}::timestamptz
        AND status IN ('delivered', 'processing')
        AND COALESCE(source, 'mobile') <> 'reward'
      GROUP BY clerk_user_id
    ) t
    LEFT JOIN public.ecodata_users u ON u.clerk_user_id = t.clerk_user_id
    WHERE t.gb >= ${MIN_GB}
    ORDER BY t.gb DESC, t.last_at ASC
    LIMIT ${limit}`;
  return rows.map((r, i) => ({
    rank: i + 1,
    clerkId: r.clerk_user_id,
    name: shortName(r),
    gb: Number(r.gb),
  }));
}

// PIECE 3: settlement and rewards go here
// Places one winner's free order on the normal (DataMart) package
async function placeReward(w, phone, placeLine) {
  const ref = `RWD${w.month.replace("-", "")}R${w.rank}`; // fixed per month and rank, so it can only exist once
  const size = `${w.reward_gb}GB`;
  const line = { package: "normal", network: "mtn", size, phone, price: 0 };

  // Only the call that creates this checkout may place the order
  const made = await sql`
    INSERT INTO checkouts (reference, clerk_user_id, lines, amount, status, refund_due, kind, created_at, updated_at)
    VALUES (${ref}, ${w.clerk_user_id}, ${JSON.stringify([line])}::jsonb, 0, 'processing', 0, 'reward', NOW(), NOW())
    ON CONFLICT (reference) DO NOTHING
    RETURNING reference`;

  if (!made.length) {
    // An earlier attempt exists. It is never placed again: if it did not finish, check it by hand.
    const [c] = await sql`SELECT status FROM checkouts WHERE reference = ${ref}`;
    const st = c?.status === "fulfilled" ? "placed" : "review";
    await sql`UPDATE monthly_winners SET status = ${st}, reward_ref = ${ref} WHERE month = ${w.month} AND rank = ${w.rank}`;
    return st;
  }

  try {
    await sql`
      INSERT INTO orders (id, clerk_user_id, checkout_ref, line_no, package, package_name, vendor,
                          network, size, price, phone, payment_ref, source, status, created_at)
      VALUES (${crypto.randomUUID()}, ${w.clerk_user_id}, ${ref}, 1, 'normal', 'mtn_data_normal_delivery', 'datamart',
              'mtn', ${size}, 0, ${phone}, ${ref}, 'reward', 'processing', NOW())
      ON CONFLICT (checkout_ref, line_no) DO NOTHING`;

    // The same function that places paid normal-delivery orders
    const saved = await placeLine({ checkoutReference: ref, lineNo: 1, line });
    const st = String(saved?.status || "processing");
    if (["failed", "refunded", "review"].includes(st)) throw new Error(`vendor status ${st}`);

    await sql`UPDATE checkouts SET status = 'fulfilled', updated_at = NOW() WHERE reference = ${ref}`;
    await sql`UPDATE monthly_winners SET status = 'placed', reward_ref = ${ref}, placed_at = NOW() WHERE month = ${w.month} AND rank = ${w.rank}`;
    return "placed";
  } catch (error) {
    // A timeout or a refusal: never retried automatically
    console.error(`[rewards] could not place ${ref}:`, error.message);
    await sql`UPDATE orders SET status = 'review', updated_at = NOW() WHERE checkout_ref = ${ref} AND line_no = 1`.catch(() => {});
    await sql`UPDATE checkouts SET status = 'review', updated_at = NOW() WHERE reference = ${ref}`.catch(() => {});
    await sql`UPDATE monthly_winners SET status = 'review', reward_ref = ${ref} WHERE month = ${w.month} AND rank = ${w.rank}`.catch(() => {});
    return "review";
  }
}

// Decides one finished month's top 3 and places their orders
async function settleMonth(month, placeLine) {
  // One run per month. A run that stopped half way is taken over after 15 minutes.
  const claimed = await sql`INSERT INTO reward_runs (month) VALUES (${month}) ON CONFLICT (month) DO NOTHING RETURNING month`;
  if (!claimed.length) {
    const taken = await sql`
      UPDATE reward_runs SET started_at = NOW()
      WHERE month = ${month} AND status = 'running' AND started_at < NOW() - INTERVAL '15 minutes'
      RETURNING month`;
    if (!taken.length) return;
  }

  // 1. The winners are saved before any order is placed, so the app can show them straight away
  for (const w of await ranking(month, 3)) {
    await sql`
      INSERT INTO monthly_winners (month, rank, clerk_user_id, display_name, gb, reward_gb, status)
      VALUES (${month}, ${w.rank}, ${w.clerkId}, ${w.name}, ${w.gb}, ${REWARD_GB[w.rank]}, 'pending')
      ON CONFLICT DO NOTHING`;
  }

  // 2. Their free orders, on the phone number of their account
  const pending = await sql`SELECT * FROM monthly_winners WHERE month = ${month} AND status = 'pending' ORDER BY rank`;
  for (const w of pending) {
    const [u] = await sql`SELECT phone FROM public.ecodata_users WHERE clerk_user_id = ${w.clerk_user_id} LIMIT 1`;
    const phone = String(u?.phone || "").trim();
    if (!isMtn(phone)) {
      await sql`UPDATE monthly_winners SET status = 'needs_number' WHERE id = ${w.id}`; // the app asks for an MTN number
      continue;
    }
    await placeReward(w, phone, placeLine);
  }

  await sql`UPDATE reward_runs SET status = 'done', finished_at = NOW() WHERE month = ${month}`;
}

// Settles every finished month that has not been settled yet. Safe to call as often as you like.
let running = false;
export async function runMonthlyRewards(placeLine, { dry = false, month = null } = {}) {
  const current = monthKey(new Date());
  if (month && !dry && (month >= current || month < FIRST_MONTH)) {
    throw new Error("Only a finished month from the first rewarded month can be settled.");
  }

  // A preview: nothing is saved and nothing is placed
  if (dry) {
    const m = month || addMonths(current, -1);
    const winners = [];
    for (const w of await ranking(m, 3)) {
      const [u] = await sql`SELECT phone FROM public.ecodata_users WHERE clerk_user_id = ${w.clerkId} LIMIT 1`;
      winners.push({ rank: w.rank, name: w.name, gb: w.gb, rewardGb: REWARD_GB[w.rank], mtnNumberOnFile: isMtn(String(u?.phone || "").trim()) });
    }
    return { dry: true, month: m, winners };
  }

  if (running) return { skipped: true };
  running = true;
  try {
    const done = new Set((await sql`SELECT month FROM reward_runs WHERE status = 'done'`).map((r) => r.month));
    const months = (month ? [month] : monthsBetween(FIRST_MONTH, addMonths(current, -1))).filter((m) => !done.has(m));
    for (const m of months) await settleMonth(m, placeLine);
    return { settled: months };
  } finally {
    running = false;
  }
}

// A winner with no MTN number on file adds one, and the reward is placed
export async function claimReward(userId, phone, placeLine) {
  if (!isMtn(phone)) return { ok: false, message: "Enter an MTN number to receive the reward." };

  const [w] = await sql`
    UPDATE monthly_winners SET status = 'pending'
    WHERE id = (
      SELECT id FROM monthly_winners
      WHERE clerk_user_id = ${userId} AND status = 'needs_number'
      ORDER BY month DESC LIMIT 1)
    RETURNING *`;
  if (!w) return { ok: false, message: "There is no reward waiting for you." };

  const st = await placeReward(w, phone, placeLine);
  return {
    ok: st === "placed",
    status: st,
    message: st === "placed" ? "Your reward is on its way." : "We could not place it yet. We will check it for you.",
  };
}



export function registerMobileRewardRoutes(app, { placeLine }) {
  // The Top 9 for this month, from the database
  app.get("/api/mobile/leaderboard", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Please sign in to continue." });

      const month = monthKey(new Date());
      const all = await ranking(month);
      const me = all.find((r) => r.clerkId === userId);
      const third = all[2];

      return res.json({
        success: true,
        month,
        label: monthLabel(month),
        rewarded: month >= FIRST_MONTH, // do this month's top 3 win?
        firstPayout: dayLabel(monthStart(addMonths(FIRST_MONTH, 1))),
        endsAt: monthStart(addMonths(month, 1)).toISOString(),
        rewardGb: REWARD_GB,
        top: all
          .slice(0, SHOW_LIMIT)
          .map(({ rank, name, gb, clerkId }) => ({
            rank,
            name,
            gb,
            isMe: clerkId === userId,
          })),
        me: me
          ? {
              rank: me.rank,
              gb: me.gb,
              gapToThird:
                me.rank <= 3 || !third ? 0 : Math.max(third.gb - me.gb, 0) + 1,
            }
          : null,
      });
    } catch (error) {
      console.error("[EcoData mobile leaderboard]", error.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Unable to load the leaderboard right now.",
        });
    }
  });

  // PIECE 4: the winners, claim and internal routes go here
  // The latest winners, for the celebration screen
  app.get("/api/mobile/winners", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      // Catch-up: if the 1st has passed and a month was not settled yet (the server may have been asleep), do it now
      await Promise.race([
        runMonthlyRewards(placeLine).catch((e) => console.error("[rewards] catch-up failed:", e.message)),
        new Promise((r) => setTimeout(r, 4000)),
      ]);

      const [latest] = await sql`SELECT month FROM monthly_winners ORDER BY month DESC LIMIT 1`;
      if (!latest) return res.json({ success: true, month: null, winners: [] });

      const rows = await sql`
        SELECT rank, clerk_user_id, display_name, gb, reward_gb, status
        FROM monthly_winners WHERE month = ${latest.month} ORDER BY rank`;

      return res.json({
        success: true,
        month: latest.month,
        label: monthLabel(latest.month),
        winners: rows.map((r) => ({
          rank: Number(r.rank),
          name: r.display_name,
          gb: Number(r.gb),
          rewardGb: Number(r.reward_gb),
          isMe: r.clerk_user_id === userId,
          status: r.clerk_user_id === userId ? r.status : undefined, // only you see your own status
        })),
      });
    } catch (error) {
      console.error("[EcoData mobile winners]", error.message);
      return res.status(500).json({ success: false, message: "Unable to load the winners right now." });
    }
  });

  // A winner without an MTN number on file adds one
  app.post("/api/mobile/winners/claim", async (req, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ success: false, message: "Please sign in to continue." });

      const out = await claimReward(userId, String(req.body?.phone || "").trim(), placeLine);
      return res.status(out.ok || out.status ? 200 : 400).json({ success: !!out.ok, status: out.status ?? null, message: out.message });
    } catch (error) {
      console.error("[EcoData mobile winners claim]", error.message);
      return res.status(500).json({ success: false, message: "Unable to place the reward right now." });
    }
  });

  // For a scheduled job or for you: runs the monthly settlement. ?dry=1 shows the winners without placing anything.
  app.post("/api/internal/rewards/run", async (req, res) => {
    const secret = Buffer.from(process.env.CRON_SECRET || "");
    const sent = Buffer.from(String(req.headers["x-cron-secret"] || ""));
    if (!secret.length || secret.length !== sent.length || !crypto.timingSafeEqual(secret, sent)) {
      return res.status(401).json({ success: false });
    }
    try {
      const month = /^\d{4}-\d{2}$/.test(String(req.query.month || "")) ? String(req.query.month) : null;
      const out = await runMonthlyRewards(placeLine, { dry: req.query.dry === "1", month });
      return res.json({ success: true, ...out });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });
}

// Checks every 10 minutes whether a month has ended. It does nothing unless a month is waiting.
export function startMonthlyRewards(placeLine) {
  const tick = () => runMonthlyRewards(placeLine).catch((e) => console.error("[reward] run failed:", e.message));
  setTimeout(tick, 30_000); // Soon after the server starts, in case it was asleep on the 1st
  setInterval(tick, 10 * 60_000);
}
