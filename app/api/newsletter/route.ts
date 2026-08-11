import { subscribeNewsletter } from "lib/woocommerce";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = await req.json();
    email = typeof body.email === "string" ? body.email : "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email." },
      { status: 422 },
    );
  }

  const result = await subscribeNewsletter(email);
  if (!result.ok) {
    console.error("[newsletter] subscribe failed:", result.error);
    return NextResponse.json(
      { ok: false, error: "Could not subscribe right now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
