// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

// Routes
import storeRouter from "./routes/storesRoute.js";
import paystackWebhookRouter from "./routes/paystackWebhookRouter.js";

import { verifySellingPrice } from "./frontend/sellingPrice.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";
import adminRoute from "./routes/adminOrderUpdate.js";
import syncOrderRoute from "./routes/syncOrderStatus.js";
import validateRecipientRoute from "./routes/validateRecipient.js";
import restrictionsRoute from "./routes/restrictions.js";
import exclusiveAgentRoute from "./routes/exclusivePage.js";
import afaRegisterRouter from "./routes/afaRegisterRoute.js";
import afaStatusRouter from "./routes/afaStatusRouter.js";
import getVoucherRouter from "./routes/getVouchersRoute.js";
import postVoucherRouter from "./routes/postVoucherRouter.js";
import failedOrderCheckRouter from "./routes/failedOrderCheckRouter.js";





/* =========================================
   VENDOR MANAGEMENT
========================================= */
import vendorManagementRouter from "./routes/vendorManagementRoute.js";
import { getActiveVendor } from "./services/vendorManager.js";
import {
  getDataMartSellingPrice,
  checkDataMartProfit,
} from "./services/datamartSellingPrice.js";

/* =========================================
   DATAMART SERVICE
========================================= */
import {
  purchaseWithDataMart,
  getDataMartOrderStatus,
  getDataMartPackages,
  matchDataMartPackage,
  mapNetworkToDataMart
} from "./services/dataMartService.js";

/* =========================================
   DATAMART ORDER REPOSITORY
========================================= */
import {
  createDataMartOrder,
  updateDataMartOrder,
  getDataMartOrderByPaymentReference,
  getDataMartOrderByProviderReference
} from "./services/dataMartOrderRepository.js";

/* =========================================
   DATAMART RECIPIENT VERIFICATION
========================================= */
import dataMartRecipientVerificationRoute
  from "./routes/dataMartRecipientVerificationRoute.js";
import vendorSettingsRouter from "./routes/vendorSettingsRoute.js";
import vendorStatusRouter from "./routes/vendorStatus.js";




//=============================
// ECODATA STORE ROUTES
//=============================

// AUTH.USER
import { requireAuth, initializeClerk } from "./middleware/clerkAuth.js";
import { getAuth } from "@clerk/express";

// AUTH.USER.PROFILE
import accountRouter from "./routes/accountRoute.js";
import profileRouter from "./routes/profileRoute.js";


// AUTH.SELLER (PROFILE & LOGICS)
import sellerProfileRouter from "./routes/sellerProfileRoute.js";
import sellerLogoRouter from "./routes/sellerLogoRoute.js";
import sellerProductsRouter from "./routes/sellerProducts.js";
import createProductRouter from "./routes/product.js";
import sellerSettingsRouter from "./routes/sellerSettingsRoute.js";



// AUTH.ADMIN
import { admin, db } from "./firebaseAdmin.js";
import { startOrderSyncJob } from "./cron/syncOrders.js";
import adminTestRouter from "./routes/adminTestRoute.js";
import adminAccessDashboardRouter from "./routes/adminDashboardRoute.js";
import adminSellersRouter from "./routes/adminSellersMap.js";








dotenv.config();

startOrderSyncJob();

// --dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize Express
const app = express();

// Middleware
app.use(cors());

// capture raw body
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));

// ROUTES
app.use("/api/validate-recipient", validateRecipientRoute);
app.use("/api/restrictions", restrictionsRoute);
app.use("/api/paystack/webhook", paystackWebhookRouter);


app.use("/api/admin", adminRoute);
app.use("/api/admin", syncOrderRoute);
app.use("/api/verify-payment", exclusiveAgentRoute);
app.use("/api/afa", afaRegisterRouter(verifyPaystack));
app.use("/api/afa/status", afaStatusRouter);
app.use("/api/live-order-status", failedOrderCheckRouter);
app.use("/api/vouchers", getVoucherRouter);
app.use("/api/vouchers", postVoucherRouter);


// ecodata store upp.use()
app.use(initializeClerk);

//========================
// VENDOR MANAGEMENT ROUTES
//========================
app.use("/api/admin/vendor", vendorManagementRouter);
app.use("/api/vendor-status", vendorStatusRouter);
app.use("/api/admin/vendor", vendorSettingsRouter);
app.use("/api/verify-recipient", dataMartRecipientVerificationRoute);

app.use("/api/initiate-subscription", subscriptionRouter);
app.use("/api/create-store", storeRouter);



app.use("/api/creator/products", createProductRouter);
app.use("/api/creator/dashboard", createProductRouter );
app.use("/api/creator/withdrawals", createProductRouter);
app.use("/api/creator/sales", createProductRouter);


// CLERK AUTHENTICATION TEST
app.use("/api/account", accountRouter);

app.get("/api/auth/me", requireAuth, (req, res) => {
  const {userId} = getAuth(req);

  return res.status(200).json({
    success: true,
    message: "Authentication successful,",
    user: {
      clerkUserId: userId
    }
  });
});

// CHECK AUTHENTICATION ENDS

// USER PROFILE ROUTE
app.use("/api/profile", profileRouter);
// SELLER PROFILE ROUTE
app.use("/api/seller", sellerProfileRouter);
app.use("/api/seller/logo", sellerLogoRouter)
app.use("/api/seller/products", sellerProductsRouter);
app.use("/api/seller-settings", sellerSettingsRouter);

// ADMIN ROUTES
app.use("/api/admin", adminTestRouter);
app.use("/api/admin", adminAccessDashboardRouter);
app.use("/api/admin/sellers", adminSellersRouter);



// 🚨 Prevent duplicate orders (Memory Cache)
const processedOrders = new Map();

/*
  Structure:
  processedOrders.set(paymentReference, {
      status: "success" | "failed",
      response: {...}   // SwiftData response
  });
*/

async function verifyPaystack(paymentReference, retries = 3) {

  for (let attempt = 1; attempt <= retries; attempt++) {

    try {

      const verification = await axios.get(
        `https://api.paystack.co/transaction/verify/${paymentReference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
          timeout: 15000,
        }
      );

      console.log(
        `✅ Paystack verified on attempt ${attempt}`
      );

      return verification;

    } catch (err) {

      console.log(
        `⚠️ Paystack verify attempt ${attempt}/${retries} failed`
      );

      if (attempt === retries) {
        throw err;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 2000)
      );
    }
  }
}

// Helper: common logic for buy-data (POST or GET)
// ================================
// HANDLE BUY DATA REQUEST (FIXED)
// ================================



const PAYSTACK_FEE_RATE = 0.0195;

function getCheckoutPrice(basePrice) {
  return Number(
    (Number(basePrice) * (1 + PAYSTACK_FEE_RATE)).toFixed(2)
  );
}

function sameMoney(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

function existingDataMartOrderResponse(order) {
  return {
    provider: "datamart",
    paymentReference: order.paymentReference,
    providerOrderReference: order.providerOrderReference ?? null,
    transactionReference: order.providerTransactionReference ?? null,
    purchaseId: order.providerPurchaseId ?? null,
    network: order.network,
    capacity: order.capacityGb,
    sellingPrice: order.sellingPrice,
    providerPrice: order.providerPrice ?? null,
    orderStatus: order.orderStatus,
  };
}

export async function handleBuyDataRequest({
  network,
  recipient,
  pkg,
  size,
  paymentReference,
}) {
  if (
    !network ||
    !recipient ||
    !pkg ||
    !paymentReference ||
    size === undefined
  ) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: "Missing required fields.",
      },
    };
  }

  const reference = String(paymentReference).trim();

  if (!reference) {
    return {
      ok: false,
      status: 400,
      body: {
        success: false,
        message: "Invalid payment reference.",
      },
    };
  }

  // Prevent duplicate requests within this server process.
  if (processedOrders.has(reference)) {
    const existing = processedOrders.get(reference);

    return {
      ok: existing.status !== "failed",
      status: existing.status === "failed" ? 400 : 200,
      body: {
        success: existing.status !== "failed",
        message: "This payment reference has already been processed.",
        order: existing.response,
      },
    };
  }

  try {
    // 1. Verify payment server-side.
    const verification = await verifyPaystack(reference);
    const transaction = verification?.data?.data;

    if (
      transaction?.status !== "success" ||
      transaction.reference !== reference
    ) {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Payment verification failed.",
        },
      };
    }

    const amountPesewas = Number(transaction.amount);

    if (!Number.isFinite(amountPesewas) || amountPesewas <= 0) {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "Invalid payment amount.",
        },
      };
    }

    const actualAmountGHS = amountPesewas / 100;

    // 2. Read the configured vendor before selecting price rules.
    const activeVendor = await getActiveVendor();

    console.log("Selected bundle vendor:", activeVendor);

    // =====================================================
    // DATAMART
    // =====================================================
    if (activeVendor === "datamart") {
      // Check Neon first. A previously recorded payment must
      // not be resubmitted, even if prices have since changed.
      const existingOrder =
        await getDataMartOrderByPaymentReference(reference);

      if (existingOrder) {
        const orderResponse =
          existingDataMartOrderResponse(existingOrder);

        const orderStatus = existingOrder.orderStatus;

        processedOrders.set(reference, {
          status: orderStatus === "failed" ? "failed" : "processing",
          response: orderResponse,
        });

        if (orderStatus === "completed") {
          return {
            ok: true,
            status: 200,
            body: {
              success: true,
              message: "This DataMart order was already processed.",
              order: orderResponse,
            },
          };
        }

        if (orderStatus === "failed") {
          return {
            ok: false,
            status: 409,
            body: {
              success: false,
              message:
                "This DataMart order previously failed. Check its saved record before taking further action.",
              order: orderResponse,
            },
          };
        }

        return {
          ok: false,
          status: 202,
          body: {
            success: false,
            message:
              "This DataMart order is already recorded and was not resubmitted.",
            order: orderResponse,
          },
        };
      }

      // 3. Validate against DataMart's own fixed selling price.
      // This base price EXCLUDES the Paystack fee.
      const baseSellingPrice = getDataMartSellingPrice(
        network,
        size
      );

      // The fee is used only to validate what the buyer paid.
      const expectedCheckoutPrice =
        getCheckoutPrice(baseSellingPrice);

      if (!sameMoney(actualAmountGHS, expectedCheckoutPrice)) {
        return {
          ok: false,
          status: 400,
          body: {
            success: false,
            message:
              "The payment amount does not match the configured DataMart selling price.",
          },
        };
      }

      // 4. Retrieve the current provider package and its cost.
      const packages = await getDataMartPackages(network);

      const matchedPackage = matchDataMartPackage(
        {
          network,
          size,
          price: baseSellingPrice,
        },
        packages
      );

      if (!matchedPackage) {
        return {
          ok: false,
          status: 400,
          body: {
            success: false,
            message:
              "This bundle is not currently available from DataMart.",
          },
        };
      }

      // 5. Enforce at least GH₵1.00 gross profit.
      // Paystack fees are deliberately excluded here.
      const profitCheck = checkDataMartProfit({
        network,
        volume: size,
        providerCost: matchedPackage.providerPrice,
      });

      console.log("DataMart pricing check:", {
        network,
        size: Number(size),
        sellingPrice: profitCheck.sellingPrice,
        providerCost: profitCheck.providerCost,
        grossProfit: profitCheck.grossProfit,
        minimumProfit: profitCheck.minimumProfit,
        profitable: profitCheck.profitable,
      });

      const idempotencyKey = `ecodata-${reference}`;

      // Save the verified payment and base selling price.
      // Never store the fee-inclusive amount as sellingPrice.
      const result = await createDataMartOrder({
        paymentReference: reference,
        idempotencyKey,
        customerPhone: String(recipient).trim(),
        network: mapNetworkToDataMart(network),
        capacityGb: Number(size),
        sellingPrice: profitCheck.sellingPrice,
      });

      const savedOrder = result.order;

      // A concurrent request may have inserted the same order.
      if (!result.created) {
        const orderResponse =
          existingDataMartOrderResponse(savedOrder);

        return {
          ok: false,
          status: 202,
          body: {
            success: false,
            message:
              "This DataMart payment is already recorded. No additional purchase was submitted.",
            order: orderResponse,
          },
        };
      }

      // Record provider cost even if the order is blocked
      // by the minimum-profit rule.
      if (!profitCheck.profitable) {
        const errorMessage =
          `DataMart order blocked: gross profit GH₵${profitCheck.grossProfit.toFixed(2)} ` +
          `is below the required GH₵${profitCheck.minimumProfit.toFixed(2)}.`;

        const blockedOrder = await updateDataMartOrder(reference, {
          orderStatus: "failed",
          providerPrice: profitCheck.providerCost,
          lastError: errorMessage,
          providerResponse: {
            reason: "minimum_profit_not_met",
            sellingPrice: profitCheck.sellingPrice,
            providerCost: profitCheck.providerCost,
            grossProfit: profitCheck.grossProfit,
            minimumProfit: profitCheck.minimumProfit,
          },
        });

        const orderResponse =
          existingDataMartOrderResponse(blockedOrder);

        processedOrders.set(reference, {
          status: "failed",
          response: orderResponse,
        });

        console.error(errorMessage);

        return {
          ok: false,
          status: 409,
          body: {
            success: false,
            message:
              "This bundle cannot be purchased through DataMart because it does not meet the minimum GH₵1.00 gross-profit requirement. The verified payment has been recorded for review.",
            order: orderResponse,
          },
        };
      }

      // 6. Submit the purchase only after all checks pass.
      try {
        const providerOrder = await purchaseWithDataMart({
          phoneNumber: recipient,
          network,
          capacity: size,
          idempotencyKey: savedOrder.idempotencyKey,
        });

        const normalizedStatus = normalizeDataMartStatus(
          providerOrder.orderStatus
        );

        const updatedOrder = await updateDataMartOrder(reference, {
          orderStatus: normalizedStatus,
          providerOrderReference: providerOrder.orderReference,
          providerTransactionReference:
            providerOrder.transactionReference,
          providerPurchaseId: providerOrder.purchaseId,
          providerPrice: providerOrder.price,
          providerResponse: providerOrder,
          lastError: null,
        });

        const orderResponse = {
          provider: "datamart",
          paymentReference: reference,
          providerOrderReference:
            providerOrder.orderReference ?? null,
          transactionReference:
            providerOrder.transactionReference ?? null,
          purchaseId: providerOrder.purchaseId ?? null,
          network: providerOrder.network,
          capacity: providerOrder.capacity,
          sellingPrice: profitCheck.sellingPrice,
          checkoutAmount: actualAmountGHS,
          providerPrice: providerOrder.price ?? null,
          grossProfit: profitCheck.grossProfit,
          orderStatus: updatedOrder.orderStatus,
        };

        processedOrders.set(reference, {
          status:
            updatedOrder.orderStatus === "failed"
              ? "failed"
              : "processing",
          response: orderResponse,
        });

        return {
          ok: updatedOrder.orderStatus !== "failed",
          status:
            updatedOrder.orderStatus === "failed" ? 400 : 200,
          body: {
            success: updatedOrder.orderStatus !== "failed",
            message:
              updatedOrder.orderStatus === "completed"
                ? "Data bundle purchased successfully."
                : "DataMart accepted the purchase request.",
            order: orderResponse,
          },
        };
      } catch (providerError) {
        const httpStatus = providerError.providerHttpStatus;

        const definitelyRejected =
          Number.isInteger(httpStatus) &&
          httpStatus >= 400 &&
          httpStatus < 500 &&
          httpStatus !== 408 &&
          httpStatus !== 429;

        const savedFailure = await updateDataMartOrder(reference, {
          orderStatus: definitelyRejected ? "failed" : "unknown",
          providerResponse: providerError.providerResponse ?? {
            message:
              providerError.providerMessage ??
              providerError.message,
          },
          lastError:
            providerError.providerMessage ??
            providerError.message,
        });

        const orderResponse =
          existingDataMartOrderResponse(savedFailure);

        processedOrders.set(reference, {
          status: definitelyRejected ? "failed" : "processing",
          response: orderResponse,
        });

        console.error("DataMart purchase outcome:", {
          paymentReference: reference,
          orderStatus: savedFailure.orderStatus,
          httpStatus: httpStatus ?? null,
        });

        return {
          ok: false,
          status: definitelyRejected ? 400 : 202,
          body: {
            success: false,
            message: definitelyRejected
              ? "DataMart rejected the purchase. Check the saved order before retrying."
              : "The DataMart purchase outcome is uncertain. Verify the provider order before attempting another purchase.",
            order: orderResponse,
          },
        };
      }
    }

    // =====================================================
    // EXISTING SWIFTDATA BRANCH
    // Keep the existing SwiftData price rules unchanged.
    // =====================================================
    if (activeVendor !== "swiftdata") {
      throw new Error("The configured bundle vendor is unsupported.");
    }

    const priceCheck = verifySellingPrice(
      network,
      size,
      actualAmountGHS
    );

    if (!priceCheck.valid) {
      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: priceCheck.message,
        },
      };
    }

    console.log("SwiftData payment verified:", {
      paymentReference: reference,
      actualAmountGHS,
      expectedPrice: priceCheck.expectedPrice,
      priceType: priceCheck.priceType,
    });

    const orderData = {
      type: "single",
      volume: parseInt(size, 10),
      phone: recipient,
      offerSlug: pkg,
      webhookUrl:
        process.env.SWIFT_WEBHOOK_URL ||
        "https://swiftdata-link.com/api/webhooks/orders",
    };

    const swiftBase = (
      process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com"
    ).replace(/\/$/, "");

    const swiftUrl = `${swiftBase}/order/${network}`;

    const swiftRes = await axios.post(swiftUrl, orderData, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    if (!swiftRes.data?.success) {
      processedOrders.set(reference, {
        status: "failed",
        response: swiftRes.data,
      });

      return {
        ok: false,
        status: 400,
        body: {
          success: false,
          message: "SwiftData request failed.",
          details: swiftRes.data,
        },
      };
    }

    const swiftOrderResponse = {
      provider: "swiftdata",
      reference: swiftRes.data.reference ?? null,
      orderId: swiftRes.data.orderId ?? null,
      ...swiftRes.data,
    };

    processedOrders.set(reference, {
      status: "processing",
      response: swiftOrderResponse,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: "Bundle order placed.",
        order: swiftRes.data,
      },
    };
  } catch (err) {
    console.error("handleBuyDataRequest error:", {
      message: err.message,
      paymentReference: reference,
    });

    return {
      ok: false,
      status: 500,
      body: {
        success: false,
        message: "Failed to process the data order.",
      },
    };
  }
}




function normalizeDataMartStatus(status) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (["completed", "success", "successful", "delivered"].includes(normalized)) {
    return "completed";
  }

  if (["failed", "cancelled", "canceled", "rejected"].includes(normalized)) {
    return "failed";
  }

  if (["pending", "processing", "in_progress", "in progress"].includes(normalized)) {
    return "processing";
  }

  return "unknown";
}


// POST route
app.post("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference,
    
   } = req.body;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });

  console.log("🔥 handleBuyDataRequest result:", result);

  return res.status(result.status).json(result.body);
});



// GET route
app.get("/api/buy-data", async (req, res) => {
  const { network, recipient, package: pkg, size, paymentReference } = req.query;
  const result = await handleBuyDataRequest({ network, recipient, pkg, size, paymentReference });
  return res.status(result.status).json(result.body);
});

// Status route



app.get("/api/v1/order/status/:orderIdOrRef", async (req, res) => {
  const { orderIdOrRef } = req.params;

  if (!orderIdOrRef) {
    return res.status(400).json({
      success: false,
      message: "Missing order ID or reference.",
    });
  }

  try {
    // 1. Check Neon for a DataMart provider order reference.
    const datamartOrder =
      await getDataMartOrderByProviderReference(orderIdOrRef);

    if (datamartOrder) {
      // Return the saved status if DataMart has not assigned
      // a provider reference yet.
      let orderStatus = datamartOrder.orderStatus;

      if (datamartOrder.providerOrderReference) {
        try {
          const providerStatus = await getDataMartOrderStatus(
            datamartOrder.providerOrderReference
          );

          orderStatus = normalizeDataMartStatus(
            providerStatus.orderStatus
          );

          await updateDataMartOrder(
            datamartOrder.paymentReference,
            {
              orderStatus,
              providerResponse: providerStatus,
              lastError: null,
            }
          );
        } catch (statusError) {
          console.error("DataMart status refresh failed:", {
            orderReference: orderIdOrRef,
            message: statusError.message,
          });

          // Keep the saved status if the provider is temporarily
          // unreachable. Do not mark the order failed.
        }
      }

      return res.status(200).json({
        success: true,
        provider: "datamart",
        order: {
          paymentReference: datamartOrder.paymentReference,
          orderReference: datamartOrder.providerOrderReference,
          network: datamartOrder.network,
          capacity: datamartOrder.capacityGb,
          status: orderStatus,
          createdAt: datamartOrder.createdAt,
          updatedAt: datamartOrder.updatedAt,
        },
      });
    }

    // 2. If not found in Neon, check SwiftData as before.
    const swiftBase = (
      process.env.SWIFT_BASE_URL ||
      "https://swiftdata-link.com"
    ).replace(/\/$/, "");

    const swiftUrl =
      `${swiftBase}/order/status/${encodeURIComponent(orderIdOrRef)}`;

    const response = await axios.get(swiftUrl, {
      headers: {
        "x-api-key": process.env.SWIFT_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.data?.success) {
      return res.status(200).json({
        success: true,
        provider: "swiftdata",
        order: response.data.order,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        response.data?.message ||
        "Failed to fetch order status.",
      details: response.data,
    });
  } catch (error) {
    console.error("Order status lookup failed:", {
      orderIdOrRef,
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Error fetching order status.",
    });
  }
});



// Frontend fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ENDS//