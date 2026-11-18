import express from "express";
import admin from "firebase-admin";
import { db } from "../firebaseAdmin.js";

const adminSpinRouter = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token)
      return res.status(401).json({ success: false, message: "Sign in required" });

    const decoded = await admin.auth().verifyIdToken(token);

    let isAdmin = decoded.admin === true;
    if (!isAdmin) {
      const snap = await db.collection("admins").doc(decoded.uid).get();
      isAdmin = snap.exists;
    }
    if (!isAdmin)
      return res.status(403).json({ success: false, message: "Admins only" });

    req.adminUser = decoded.email || decoded.uid;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid session" });
  }
}

const toMs = v => (v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);

// GET /api/admin/spin/winners?status=pending|sent
adminSpinRouter.get("/winners", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status === "sent" ? "sent" : "pending";

    // No orderBy here, so no composite index is needed
    const snap = await db.collection("spinRewards")
      .where("status", "==", status).get();

    const winners = snap.docs
      .map(d => {
        const x = d.data();
        return {
          id: d.id,
          phone: x.phone,
          gb: x.gb,
          status: x.status,
          note: x.note || "",
          assignedBy: x.assignedBy || "",
          createdAt: toMs(x.createdAt),
          assignedAt: toMs(x.assignedAt)
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 300);

    res.json({
      success: true,
      winners,
      totalGB: winners.reduce((sum, w) => sum + (w.gb || 0), 0)
    });
  } catch (err) {
    console.error("Load winners failed:", err.message);
    res.status(500).json({ success: false, message: "Could not load winners" });
  }
});

// POST /api/admin/spin/winners/:id/assign   { note? }
adminSpinRouter.post("/winners/:id/assign", requireAdmin, async (req, res) => {
  const ref = db.collection("spinRewards").doc(req.params.id);

  try {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NOT_FOUND");
      if (snap.data().status !== "pending") throw new Error("ALREADY");

      tx.update(ref, {
        status: "sent",
        assignedBy: req.adminUser,
        assignedAt: new Date(),
        note: String(req.body?.note || "").slice(0, 200)
      });
    });

    res.json({ success: true });
  } catch (err) {
    if (err.message === "NOT_FOUND")
      return res.status(404).json({ success: false, message: "Winner not found" });
    if (err.message === "ALREADY")
      return res.status(409).json({ success: false, message: "Already marked as sent" });

    console.error("Assign failed:", err.message);
    res.status(500).json({ success: false, message: "Could not update" });
  }
});

export default adminSpinRouter;