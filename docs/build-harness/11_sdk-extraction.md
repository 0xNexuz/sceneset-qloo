# SDK Extraction

Status: **POST-HACKATHON OPTION**

Candidate: `@sceneset/taste-receipt`, a typed, provider-aware record and verifier for agent decisions grounded in cultural/taste APIs.

```ts
import { buildTasteReceipt, verifyTasteReceipt } from "@sceneset/taste-receipt";

const receipt = buildTasteReceipt({
  inputs,
  providerCalls,
  candidates,
  constraints,
  decision,
  executionMode: "live"
});

verifyTasteReceipt(receipt);
```

Keep it inside the app until the core demo passes. Extract only when the API is stable, mutation/provenance tests pass, and an example works without the SceneSet UI. Target npm after P0 completion. Do not prematurely extract product-specific scoring policy.

