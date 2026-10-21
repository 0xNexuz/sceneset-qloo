import { generateText, tool } from "ai";
import { z } from "zod";

let invoked = false;
try {
  const result = await generateText({
    model: "reflection/beam-free",
    prompt: "Call the ping tool exactly once. Do not answer from memory.",
    tools: { ping: tool({ description: "Minimal tool-calling preflight", inputSchema: z.object({}), execute: async () => { invoked = true; return { ok: true }; } }) },
    toolChoice: "required",
    maxOutputTokens: 80,
  });
  console.log(JSON.stringify({ status: invoked ? "TOOL_INVOKED" : "NO_TOOL_CALL", model: result.response.modelId, toolCallCount: result.toolCalls.length }));
  if (!invoked) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ status: "MODEL_UNAVAILABLE", code: error?.statusCode ?? error?.status ?? null, message: String(error?.message ?? error).slice(0, 200) }));
  process.exitCode = 1;
}
