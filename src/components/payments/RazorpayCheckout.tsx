"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  courseId: string;
  courseTitle: string;
  price: number;
  currency: string;
  userName: string;
  userEmail: string;
}

export default function RazorpayCheckout({
  courseId,
  courseTitle,
  price,
  currency,
  userName,
  userEmail,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // Get Razorpay key
      const configRes = await fetch("/api/payments/config");
      const { key_id } = await configRes.json();

      // Create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error || "Failed to create payment order");
        setLoading(false);
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Addify Academy",
        description: `Enrollment: ${courseTitle}`,
        order_id: orderData.order_id,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#1F4FD8",
        },
        handler: async (response: any) => {
          // Verify payment
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                course_id: courseId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              router.push("/dashboard/student/courses?enrolled=success");
              router.refresh();
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          } catch {
            setError("Payment verification failed. Please contact support.");
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-3.5 bg-[#1F4FD8] hover:bg-[#1a45c2] disabled:opacity-60 disabled:cursor-not-allowed text-white font-poppins font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#1F4FD8]/20"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay {currency} {price.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}
