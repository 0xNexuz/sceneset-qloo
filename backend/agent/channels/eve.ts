import { defaultEveAuth, eveChannel } from "eve/channels/eve";
import { localDev, none, placeholderAuth, vercelOidc } from "eve/channels/auth";

const intendedOrigins = (process.env.SCENESET_UI_ORIGIN ?? "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174")
  .split(",").map((value) => value.trim()).filter(Boolean);
const publicChatEnabled = process.env.SCENESET_CHAT_ENABLED === "true" && Boolean(process.env.SCENESET_UI_ORIGIN);
const anonymous = none();
const windows = new Map<string, { count: number; resetAt: number }>();

function acceptDemoMessage(request: Request, message: unknown): void {
  const length = typeof message === "string" ? message.length : JSON.stringify(message).length;
  if (length > 2_000) throw new Error("Demo messages are limited to 2,000 characters.");
  const ip = request.headers.get("x-vercel-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const now = Date.now();
  const entry = windows.get(ip);
  if (!entry || entry.resetAt < now) windows.set(ip, { count: 1, resetAt: now + 60_000 });
  else {
    entry.count += 1;
    if (entry.count > 8) throw new Error("Demo message limit reached. Try again in one minute.");
  }
  if (windows.size > 1_000) for (const [key, value] of windows) if (value.resetAt < now) windows.delete(key);
}

export default eveChannel({
  auth: [vercelOidc(), localDev(), publicChatEnabled
    ? (request: Request) => intendedOrigins.includes(request.headers.get("origin") ?? "") ? anonymous(request) : null
    : placeholderAuth()],
  cors: { origin: intendedOrigins, methods: ["GET", "POST"], allowedHeaders: ["content-type", "authorization"] },
  uploadPolicy: "disabled",
  onMessage(ctx, message) {
    acceptDemoMessage(ctx.eve.request, message);
    return { auth: defaultEveAuth(ctx) };
  },
});
