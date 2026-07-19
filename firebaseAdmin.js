import { initializeApp, cert, apps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export { db };
