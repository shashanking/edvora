"use client";

import { title } from "process";
import React, { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

interface ContactFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age: string;
  subject: string;
  message: string;
}

type ContactContent = {
  title: string;
  description: string;
  callDescription: string;
  phone: string;
  emailDescription: string;
  email: string;
};

const subjects = [
  "General Inquiry",
  "Tutoring Services",
  "Pricing Information",
  "Technical Support",
  "Partnership Opportunities",
  "Other",
];

const FALL_BACK_CONTENT = {
  title: "Let’s get in touch",
  description:
    "Contact us to share your thoughts, ask questions, or explore opportunities to work and grow together.",
  callDescription:
    "Contact us to share your thoughts, ask questions, or explore opportunities to work and grow together.",
  phone: "+91 93303 88153",
  emailDescription:
    "Contact us to share your thoughts, ask questions, or explore opportunities to work and grow together.",
  email: "Example@gmail.com",
};

export default function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    subject: "",
    message: "",
  });
  const [content, setContent] = useState<ContactContent | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/contact");
        if (!contentRes.ok) {
          throw new Error("Failed to load Overview content");
        }

        const contentData = (await contentRes.json()) as ContactContent;

        if (!mounted) return;
        setContent(contentData);
      } catch (e: any) {
        if (!mounted) return;
        setContent(null);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        formRef.current!,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
      );

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        age: "",
        subject: "",
        message: "",
      });
      toast.success("Message sent successfully!");
      formRef.current?.reset();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="contact" className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 px-4">
      <div className="max-w-7xl mx-auto border-2 bg-gradient-to-r from-[#2C52BF] to-[#3CA7E9] rounded-[3rem] p-1">
        <div className="bg-white  rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* LEFT – FORM */}
            <div>
              <h2 className="text-[#2B2B2B] mb-2 md:mb-6 font-poppins font-bold text-[20px] md:text-3xl leading-none md:text-center uppercase tracking-normal">
                {content?.title?.split(" ")?.map((word, index) => (
                  <span
                    key={index}
                    className={`${index === content?.title?.split(" ")?.length - 1 ? "text-[#1F4FD8]" : ""}`}
                  >
                    {word}{" "}
                  </span>
                )) ??
                  FALL_BACK_CONTENT?.title?.split(" ")?.map((word, index) => (
                    <span
                      key={index}
                      className={`${index === FALL_BACK_CONTENT?.title?.split(" ")?.length - 1 ? "text-[#1F4FD8]" : ""}`}
                    >
                      {word}{" "}
                    </span>
                  ))}
              </h2>

              <p className="text-[#4D4D4D] mb-10 font-nunito-sans text-[12px] md:text-base leading-6">
                {content?.description ?? FALL_BACK_CONTENT?.description}
              </p>

              <form ref={formRef} onSubmit={sendEmail} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="input-field border border-[#D4D4D4] rounded-full outline-none py-2 pl-5 pr-1.5 font-nunito-sans text-sm leading-none text-[#4D4D4D]"
                    required
                  />
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="input-field border border-[#D4D4D4] rounded-full outline-none py-2 pl-5 pr-1.5 font-nunito-sans text-sm leading-none text-[#4D4D4D]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="input-field border border-[#D4D4D4] rounded-full outline-none py-2 pl-5 pr-1.5 font-nunito-sans text-sm leading-none text-[#4D4D4D]"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email ID"
                    className="input-field border border-[#D4D4D4] rounded-full outline-none py-2 pl-5 pr-1.5 font-nunito-sans text-sm leading-none text-[#4D4D4D]"
                    required
                  />
                </div>

                <input
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  className="input-field border border-[#D4D4D4] rounded-full outline-none py-2 pl-5 pr-1.5 font-nunito-sans text-sm leading-none text-[#4D4D4D] w-full"
                  required
                />

                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-field border border-[#D4D4D4] rounded-full outline-none p-2 flex justify-between items-center font-nunito-sans text-sm leading-none text-[#4D4D4D] opacity-50 w-full"
                  required
                >
                  <option value="" disabled>
                    Subject
                  </option>
                  {subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Message"
                  className="w-full px-6 py-4 border-2 rounded-3xl  focus:outline-none resize-none  border-[#D4D4D4] outline-none font-nunito-sans text-sm leading-none text-[#4D4D4D]"
                  required
                />

                <button
                  type="submit"
                  className="group bg-[#FFC83D] hover:bg-yellow-500 px-10 py-4 rounded-full shadow-lg md:flex items-center gap-3 hidden "
                >
                  {loading ? (
                    <div>
                      <span className="w-full opacity-100 rotate-0 flex items-center justify-center">
                        <Loader className="text-[#023047] animate-spin" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-poppins font-semibold text-[#2B2B2B] text-xl leading-6">
                        Send
                      </span>
                      <img src="paper-plane.png" alt="" />
                    </div>
                  )}
                </button>
              </form>
            </div>

            <div className="h-0.5 w-[320px] md:w-0.5 md:h-105 rounded-[6px] md:bg-linear-to-t bg-linear-to-l from-[#FFFFFF00] to-[#1F4FD8]"></div>

            {/* RIGHT – CONTACT INFO */}
            <div className=" md:h-[420px]">
              {/* CALL */}
              <div className=" mb-6 md:mb-12">
                <h3 className="text-[#1F4FD8] mb-2 md:mb-6 font-poppins font-bold text-[24px] md:text-[48px] leading-none">
                  Call Us
                </h3>

                <p className="text-[#4D4D4D] mb-2 md:mb-6 font-nunito-sans text-[10px] md:text-base leading-6">
                  {content?.callDescription ??
                    FALL_BACK_CONTENT?.callDescription}
                </p>

                <a className="flex items-center gap-3 text-[#1F4FD8] font-semibold text-[12px] md:text-xl">
                  <div className="w-5 h-5 md:w-10 md:h-10 rounded-full flex items-center justify-center font-poppins font-bold text-sm leading-none">
                    <img src="./phone-fill.png" alt="" />
                  </div>
                  <span className="text-[#1F4FD8]">
                    {FALL_BACK_CONTENT?.phone}
                  </span>
                </a>
              </div>

              {/* EMAIL */}
              <div>
                <h3 className="text-[#1F4FD8] mb-2 md:mb-6 font-poppins font-bold text-[24px] md:text-[48px] leading-none">
                  Email
                </h3>

                <p className="text-[#4D4D4D] mb-2 md:mb-6 font-nunito-sans text-[10px] md:text-base leading-6">
                  {content?.emailDescription ??
                    FALL_BACK_CONTENT?.emailDescription}
                </p>

                <a className="flex items-center gap-3 text-blue-600 font-semibold text-[12px] md:text-xl hover:text-blue-700">
                  <div className="w-5 h-5 md:w-10 md:h-10 rounded-full flex items-center justify-center font-poppins font-bold text-sm leading-none">
                    <img src="./outline-email.png" alt="" />
                  </div>
                  <span className="text-[#1F4FD8]">
                    {content?.email ?? FALL_BACK_CONTENT?.email}
                  </span>
                </a>
              </div>
            </div>
            <button
              type="submit"
              className="group w-full bg-[#FFC83D] hover:bg-yellow-500 px-10 py-4 rounded-full shadow-lg flex items-center justify-center gap-3 md:hidden "
            >
              {loading ? (
                <div>
                  <span className="w-full opacity-100 rotate-0 flex items-center justify-center">
                    <Loader className="text-[#023047] animate-spin" />
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="font-poppins font-semibold text-[#2B2B2B] text-[16px] md:text-xl leading-6">
                    Send
                  </span>
                  <img src="paper-plane.png" alt="" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
