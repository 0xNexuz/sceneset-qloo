import { createHash } from "node:crypto";
import type { CityPulseReceipt, TasteReceipt } from "./types";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function hashPayload(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

export function sealReceipt(
  receipt: Omit<TasteReceipt, "integrity">,
): TasteReceipt {
  return {
    ...receipt,
    integrity: { algorithm: "sha256", hash: hashPayload(receipt) },
  };
}

export function sealCityPulseReceipt(
  receipt: Omit<CityPulseReceipt, "integrity">,
): CityPulseReceipt {
  return {
    ...receipt,
    integrity: { algorithm: "sha256", hash: hashPayload(receipt) },
  };
}

export function verifyReceipt(receipt: TasteReceipt): boolean {
  const { integrity, ...payload } = receipt;
  return integrity.algorithm === "sha256" && integrity.hash === hashPayload(payload);
}

export function verifyCityPulseReceipt(receipt: CityPulseReceipt): boolean {
  const { integrity, ...payload } = receipt;
  return integrity.algorithm === "sha256" && integrity.hash === hashPayload(payload);
}

