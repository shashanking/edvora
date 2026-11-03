const BlogWhatsAppCta = () => {
  return (
    <aside className="mt-10 rounded-[16px] border-l-4 border-[#25D366] bg-[#E9FBF0] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <p className="font-nunito text-[15px] md:text-[16px] leading-relaxed text-[#2B2B2B]">
        Want a free English practice sheet for your child? 📲 WhatsApp us
      </p>
      <a
        href="https://wa.me/919330388153"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center justify-center px-6 py-3 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full font-poppins font-semibold text-[14px] md:text-[15px] shadow-lg transition-colors"
      >
        Chat on WhatsApp
      </a>
    </aside>
  );
};

export default BlogWhatsAppCta;
