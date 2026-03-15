import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    key_id: process.env.RAZORPAY_KEY_ID || "",
  });
}
