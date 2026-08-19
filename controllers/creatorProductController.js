
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
      resource_type: "image",
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


//====================================
// UPDATE CREATOR PRODUCT
//====================================
export async function updateCreatorProduct(req, res) {
  try {

    const productId =
      String(req.params.productId || "").trim();

    const sellerId =
      String(req.body.sellerId || "").trim();

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required."
      });
    }

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required."
      });
    }

    //================================
    // FIND PRODUCT
    //================================

    const productRef =
      db.collection("products").doc(productId);

    const productSnap =
      await productRef.get();

    if (!productSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    const product =
      productSnap.data();

    //================================
    // OWNERSHIP CHECK
    //================================

    if (product.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this product."
      });
    }

    //================================
    // GET UPDATE VALUES
    //================================

    const {
      title,
      description,
      category,
      price,
      type,
      youtubeUrl,
      affiliateUrl
    } = req.body;

    const updates = {};

    if (title !== undefined) {

      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product title cannot be empty."
        });
      }

      updates.title =
        String(title).trim();
    }

    if (description !== undefined) {

      if (!String(description).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product description cannot be empty."
        });
      }

      updates.description =
        String(description).trim();
    }

    if (category !== undefined) {
      updates.category =
        String(category).trim() || "Other";
    }

    if (price !== undefined) {

      const productPrice =
        Number(price);

      if (
        !Number.isFinite(productPrice) ||
        productPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price."
        });
      }

      updates.price =
        productPrice;
    }

    //================================
    // TYPE
    //================================

    if (type !== undefined) {

      const validTypes = [
        "ebook",
        "notes",
        "video",
        "template",
        "zip",
        "affiliate"
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product type."
        });
      }

      updates.type = type;
    }

    //================================
    // TYPE-SPECIFIC URLS
    //================================

    if (youtubeUrl !== undefined) {
      updates.youtubeUrl =
        String(youtubeUrl).trim() || null;
    }

    if (affiliateUrl !== undefined) {
      updates.affiliateUrl =
        String(affiliateUrl).trim() || null;
    }

    //================================
    // UPDATED TIME
    //================================

    updates.updatedAt =
      FieldValue.serverTimestamp();

    //================================
    // SAVE
    //================================

    await productRef.update(updates);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      productId
    });

  } catch (error) {

    console.error(
      "Update creator product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update product."
    });
  }
}


//====================================
// DELETE CREATOR PRODUCT
//====================================
export async function deleteCreatorProduct(req, res) {
  try {

    const productId =
      String(req.params.productId || "").trim();

    const sellerId =
      String(req.query.sellerId || "").trim();


    //================================
    // VALIDATION
    //================================

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required."
      });
    }

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required."
      });
    }


    //================================
    // FIND PRODUCT
    //================================

    const productRef =
      db.collection("products").doc(productId);

    const productSnap =
      await productRef.get();


    if (!productSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }


    const product =
      productSnap.data();


    //================================
    // OWNERSHIP CHECK
    //================================

    if (product.sellerId !== sellerId) {

      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this product."
      });

    }


    //================================
    // PREVENT DELETING SOLD PRODUCTS
    //================================

    const sales =
      Number(product.sales || 0);


    if (sales > 0) {

      return res.status(400).json({
        success: false,
        message:
          "This product cannot be deleted because it has sales."
      });

    }


    //================================
    // DELETE COVER FROM CLOUDINARY
    //================================

    if (product.coverPublicId) {

      try {

        await cloudinary.uploader.destroy(
          product.coverPublicId,
          {
            resource_type: "image"
          }
        );

      } catch (error) {

        console.error(
          "Cover deletion failed:",
          error
        );

      }

    }


    //================================
    // DELETE PRODUCT FILE
    //================================

    if (product.filePublicId) {

      try {

        await cloudinary.uploader.destroy(
          product.filePublicId,
          {
            resource_type: "raw"
          }
        );

      } catch (error) {

        console.error(
          "Product file deletion failed:",
          error
        );

      }

    }


    //================================
    // DELETE FIRESTORE PRODUCT
    //================================

    await productRef.delete();


    console.log(
      "Product deleted successfully:",
      productId
    );


    return res.status(200).json({

      success: true,

      message:
        "Product deleted successfully.",

      productId

    });


  } catch (error) {

    console.error(
      "Delete creator product error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to delete product."

    });

  }
}



// ==========================================
// GET CREATOR DASHBOARD
// ==========================================
export async function getCreatorDashboard(req, res) {
  try {

    const sellerId =
      String(req.query.sellerId || "").trim();

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "SellerId is required."
      });
    }

    console.log(
      "Loading dashboard for seller:",
      sellerId
    );

    // ======================================
    // LOAD EVERYTHING IN PARALLEL
    // ======================================

    const [
      productsSnapshot,
      salesSnapshot,
      withdrawalsSnapshot
    ] = await Promise.all([

      db
        .collection("products")
        .where("sellerId", "==", sellerId)
        .get(),

      db
        .collection("sales")
        .where("sellerId", "==", sellerId)
        .get(),

      db
        .collection("withdrawals")
        .where("sellerId", "==", sellerId)
        .get()

    ]);


    // ======================================
    // PRODUCTS
    // ======================================

    const products =
      productsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {

          const getTime = value => {

            if (!value) return 0;

            if (
              typeof value.toMillis === "function"
            ) {
              return value.toMillis();
            }

            if (
              typeof value.seconds === "number"
            ) {
              return value.seconds * 1000;
            }

            const time =
              new Date(value).getTime();

            return Number.isNaN(time)
              ? 0
              : time;
          };

          return (
            getTime(b.createdAt) -
            getTime(a.createdAt)
          );

        });


    const totalProducts =
      products.length;


    const publishedProducts =
      products.filter(
        product =>
          String(product.status || "")
            .toLowerCase() === "published"
      ).length;


    const pendingProducts =
      products.filter(
        product =>
          String(product.status || "")
            .toLowerCase() === "pending"
      ).length;


    // ======================================
    // SALES
    // ======================================

    const sales =
      salesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {

          const getTime = value => {

            if (!value) return 0;

            if (
              typeof value.toMillis === "function"
            ) {
              return value.toMillis();
            }

            if (
              typeof value.seconds === "number"
            ) {
              return value.seconds * 1000;
            }

            const time =
              new Date(value).getTime();

            return Number.isNaN(time)
              ? 0
              : time;
          };

          return (
            getTime(b.createdAt) -
            getTime(a.createdAt)
          );

        });


    const totalSales =
      sales.length;


    // ======================================
    // TOTAL EARNINGS
    // ======================================

    let totalEarnings = 0;

    sales.forEach(sale => {

      const creatorShare =
        Number(sale.creatorShare || 0);

      if (Number.isFinite(creatorShare)) {
        totalEarnings += creatorShare;
      }

    });


    // ======================================
    // TOTAL VIEWS
    // ======================================

    let totalViews = 0;

    products.forEach(product => {

      const views =
        Number(product.views || 0);

      if (Number.isFinite(views)) {
        totalViews += views;
      }

    });


    // ======================================
    // CONVERSION RATE
    // ======================================

    const conversionRate =
      totalViews > 0
        ? (totalSales / totalViews) * 100
        : 0;


    // ======================================
    // WITHDRAWALS
    // ======================================

    const withdrawals =
      withdrawalsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {

          const getTime = value => {

            if (!value) return 0;

            if (
              typeof value.toMillis === "function"
            ) {
              return value.toMillis();
            }

            if (
              typeof value.seconds === "number"
            ) {
              return value.seconds * 1000;
            }

            const time =
              new Date(value).getTime();

            return Number.isNaN(time)
              ? 0
              : time;
          };

          return (
            getTime(b.requestedAt) -
            getTime(a.requestedAt)
          );

        });


    // ======================================
    // PAID WITHDRAWALS
    // ======================================

    let withdrawalAmount = 0;

    withdrawals.forEach(withdrawal => {

      if (withdrawal.paid === true) {

        const amount =
          Number(withdrawal.amount || 0);

        if (Number.isFinite(amount)) {
          withdrawalAmount += amount;
        }

      }

    });


    // ======================================
    // AVAILABLE BALANCE
    // ======================================

    const availableBalance =
      Math.max(
        0,
        totalEarnings - withdrawalAmount
      );


    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({

      success: true,

      dashboard: {

        totalProducts,

        publishedProducts,

        pendingProducts,

        totalSales,

        totalEarnings:
          Number(
            totalEarnings.toFixed(2)
          ),

        availableBalance:
          Number(
            availableBalance.toFixed(2)
          ),

        conversionRate:
          Number(
            conversionRate.toFixed(2)
          ),

        views:
          totalViews,

        withdrawalAmount:
          Number(
            withdrawalAmount.toFixed(2)
          )

      },

      products,

      sales,

      withdrawals

    });


  } catch (error) {

    console.error(
      "Get creator dashboard failed:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to load dashboard."

    });

  }
}
//=======================
// GET CREATOR SALES
//=======================
export async function getCreatorSales(req, res){

  try{

    const sellerId = String(req.query.sellerId || "").trim();

    if(!sellerId) {
      return res.status(400).json({
        success: false,
        message: "SellerId is required."
      });
    }
    console.log("Loading sales for seller:", sellerId
    );

    const snapshot = await db
    .collection("sales")
    .where("sellerId", "==", sellerId)
    .get();

    const sales = snapshot.docs
    .map(doc => {
      const data = doc.data();

      return{
        id: doc.id,
        ...data
      };
    }).sort((a,b) => {
      const getTime = value => {
        if(!value) return 0;

        if(typeof value.toMillis === "function"){
          return value.toMillis();
        }

        if(typeof value.seconds === "number"){
          return value.seconds * 1000;
        }

        const time =
        new Date(value).getTime();

        return Number.isNaN(time)
        ? 0
        : time;
      };

      return (
        getTime(b.createdAt) -
        getTime(a.createdAt)
      );
    });

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales
    });
    // Error block
  } catch(error){
    console.error(
      "Get creator sales error:", error
    );
    
    return res.status(500).json({
      success: false,
      message: "Unable to load creator sales."
    });
  }
}

//=======================
// GET CREATOR WITHDRAWALS
//==========================
export async function getCreatorWithdrawals(req, res){
  try{
    const sellerId = String(req.query.sellerId || "").trim();

    if(!sellerId){
      return res.status(400).json({
        success: false,
        message: "SellerId is required."
      });
    }

    const snapshot = await db
    .collection("withdrawals")
    .where("sellerId", "==", sellerId)
    .get();

    const withdrawals = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data
      };
    }).sort((a,b) => {

      const getTime = value => {
        if(!value) return 0;

        if(typeof value.toMillis === "function"){
          return value.toMillis();
        }

        if(typeof value.seconds === "number"){
          return value.seconds * 1000;
        }

        const time =
        new Date(value).getTime();

        return Number.isNaN(time)
        ? 0
        : time;
      };

      return (
        getTime(b.requestedAt) -
        getTime(a.requestedAt)
      );
    });

    return res.status(200).json({
      success: true,
      count: withdrawals.length,
      withdrawals
    });

    // error block
  } catch(error){
    console.error("Get creator withdrawals error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdrawals."
    });
  }
}
