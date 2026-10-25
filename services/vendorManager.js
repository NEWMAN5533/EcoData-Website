import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);

const ALLOWED_VENDORS = ["swiftdata", "datamart"];

export async function getVendorSettings() {
  const rows = await sql`
    SELECT setting_key, active_vendor, updated_at
    FROM vendor_settings
    WHERE setting_key = 'bundle_purchase'
    LIMIT 1
  `;

  if (rows.length === 0) {
    throw new Error("Bundle vendor setting was not found.");
  }

  return {
    settingKey: rows[0].setting_key,
    activeVendor: rows[0].active_vendor,
    updatedAt: rows[0].updated_at
  };
}

export async function getActiveVendor() {
  const settings = await getVendorSettings();
  return settings.activeVendor;
}

export async function setActiveVendor(vendor) {
  if (!ALLOWED_VENDORS.includes(vendor)) {
    throw new Error(
      `Invalid vendor. Choose ${ALLOWED_VENDORS.join(" or ")}.`
    );
  }

  const rows = await sql`
    UPDATE vendor_settings
    SET
      active_vendor = ${vendor},
      updated_at = NOW()
    WHERE setting_key = 'bundle_purchase'
    RETURNING setting_key, active_vendor, updated_at
  `;

  if (rows.length === 0) {
    throw new Error("Bundle vendor setting was not found.");
  }

  return {
    settingKey: rows[0].setting_key,
    activeVendor: rows[0].active_vendor,
    updatedAt: rows[0].updated_at
  };
}