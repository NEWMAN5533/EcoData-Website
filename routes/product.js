import { express } from "express";
import { db } from "../frontend/firebaseAdmin";


const productRouter = express.Router();

// Store image in memory (we'll convert to base64 or upload later)
const upload = multer({ storage: multer.memoryStorage() });

// ==============
// UPLOAD PRODUCT
//===============
productRouter.post("/upload-product",
  upload.single("image"), async (req, res ) => {
    try {
      const { name, price, description, storeId } = req.body;

      if(!name || !price || !storeId) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Check store
      const storeDoc = await
      db.collection("stores").doc(storeId).get();

      if(!storeDoc.exists) {
        return res.status(403).json({ error:
          "Subscription inactive" });
      }

      // CHECK PRODUCT LIMIT
      const productsSnap = await db.collection("products").where("storeId", "==", storeId).get();

      if(productsSnap.size >= storeDoc.maxProducts) {
        return res.status(403).json({ error:
          "Upload limit reached" });
      }

      // Handle image
      let imageUrl = "";

      if(req.file) {
        const base64 = req.file.buffer.toString("base64");
        imageUrl = `data:${req.file.mimetype};base64,${base64}`;
      }

      // save product
      const docRef = await db.collection("products").add({
        name,
        price: Number(price),
        description: description || "",
        image: imageUrl,
        storeId,
        createdAt: new Date(),
      });

      res.json({
        success: true,
        id: docRef.id,
      });

    } catch (err) {
      console.error(err);
      res.json(500).json({ error: "Server error" });
    }
  }
);

//=====================
// GET PRODUCTS
//===================
productRouter.get("/get-products", async (req,res) => {
  try {
    const { storeId } = req.query;

    if(!storeId) {
      return res.status(400).json({ error: "Missing storeId" });
    }

    const snapshot = await db.collection("products").where("storeId", storeId).orderBy("createdAt", "desc").get();

    const products = [];

    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ products });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error"});
  }
});

// ==================
// DELETE PRODUCT
//===================
productRouter.delete("/delete-product/:id", async (req, res ) => {
  try {
    const { id } = req.params;

    await db.collection("products").doc(id).delete();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error"});
  }
});

export default productRouter;