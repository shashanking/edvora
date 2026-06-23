import type { Metadata } from "next";
import PageHero from "@/src/components/core/PageHero";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Addify Academy collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow="Legal"
        heading="Privacy Policy"
        subheading="How we collect, use, and protect your information."
      />

      <section className="max-w-[860px] mx-auto px-4 md:px-8 py-16 md:py-24 text-gray-700">
        <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

        <div className="space-y-10 text-[15px] leading-relaxed">

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>
              Addify Academy ("we", "us", or "our") is an online education platform providing
              personalised one-on-one tutoring services. Our registered address is West Bengal, India.
              You can reach us at{" "}
              <a href="mailto:contact@addifyacademy.com" className="text-[#1F4FD8] underline">
                contact@addifyacademy.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Account information</strong> — name, email address, phone number, and
                password when you register.
              </li>
              <li>
                <strong>Profile information</strong> — age, academic level, learning goals, and
                any other details you provide.
              </li>
              <li>
                <strong>Usage data</strong> — pages visited, session durations, course progress,
                and interaction logs.
              </li>
              <li>
                <strong>Payment information</strong> — billing details processed securely through
                our payment partners (we do not store card numbers on our servers).
              </li>
              <li>
                <strong>Communications</strong> — messages you send to our support team or
                through our contact form.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>To create and manage your account.</li>
              <li>To match you with the right tutor and deliver personalised sessions.</li>
              <li>To process payments and send receipts.</li>
              <li>To send important service updates, session reminders, and support responses.</li>
              <li>To improve our platform through analytics and feedback.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing Your Information</h2>
            <p className="mb-3">
              We do not sell or rent your personal data. We may share information only with:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Tutors</strong> — to facilitate your booked sessions.
              </li>
              <li>
                <strong>Service providers</strong> — payment processors, email platforms, and
                hosting providers, under strict confidentiality agreements.
              </li>
              <li>
                <strong>Legal authorities</strong> — when required by law or to protect our
                rights.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies</h2>
            <p>
              We use cookies and similar technologies to keep you logged in, remember your
              preferences, and understand how visitors use our site. You can disable cookies in
              your browser settings; however, some features of the platform may not function
              correctly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide
              services. You may request deletion of your account and associated data at any time
              by emailing us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
            <p>
              We serve students as young as 4 years old. For users under 13, we require
              parental or guardian consent before collecting any personal information. Parents
              may review, update, or request deletion of their child&apos;s data by contacting us
              directly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Security</h2>
            <p>
              We use industry-standard security measures including HTTPS encryption and
              access controls to protect your data. No method of transmission over the internet
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:contact@addifyacademy.com" className="text-[#1F4FD8] underline">
                contact@addifyacademy.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The date at the top of
              this page reflects the most recent revision. Continued use of our platform after
              any changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <address className="not-italic mt-3 space-y-1 text-gray-600">
              <p>Addify Academy</p>
              <p>West Bengal, India</p>
              <p>
                Email:{" "}
                <a href="mailto:contact@addifyacademy.com" className="text-[#1F4FD8] underline">
                  contact@addifyacademy.com
                </a>
              </p>
              <p>Phone: +91 93303 88153</p>
            </address>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
