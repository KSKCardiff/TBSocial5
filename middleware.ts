import { NextResponse } from "next/server";

const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;

export function middleware(req: Request) {
  if (!USER || !PASS) return NextResponse.next(); // auth kapalı
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();
  const [, b64] = auth.split(" ");
  const [u, p] = Buffer.from(b64, "base64").toString().split(":");
  if (u === USER && p === PASS) return NextResponse.next();
  return unauthorized();
}
function unauthorized() {
  return new NextResponse("Auth required", { status: 401, headers: { "WWW-Authenticate": "Basic realm=\"Secure Area\"" } });
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
