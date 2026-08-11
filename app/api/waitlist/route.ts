import { joinWaitlist, waitlistCount } from "lib/woocommerce";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await waitlistCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 132 });
  }
}

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

  const result = await joinWaitlist(email);
  if (!result.ok) {
    console.error("[waitlist] join failed:", result.error);
    return NextResponse.json(
      { ok: false, error: "Could not join right now. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, count: result.count });
}
