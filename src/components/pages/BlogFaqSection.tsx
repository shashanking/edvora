type Faq = { question: string; answer: string };

const BlogFaqSection: React.FC<{ faqs?: Faq[] }> = ({ faqs }) => {
  if (!faqs?.length) return null;
  return (
    <section
      aria-labelledby="faq-heading"
      className="mt-12 border-t border-[#0F3CB4]/15 pt-8"
    >
      <h2
        id="faq-heading"
        className="font-poppins font-bold text-[22px] md:text-[26px] text-[#082A6B]"
      >
        Frequently asked questions
      </h2>
      <dl className="mt-6 divide-y divide-[#0F3CB4]/10">
        {faqs.map((faq, i) => (
          <div key={i} className="py-5">
            <dt className="font-poppins font-semibold text-[17px] md:text-[18px] text-[#082A6B]">
              {faq.question}
            </dt>
            <dd className="mt-2 font-nunito text-[15px] md:text-[17px] leading-relaxed text-[#2B2B2B]/80">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default BlogFaqSection;
