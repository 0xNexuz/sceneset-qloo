import { defineEval } from "eve/evals";

export default defineEval({
  description: "A live Eve session calls the Qloo-backed discovery tool rather than answering from memory.",
  async test(t) {
    const turn = await t.send("Find Afrobeats parties in Lagos and Accra. Use the discovery tool, and be clear if no city has enough venue evidence.");
    t.succeeded();
    t.calledTool("discover_city_pulse");
    t.log(`Assistant response: ${turn.message?.slice(0, 500) ?? "(none)"}`);
  },
});
