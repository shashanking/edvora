import React from "react";

type Span = {
  _key?: string;
  _type: string;
  text?: string;
  marks?: string[];
};

type Block = {
  _key?: string;
  _type: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: Span[];
};

const renderSpans = (children: Span[] = []) =>
  children.map((span, i) => {
    let node: React.ReactNode = span.text ?? "";
    const marks = span.marks ?? [];
    if (marks.includes("strong")) node = <strong key={`s-${i}`}>{node}</strong>;
    if (marks.includes("em")) node = <em key={`e-${i}`}>{node}</em>;
    if (marks.includes("underline"))
      node = <span key={`u-${i}`} className="underline">{node}</span>;
    return <React.Fragment key={span._key ?? i}>{node}</React.Fragment>;
  });

/**
 * Minimal Portable Text renderer for Sanity block content.
 * Supports headings, paragraphs, blockquotes, basic marks and lists.
 */
const PortableText: React.FC<{ value?: Block[] }> = ({ value }) => {
  if (!value || !Array.isArray(value) || value.length === 0) return null;

  const out: React.ReactNode[] = [];
  let list: { type: "bullet" | "number"; items: React.ReactNode[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const ListTag = list.type === "number" ? "ol" : "ul";
    out.push(
      <ListTag
        key={key}
        className={`${
          list.type === "number" ? "list-decimal" : "list-disc"
        } pl-6 space-y-2 text-[#2B2B2B]/90 font-nunito text-[15px] md:text-[17px] leading-relaxed`}
      >
        {list.items}
      </ListTag>
    );
    list = null;
  };

  value.forEach((block, idx) => {
    const key = block._key ?? `b-${idx}`;
    if (block._type !== "block") return;

    const content = renderSpans(block.children);

    if (block.listItem) {
      if (!list || list.type !== block.listItem) {
        flushList(`list-${idx}`);
        list = { type: block.listItem, items: [] };
      }
      list.items.push(<li key={key}>{content}</li>);
      return;
    }

    flushList(`list-${idx}`);

    switch (block.style) {
      case "h1":
        out.push(
          <h2 key={key} className="font-poppins font-extrabold text-[26px] md:text-[34px] text-[#082A6B] mt-8 mb-3">
            {content}
          </h2>
        );
        break;
      case "h2":
        out.push(
          <h2 key={key} className="font-poppins font-bold text-[22px] md:text-[28px] text-[#082A6B] mt-8 mb-3">
            {content}
          </h2>
        );
        break;
      case "h3":
        out.push(
          <h3 key={key} className="font-poppins font-bold text-[19px] md:text-[22px] text-[#082A6B] mt-6 mb-2">
            {content}
          </h3>
        );
        break;
      case "h4":
        out.push(
          <h4 key={key} className="font-poppins font-semibold text-[17px] md:text-[19px] text-[#082A6B] mt-6 mb-2">
            {content}
          </h4>
        );
        break;
      case "blockquote":
        out.push(
          <blockquote key={key} className="border-l-4 border-[#FFC83D] pl-4 md:pl-6 my-6 italic text-[#17315F] font-nunito text-[16px] md:text-[19px]">
            {content}
          </blockquote>
        );
        break;
      default:
        out.push(
          <p key={key} className="text-[#2B2B2B]/90 font-nunito text-[15px] md:text-[17px] leading-relaxed my-4">
            {content}
          </p>
        );
    }
  });

  flushList("list-final");

  return <div>{out}</div>;
};

export default PortableText;
