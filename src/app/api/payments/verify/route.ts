import { createClient } from "@/src/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      course_id,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("provider_order_id", razorpay_order_id);

      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
        status: "completed",
        paid_at: new Date().toISOString(),
      })
      .eq("provider_order_id", razorpay_order_id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    // Create enrollment
    if (course_id) {
      await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          course_id,
          status: "active",
          progress: 0,
        });
    }

    return NextResponse.json({ success: true, message: "Payment verified and enrollment created" });
  } catch (err: any) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
