import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

// Template IDs — configure these in your EmailJS dashboard
// Each template should have matching variable placeholders
const TEMPLATES = {
  enrollment: process.env.NEXT_PUBLIC_EMAILJS_ENROLLMENT_TEMPLATE_ID || "",
  scheduleConfirmed: process.env.NEXT_PUBLIC_EMAILJS_SCHEDULE_TEMPLATE_ID || "",
  paymentReminder: process.env.NEXT_PUBLIC_EMAILJS_REMINDER_TEMPLATE_ID || "",
  general: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
} as const;

function isConfigured(): boolean {
  return Boolean(SERVICE_ID && PUBLIC_KEY);
}

export async function sendEnrollmentEmail(params: {
  studentName: string;
  studentEmail: string;
  courseName: string;
}) {
  if (!isConfigured()) return;
  const templateId = TEMPLATES.enrollment || TEMPLATES.general;
  if (!templateId) return;

  try {
    await emailjs.send(
      SERVICE_ID,
      templateId,
      {
        to_name: params.studentName,
        to_email: params.studentEmail,
        course_name: params.courseName,
        subject: `Enrollment Confirmed: ${params.courseName}`,
        message: `Hi ${params.studentName}, you have been successfully enrolled in "${params.courseName}". Log in to your dashboard to start learning!`,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error("Failed to send enrollment email:", err);
  }
}

export async function sendScheduleConfirmedEmail(params: {
  studentName: string;
  studentEmail: string;
  courseName: string;
  day: string;
  time: string;
}) {
  if (!isConfigured()) return;
  const templateId = TEMPLATES.scheduleConfirmed || TEMPLATES.general;
  if (!templateId) return;

  try {
    await emailjs.send(
      SERVICE_ID,
      templateId,
      {
        to_name: params.studentName,
        to_email: params.studentEmail,
        course_name: params.courseName,
        subject: `Schedule Confirmed: ${params.courseName}`,
        message: `Hi ${params.studentName}, your schedule for "${params.courseName}" has been confirmed for ${params.day} at ${params.time}.`,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error("Failed to send schedule email:", err);
  }
}

export async function sendPaymentReminderEmail(params: {
  studentName: string;
  studentEmail: string;
  courseName: string;
  dueDate: string;
  notes?: string;
}) {
  if (!isConfigured()) return;
  const templateId = TEMPLATES.paymentReminder || TEMPLATES.general;
  if (!templateId) return;

  try {
    await emailjs.send(
      SERVICE_ID,
      templateId,
      {
        to_name: params.studentName,
        to_email: params.studentEmail,
        course_name: params.courseName,
        subject: `Payment Reminder: ${params.courseName}`,
        message: `Hi ${params.studentName}, this is a reminder that your payment for "${params.courseName}" is due on ${params.dueDate}.${params.notes ? ` Note: ${params.notes}` : ""}`,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error("Failed to send reminder email:", err);
  }
}
