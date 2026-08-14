
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  uploadToCloudinary
} from "../services/cloudinaryUpload.js";

const db = getFirestore();

export async function createProduct(req, res){
  try{
    const {
      title,
      description,
      category,
      price,
      type,
      youtubeUrl,
      affiliateUrl,
      sellerId,
    } = req.body;

    //======================
    // BASIC VALIDATION
    //======================
    if(!title?.trim()){
      return res.status(400).json({
        success: false,
        message: "Product title is required."
      });
    }

    if(!description?.trim()){
      return res.status(400).json({
        success: false,
        message: "Product description required."
      });
    }

    if(!type){
      return res.status(400).json({
        success: false,
        message: "product type required."
      });
    }

    const validTypes = [
      "ebook",
      "notes",
      "video",
      "template",
      "zip",
      "affiliate"
    ];

    if(!validTypes.includes(type)){
      return res.status(400).json({
        success: false,
        message: "Invalid product type."
      });
    }

    const productPrice = Number(price);

    if(!Number.isFinite(productPrice) || 
  productPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid product price."
    });
  }

  //==========================
  // TYPE-SPECIFIC VALIDATION
  //==========================
  const cover = req.files?.cover?.[0];
  const file = req.files?.file?.[0];

  let coverUpload = null;
  let fileUpload = null;

  if(cover) {
    coverUpload = await uploadToCloudinary(cover.buffer, {
      resourceType: "image",
      folder: "ecodata/products/covers"
    }
  );
  }

  //===========================
  // DIGITAL FILE UPLOAD
  //===========================
  if(
    file && (type === "ebook" || type === "notes" || type === "template" || type === "zip")
  ) {
    fileUpload = await uploadToCloudinary(file.buffer, {
      resourceType: "raw",
      folder: `ecodata/products/${type}`
    });
  }

  //=====================
  // EDUCATIONAL VIDEOS
  //=====================
  if(type === "video"){
    if(!youtubeUrl?.trim()){
      return res.status(400).json({
        success: false,
        message: "YouTube video link is required."
      });
    }
  }

  if(
    type === "ebook" ||
    type === "notes" ||
    type === "template" ||
    type === "zip"
  ) {
    if(!file){
      return res.status(400).json({
        success: false,
        message: "Product file is required."
      });
    }
  }

  if(type === "video"){
    if(!youtubeUrl && !file){
      return res.status(400).json({
        success: false,
        message: "Provide a YouTube link or upload a video."
      });
    }
  }

  if(type === "affiliate"){
    if(!affiliateUrl?.trim()){
      return res.status(400).json({
        success: false,
        message: "Affiliate URL is required."
      });
    }
  }

  //======================
  // CREATE PRODUCT
  //======================
  const productRef = 
  db.collection("products").doc();

  const product = {
    productId: productRef.id,
    title: title.trim(),
    description: description.trim(),
    category: category?.trim() || "Other",
    type,
    price: productPrice,
    sellerId: sellerId || null,
    status: "pending",
    sales: 0,
    views: 0,
    coverUrl: coverUpload?.secure_url || null,
    coverPublicId: coverUpload?.public_id || null,
    fileUrl: fileUpload?.secure_url || null,
    filePublicId: fileUpload?.public_id|| null,
    youtubeUrl: youtubeUrl || null,
    affiliateUrl: affiliateUrl || null,
    creatorSharePercent: 70,
    platformSharePercent: 30,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await productRef.set(product);

  console.log("Product created:", productRef.id);
  return res.status(201).json({
    success: true,
    message: "Product submitted for approval.", 
    productId: productRef.id
  });

 // catch block
  } catch(error){
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create product."
    });
  }
}

//==============================
// GET CREATOR PRODUCTS
//==============================
export async function getCreatorProducts(req, res){
  try{

  const sellerId = String(req.query.sellerId || "").trim();

  if(!sellerId){
    return res.status(400).json({
      success: false,
      message: "SellerId is not found."
    });
  }
  console.log("Loading product for seller:", sellerId);

  //Simple firestore query.
  //No orderBy = No composite index
  const snapshot = await db 
  .collection("products")
  .where("sellerId", "==", sellerId)
  .get();

  console.log("Products found:", snapshot.size
  );

  const products = snapshot.docs.map(doc => {
    const data = doc.data();
    return{
      id: doc.id,
      ...data
    };
  }).sort((a,b) => {
    const getTime = value =>{
      if(!value) return 0;

      // timestamp
      if(typeof value.toMillis === "function"){
        return value.toMillis();
      }

      //timestamp with seconds
      if(typeof value.seconds === "number"){
        return value.seconds * 1000;
      }

      // js Date/String
      const time = new Date(value).getTime();
      return Number.isNaN(time)
      ? 0
      : time;
    };
    return(
      getTime(b.createdAt) -
      getTime(a.createdAt)
    );
  });
  return res.status(200).json({
    success: true,
    count: products.length, 
    products
  });
} catch(error){
  console.error(
    "Get creator products error:", error
  );

  return res.status(500).json({
    success: false,
    message: "Unable to load creator products.", 
    error: error.message
  });
}
} 