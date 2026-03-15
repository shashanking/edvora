import { createClient } from "@/src/lib/supabase/server";
import { getRazorpay } from "@/src/lib/razorpay";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { course_id } = await request.json();

    if (!course_id) {
      return NextResponse.json({ error: "course_id is required" }, { status: 400 });
    }

    // Fetch course details
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price, currency")
      .eq("id", course_id)
      .single();

    if (courseError || !courseData) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const course = courseData as any;

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", course_id)
      .single();

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 });
    }

    // Create Razorpay order (amount in paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(Number(course.price) * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInSmallestUnit,
      currency: course.currency || "INR",
      receipt: `course_${course_id}_${user.id}`.slice(0, 40),
      notes: {
        course_id,
        student_id: user.id,
        course_title: course.title,
      },
    });

    // Create a pending payment record
    await supabase
      .from("payments")
      .insert({
        student_id: user.id,
        course_id,
        amount: course.price,
        currency: course.currency || "INR",
        payment_provider: "razorpay",
        provider_order_id: order.id,
        status: "pending",
      } as any);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      course_title: course.title,
    });
  } catch (err: any) {
    console.error("Razorpay create order error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}
