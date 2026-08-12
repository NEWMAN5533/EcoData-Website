
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

  if(file && type !== "video"){
    fileUpload = await uploadToCloudinary(file.buffer,{
      resourceType: "raw",
      folder: `ecodata/products/${type}`
    }
  );
  }

  if(file && type === "video"){
    fileUpload = await uploadToCloudinary(file.buffer, {
      resourceType: "video",
      folder: "ecodata/products/videos"
    }
  );
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
