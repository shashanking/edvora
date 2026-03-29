import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-[#1F4FD8]/10 rounded-full flex items-center justify-center">
          <span className="text-4xl font-poppins font-bold text-[#1F4FD8]">404</span>
        </div>
        <h1 className="text-2xl font-poppins font-bold text-[#1C1C28] mb-2">
          Page Not Found
        </h1>
        <p className="text-[#4D4D4D] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#1F4FD8] text-white font-poppins font-semibold text-sm rounded-xl hover:bg-[#1a45c2] transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white text-[#1C1C28] font-poppins font-semibold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
