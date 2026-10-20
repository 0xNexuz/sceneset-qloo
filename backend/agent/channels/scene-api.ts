import { defineChannel, POST } from "eve/channels";

const publicDemoPrincipal = {
  authenticator: "sceneset-public-demo",
  principalType: "service",
  principalId: "anonymous",
  attributes: {},
};

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || current.resetAt <= now) {
    requestWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 12;
}

function directToolRoute(path: string, toolName: string) {
  return POST(path, async (request, { invokeTool, requestIp }) => {
    if (rateLimited(requestIp ?? "unknown")) {
      return Response.json(
        { status: "RATE_LIMITED", reason: "Too many demo requests. Try again in one minute." },
        { status: 429, headers: { "cache-control": "no-store" } },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 8_192) {
      return Response.json(
        { status: "INVALID_REQUEST", reason: "Request body is too large." },
        { status: 413 },
      );
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return Response.json(
        { status: "INVALID_REQUEST", reason: "Expected a JSON request body." },
        { status: 400 },
      );
    }

    const result = await invokeTool(toolName, input, { auth: publicDemoPrincipal });
    if (result.status === "completed") {
      return Response.json(result.output, { headers: { "cache-control": "no-store" } });
    }

    const responseStatus =
      result.status === "invalid-input"
        ? 400
        : result.status === "denied"
          ? 403
          : result.status === "authorization-required"
            ? 401
            : 502;
    return Response.json(
      {
        status: "API_ERROR",
        reason: "message" in result ? result.message : `SceneSet returned ${result.status}.`,
      },
      { status: responseStatus, headers: { "cache-control": "no-store" } },
    );
  });
}

export default defineChannel({
  cors: true,
  routes: [
    directToolRoute("/api/city-pulse", "discover_city_pulse"),
    directToolRoute("/api/scene-plan", "plan_scene"),
  ],
});
