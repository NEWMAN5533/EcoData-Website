import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);

const ALLOWED_NETWORKS = [
  "YELLO",
  "TELECEL",
  "AT_PREMIUM"
];

const ALLOWED_STATUSES = [
  "pending",
  "waiting",
  "processing",
  "completed",
  "failed",
  "refunded",
  "unknown"
];

function normalizeOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    paymentReference: row.payment_reference,
    idempotencyKey: row.idempotency_key,
    customerPhone: row.customer_phone,
    network: row.network,
    capacityGb: Number(row.capacity_gb),
    providerOrderReference: row.provider_order_reference,
    providerTransactionReference:
      row.provider_transaction_reference,
    providerPurchaseId: row.provider_purchase_id,
    sellingPrice:
      row.selling_price == null ? null : Number(row.selling_price),
    providerPrice:
      row.provider_price == null ? null : Number(row.provider_price),
    orderStatus: row.order_status,
    paymentStatus: row.payment_status,
    providerResponse: row.provider_response,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Create a record before submitting a purchase to DataMart.
// The unique payment reference prevents duplicate order records.
export async function createDataMartOrder({
  paymentReference,
  idempotencyKey,
  customerPhone,
  network,
  capacityGb,
  sellingPrice
}) {
  if (
    !paymentReference ||
    !idempotencyKey ||
    !customerPhone ||
    !network ||
    capacityGb === undefined
  ) {
    throw new Error("Missing required DataMart order fields.");
  }

  if (!ALLOWED_NETWORKS.includes(network)) {
    throw new Error(`Unsupported DataMart network: ${network}`);
  }

  const capacity = Number(capacityGb);
  const price = Number(sellingPrice);

  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error("Invalid order capacity.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid selling price.");
  }

  const rows = await sql`
    INSERT INTO datamart_orders (
      payment_reference,
      idempotency_key,
      customer_phone,
      network,
      capacity_gb,
      selling_price,
      order_status,
      payment_status
    )
    VALUES (
      ${String(paymentReference)},
      ${String(idempotencyKey)},
      ${String(customerPhone)},
      ${network},
      ${capacity},
      ${price},
      'pending',
      'verified'
    )
    ON CONFLICT DO NOTHING
    RETURNING *
  `;

  if (rows.length > 0) {
    return {
      created: true,
      order: normalizeOrder(rows[0])
    };
  }

  // A conflicting payment or idempotency key may belong to
  // an existing order. Never submit another purchase blindly.
  const existing = await sql`
    SELECT *
    FROM datamart_orders
    WHERE payment_reference = ${String(paymentReference)}
       OR idempotency_key = ${String(idempotencyKey)}
    LIMIT 1
  `;

  if (existing.length === 0) {
    throw new Error(
      "Order conflicts with an existing record. Manual review required."
    );
  }

  const order = normalizeOrder(existing[0]);

  if (
    order.paymentReference !== String(paymentReference) ||
    order.idempotencyKey !== String(idempotencyKey) ||
    order.customerPhone !== String(customerPhone) ||
    order.network !== network ||
    order.capacityGb !== capacity
  ) {
    throw new Error(
      "Order reference already exists with different order details."
    );
  }

  return {
    created: false,
    order
  };
}

// Update the record after DataMart responds.
export async function updateDataMartOrder(
  paymentReference,
  updates
) {
  if (!paymentReference) {
    throw new Error("Payment reference is required.");
  }

  const {
    orderStatus,
    providerOrderReference,
    providerTransactionReference,
    providerPurchaseId,
    providerPrice,
    providerResponse,
    lastError
  } = updates;

  if (
    orderStatus &&
    !ALLOWED_STATUSES.includes(orderStatus)
  ) {
    throw new Error(`Unsupported order status: ${orderStatus}`);
  }

  const price =
    providerPrice == null ? null : Number(providerPrice);

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    throw new Error("Invalid provider price.");
  }

  const responseJson =
    providerResponse === undefined
      ? null
      : JSON.stringify(providerResponse);

  const rows = await sql`
    UPDATE datamart_orders
    SET
      order_status = COALESCE(${orderStatus ?? null}, order_status),
      provider_order_reference = COALESCE(
        ${providerOrderReference ?? null},
        provider_order_reference
      ),
      provider_transaction_reference = COALESCE(
        ${providerTransactionReference ?? null},
        provider_transaction_reference
      ),
      provider_purchase_id = COALESCE(
        ${providerPurchaseId ?? null},
        provider_purchase_id
      ),
      provider_price = COALESCE(
        ${price},
        provider_price
      ),
      provider_response = COALESCE(
        ${responseJson}::jsonb,
        provider_response
      ),
      last_error = COALESCE(${lastError ?? null},
      last_error
      ),
      updated_at = NOW()
    WHERE payment_reference = ${String(paymentReference)}
    RETURNING *
  `;

  if (rows.length === 0) {
    throw new Error("DataMart order not found.");
  }

  return normalizeOrder(rows[0]);
}

// Look up a DataMart order using EcoData's Paystack reference.
export async function getDataMartOrderByPaymentReference(
  paymentReference
) {
  const rows = await sql`
    SELECT *
    FROM datamart_orders
    WHERE payment_reference = ${String(paymentReference)}
    LIMIT 1
  `;

  return normalizeOrder(rows[0]);
}

// Look up a DataMart order using the supplier's reference.
export async function getDataMartOrderByProviderReference(
  providerOrderReference
) {
  const rows = await sql`
    SELECT *
    FROM datamart_orders
    WHERE provider_order_reference = ${String(providerOrderReference)}
    LIMIT 1
  `;

  return normalizeOrder(rows[0]);
}