function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

export async function verifyReceiptInBrowser(receipt) {
  if (!receipt || !["1.0", "1.1"].includes(receipt.schemaVersion) || receipt.integrity?.algorithm !== "sha256" || !/^[a-f0-9]{64}$/.test(receipt.integrity.hash)) return false;
  const { integrity, ...payload } = receipt;
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(payload)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return hash === integrity.hash;
}

export function downloadReceipt(receipt) {
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sceneset-receipt-${receipt.createdAt.slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
