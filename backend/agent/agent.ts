import { defineAgent } from "eve";

export default defineAgent({
  defaultTools: false,
  model: "nvidia/nemotron-3.5-lightning-free",
  reasoning: "low",
  limits: {
    sessionTimeoutMs: 30 * 60 * 1000,
    maxInputTokensPerSession: 20_000,
    maxOutputTokensPerSession: 4_000,
  },
});
