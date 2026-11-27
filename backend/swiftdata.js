const KEY = process.env.SWIFT_API_KEY;

export const SWIFT_BASE = "https://api.swiftdata-link.com";

console.log("[swiftdata] key set:", !!KEY, "| key length:", KEY?.length ?? 0); // never prints the key

export const swiftConfigured = () => !!KEY;

export const swiftHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  "x-api-key": KEY ?? "",
});

// Available wallet balance in pesewas, or null if it could not be read
export async function swiftWalletAvailableMinor() {
  if (!KEY) return null;
  const res = await fetch(`${SWIFT_BASE}/v2/wallet`, {
    headers: swiftHeaders(),
    signal: AbortSignal.timeout(6000),
  }).catch(() => null);
  const json = res?.ok ? await res.json().catch(() => null) : null;
  const m = json?.data?.availableMinor;
  return m == null ? null : Number(m);
}
