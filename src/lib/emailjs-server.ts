// Server-side EmailJS sender. Uses the EmailJS REST API directly so the OTP
// code never has to leave the server in a response body.
//
// EmailJS rejects non-browser requests unless they include the account's
// Private Key as `accessToken`. Get it from:
//   EmailJS dashboard → Account → General → API Keys → Private Key
// and set EMAILJS_PRIVATE_KEY in .env.

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "";
const OTP_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID || "template_jmwhqgd";

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export async function sendOtpEmailServer(params: {
  email: string;
  passcode: string;
  expiresAt: Date;
}) {
  if (!SERVICE_ID || !PUBLIC_KEY) {
    throw new Error(
      "EmailJS is not configured: set NEXT_PUBLIC_EMAILJS_SERVICE_ID and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in .env"
    );
  }
  if (!PRIVATE_KEY) {
    throw new Error(
      "EmailJS private key missing: set EMAILJS_PRIVATE_KEY in .env (EmailJS dashboard → Account → General → API Keys → Private Key)"
    );
  }

  const time = params.expiresAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: OTP_TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      accessToken: PRIVATE_KEY,
      template_params: {
        email: params.email,
        passcode: params.passcode,
        time,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`EmailJS send failed (${res.status}): ${text || res.statusText}`);
  }
}
