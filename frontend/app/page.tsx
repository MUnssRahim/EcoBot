"use client";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Send,
  UploadCloud,
  FileText,
  Leaf,
  Loader2,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Globe2,
  ShieldCheck,
  X,
  ChevronRight,
  FileSearch,
  Sprout,
  CircleDot,
  Droplets,
} from "lucide-react";

type Message = {
  role: "user" | "bot";
  content: string;
};

type DocumentAnalysis =
  | "carbon"
  | "water"
  | "esg"
  | "sdg";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    null
  );
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"simple" | "pdf">("simple");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // =========================================================
  // PDF UPLOAD
  // =========================================================

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF document.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBaseUrl}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        setUploadedFileId(data.file_id);
        setUploadedFileName(file.name);

        // Automatically switch to PDF mode
        setChatMode("pdf");

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: `Document ready. I've processed "${file.name}" and can now run the available ESG analyses against it.`,
          },
        ]);
      } else {
        const errText = await res.text();

        alert(
          `Failed to upload PDF: ${errText.substring(0, 150)}`
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to the server. Please make sure the backend is running."
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // =========================================================
  // NORMAL CUSTOM CHAT
  // ONLY USED WHEN NO PDF IS ACTIVE
  // =========================================================

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    // Safety: custom questions are only for normal mode
    if (chatMode === "pdf" && uploadedFileId) return;

    const userMessage = input.trim();

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setIsLoading(true);

    const formData = new FormData();
    formData.append("question", userMessage);

    try {
      const res = await fetch(`${apiBaseUrl}/ask-simple`, {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();

      try {
        const data = JSON.parse(rawText);

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: data.answer,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: `API Error: ${
                data.error ||
                data.message ||
                "Something went wrong."
              }`,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content:
              "The server returned an unexpected response. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "I couldn't connect to the backend. Please check that the API server is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // PREDEFINED PDF ANALYSIS
  // =========================================================

  const runDocumentAnalysis = async (
    analysisType: DocumentAnalysis
  ) => {
    if (!uploadedFileId || isLoading) return;

    const analyses = {
      carbon: {
        buttonLabel: "Analyze Carbon Footprint",
        question:
          "Analyze the carbon footprint of this organization. Identify relevant emissions, greenhouse gas sources, carbon footprint metrics, emission categories, and any reduction measures mentioned in the report. Provide a clear summary based only on the uploaded document.",
      },

      water: {
        buttonLabel: "Analyze Water Conservation",
        question:
          "Analyze the organization's water conservation and water management practices from this report. Identify water consumption, water-related metrics, conservation initiatives, risks, targets, and improvement measures mentioned in the document.",
      },

      esg: {
        buttonLabel: "Run ESG Prediction",
        question:
          "Perform an ESG analysis and prediction based on the uploaded sustainability report. Evaluate the available environmental, social, and governance information and provide the predicted ESG assessment with supporting evidence from the document.",
      },

      sdg: {
        buttonLabel: "Run SDG Analysis",
        question:
          "Analyze this organization's alignment with the United Nations Sustainable Development Goals. Identify the relevant SDGs supported by the activities and information in the report and explain the evidence for each alignment.",
      },
    };

    const selectedAnalysis = analyses[analysisType];

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: selectedAnalysis.buttonLabel,
      },
    ]);

    setIsLoading(true);

    const formData = new FormData();

    formData.append("question", selectedAnalysis.question);
    formData.append("file_id", uploadedFileId);

    try {
      const res = await fetch(`${apiBaseUrl}/ask-question`, {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();

      try {
        const data = JSON.parse(rawText);

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: data.answer,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: `API Error: ${
                data.error ||
                data.message ||
                "Unable to analyze the document."
              }`,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content:
              "The server returned an unexpected response. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "I couldn't connect to the backend. Please check that the API server is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // CLEAR DOCUMENT
  // RETURNS USER TO NORMAL CHAT
  // =========================================================

  const clearDocument = () => {
    setUploadedFileName(null);
    setUploadedFileId(null);

    // Return to normal conversation
    setChatMode("simple");

    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content:
          "Document analysis has been closed. You are back in Global Sustainability Intelligence, where you can ask custom questions.",
      },
    ]);
  };

  // =========================================================
  // LANDING PAGE SUGGESTIONS
  // =========================================================

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen overflow-hidden bg-[#F7F5EF] text-[#17352A]">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#DCEBD9]/50 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-[#E8E0C9]/50 blur-3xl" />

        <div className="absolute right-[8%] top-[18%] opacity-[0.035]">
          <Leaf size={420} strokeWidth={1} />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="hidden w-[310px] shrink-0 flex-col border-r border-[#DDE4D8] bg-[#FBFAF5]/95 backdrop-blur-xl lg:flex">
          {/* Brand */}
          <div className="px-7 pt-7">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#214D3A] text-[#E7F2DE] shadow-[0_8px_30px_rgba(33,77,58,0.18)]">
                <Leaf size={25} strokeWidth={2.2} />

                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#FBFAF5] bg-[#91B77D]" />
              </div>

              <div>
                <h1 className="text-[22px] font-black tracking-[-0.04em] text-[#17352A]">
                  EcoBot
                </h1>

                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#78917D]">
                  Sustainability Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Workspace */}
          <div className="mt-10 px-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A69A]">
              Workspace
            </p>

            <div className="space-y-1.5">
              {/* Global */}
              <button
                onClick={() => {
                  if (!uploadedFileId) {
                    setChatMode("simple");
                  } else {
                    // When PDF is active, do not allow switching
                    // into arbitrary document questions.
                    setChatMode("simple");
                  }
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all ${
                  chatMode === "simple"
                    ? "bg-[#E7F0E2] text-[#214D3A] shadow-sm"
                    : "text-[#64766A] hover:bg-[#F1F4EE]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    chatMode === "simple"
                      ? "bg-[#214D3A] text-white"
                      : "bg-[#EEF2EB] text-[#738477]"
                  }`}
                >
                  <Globe2 size={17} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold">
                    Global Intelligence
                  </p>

                  <p className="mt-0.5 text-[11px] opacity-65">
                    Custom sustainability questions
                  </p>
                </div>

                {chatMode === "simple" && (
                  <CircleDot
                    size={13}
                    className="text-[#71945E]"
                  />
                )}
              </button>

              {/* Document */}
              <button
                disabled={!uploadedFileName}
                onClick={() => {
                  if (uploadedFileName) {
                    setChatMode("pdf");
                  }
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all ${
                  !uploadedFileName
                    ? "cursor-not-allowed text-[#AAB4AC]"
                    : chatMode === "pdf"
                    ? "bg-[#E7F0E2] text-[#214D3A] shadow-sm"
                    : "text-[#64766A] hover:bg-[#F1F4EE]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    chatMode === "pdf" && uploadedFileName
                      ? "bg-[#214D3A] text-white"
                      : "bg-[#EEF2EB] text-[#738477]"
                  }`}
                >
                  <FileSearch size={17} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold">
                    Document Intelligence
                  </p>

                  <p className="mt-0.5 text-[11px] opacity-65">
                    Four focused ESG analyses
                  </p>
                </div>

                {chatMode === "pdf" && uploadedFileName && (
                  <CircleDot
                    size={13}
                    className="text-[#71945E]"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Document section */}
          <div className="mt-auto px-5 pb-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A69A]">
              Your document
            </p>

            {uploadedFileName ? (
              <div className="rounded-[22px] border border-[#C9DCC5] bg-[#EFF6EB] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#4E7D58] shadow-sm">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="shrink-0 text-[#5D9666]"
                      />

                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D9666]">
                        Ready
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-[#294436]">
                      {uploadedFileName}
                    </p>

                    <p className="mt-1 text-[10px] text-[#78917D]">
                      Four ESG analyses available
                    </p>
                  </div>

                  <button
                    onClick={clearDocument}
                    className="rounded-lg p-1.5 text-[#91A096] transition hover:bg-white hover:text-[#4D6656]"
                    title="Remove document"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group w-full rounded-[22px] border border-dashed border-[#C9D5C7] bg-[#F5F7F2] p-5 text-left transition-all hover:border-[#91B77D] hover:bg-[#EDF4E9]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5C8A62] shadow-sm transition group-hover:scale-105">
                    <UploadCloud size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#294436]">
                      Add ESG report
                    </p>

                    <p className="mt-1 text-[10px] text-[#829187]">
                      PDF • Document-grounded analysis
                    </p>
                  </div>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />

            <div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-[#8A978D]">
              <ShieldCheck
                size={13}
                className="text-[#6E936C]"
              />

              <span>Document-grounded responses</span>
            </div>
          </div>
        </aside>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E1E5DD] bg-[#FBFAF6]/80 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#214D3A] text-white">
                <Leaf size={20} />
              </div>

              <div>
                <p className="text-base font-black tracking-tight text-[#17352A]">
                  EcoBot
                </p>

                <p className="text-[9px] font-bold uppercase tracking-wider text-[#78917D]">
                  ESG Intelligence
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E2] text-[#4E7D58]">
                {chatMode === "pdf" ? (
                  <FileSearch size={17} />
                ) : (
                  <Globe2 size={17} />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#294436]">
                  {chatMode === "pdf"
                    ? "Document Intelligence"
                    : "Global Sustainability Intelligence"}
                </p>

                <p className="text-[10px] text-[#8A978D]">
                  {chatMode === "pdf"
                    ? "Choose a focused ESG analysis"
                    : "Ask custom sustainability questions"}
                </p>
              </div>
            </div>

            {/* Mobile upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-[#D9E1D5] bg-white px-3 py-2 text-xs font-bold text-[#41624E] shadow-sm lg:hidden"
            >
              <UploadCloud size={15} />
              PDF
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-[#DCE4D9] bg-white px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#7CA36B]" />

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#708277]">
                Intelligence online
              </span>
            </div>
          </header>

          {/* =====================================================
              CONTENT
          ===================================================== */}

          <div className="relative flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-4 pb-56 pt-8 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-[930px]">
                {messages.length === 0 ? (
                  /* =================================================
                     LANDING PAGE
                  ================================================= */

                  <div className="flex min-h-[calc(100vh-180px)] flex-col justify-center pb-16">
                    <div className="max-w-3xl">
                      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8E3D2] bg-[#F1F6EE] px-3.5 py-2">
                        <Sparkles
                          size={14}
                          className="text-[#658D61]"
                        />

                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#658064]">
                          Sustainability Intelligence
                        </span>
                      </div>

                      <h1 className="max-w-3xl text-[42px] font-black leading-[1.05] tracking-[-0.055em] text-[#17352A] sm:text-[58px]">
                        Turn sustainability
                        <span className="block text-[#648C60]">
                          data into insight.
                        </span>
                      </h1>

                      <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#708078] sm:text-[16px]">
                        Explore ESG topics, understand environmental
                        performance, or upload a sustainability report
                        and run focused analysis against its contents.
                      </p>

                      <div className="mt-7 flex flex-wrap gap-2.5">
                        <div className="flex items-center gap-2 rounded-full border border-[#DDE5DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#607267] shadow-sm">
                          <Leaf
                            size={14}
                            className="text-[#709566]"
                          />
                          ESG & sustainability
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-[#DDE5DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#607267] shadow-sm">
                          <FileSearch
                            size={14}
                            className="text-[#709566]"
                          />
                          Document analysis
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-[#DDE5DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#607267] shadow-sm">
                          <BarChart3
                            size={14}
                            className="text-[#709566]"
                          />
                          ESG metrics
                        </div>
                      </div>
                    </div>

                    {/* Suggested normal questions */}
                    <div className="mt-12">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#99A59C]">
                          Explore EcoBot
                        </p>

                        <span className="hidden text-[10px] text-[#A3AEA5] sm:block">
                          Or type your own question below
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          {
                            icon: <Leaf size={17} />,
                            title: "Understand ESG",
                            text: "What are the main pillars of ESG?",
                          },
                          {
                            icon: <BarChart3 size={17} />,
                            title: "Explore metrics",
                            text: "What sustainability KPIs should a business track?",
                          },
                          {
                            icon: <Globe2 size={17} />,
                            title: "Climate impact",
                            text: "How can companies reduce their carbon footprint?",
                          },
                          {
                            icon: <Sprout size={17} />,
                            title: "Sustainable business",
                            text: "How can a company improve its sustainability strategy?",
                          },
                        ].map((item) => (
                          <button
                            key={item.title}
                            onClick={() =>
                              handleSuggestion(item.text)
                            }
                            className="group flex items-center gap-4 rounded-[20px] border border-[#DEE5DB] bg-white/80 p-4 text-left shadow-[0_5px_20px_rgba(42,64,48,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9CDB4] hover:bg-white hover:shadow-[0_12px_30px_rgba(42,64,48,0.08)]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4EA] text-[#60885D] transition group-hover:bg-[#E2EFDC]">
                              {item.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#334C3C]">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#87948B]">
                                {item.text}
                              </p>
                            </div>

                            <ArrowUpRight
                              size={15}
                              className="text-[#A7B1AA] transition group-hover:text-[#5F875B]"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =================================================
                     CHAT
                  ================================================= */

                  <div className="space-y-7 pb-8">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 sm:gap-4 ${
                          msg.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] shadow-sm sm:h-10 sm:w-10 ${
                            msg.role === "user"
                              ? "bg-[#214D3A] text-white"
                              : "border border-[#D7E3D3] bg-[#EDF5E9] text-[#568057]"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <User size={17} />
                          ) : (
                            <Bot size={19} />
                          )}
                        </div>

                        {/* Message */}
                        <div
                          className={`max-w-[85%] sm:max-w-[76%] ${
                            msg.role === "user"
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`mb-1.5 flex items-center gap-2 ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9BA69F]">
                              {msg.role === "user"
                                ? "You"
                                : "EcoBot"}
                            </span>
                          </div>

                          <div
                            className={`whitespace-pre-wrap rounded-[22px] px-5 py-4 text-[14px] leading-7 shadow-sm sm:px-6 ${
                              msg.role === "user"
                                ? "rounded-tr-md bg-[#214D3A] text-white shadow-[0_8px_25px_rgba(33,77,58,0.12)]"
                                : "rounded-tl-md border border-[#E0E6DE] bg-white text-[#53645A]"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading */}
                    {isLoading && (
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-[#D7E3D3] bg-[#EDF5E9] text-[#568057] sm:h-10 sm:w-10">
                          <Bot size={19} />
                        </div>

                        <div>
                          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#9BA69F]">
                            EcoBot
                          </div>

                          <div className="flex items-center gap-2 rounded-[20px] rounded-tl-md border border-[#E0E6DE] bg-white px-5 py-4 shadow-sm">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#72966C]" />

                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#72966C] [animation-delay:120ms]" />

                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#72966C] [animation-delay:240ms]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* =====================================================
                BOTTOM AREA
            ===================================================== */}

            <div className="pointer-events-none absolute bottom-0 left-0 w-full px-4 pb-5 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-[930px]">
                {chatMode === "pdf" && uploadedFileName ? (
                  /* =================================================
                     PDF MODE
                     ONLY 4 PREDEFINED BUTTONS
                  ================================================= */

                  <div className="pointer-events-auto">
                    {/* Active document */}
                    <div className="mb-3 flex items-center justify-center gap-2 text-[10px] text-[#718177]">
                      <FileText
                        size={13}
                        className="text-[#6C9167]"
                      />

                      <span>
                        Analyzing{" "}
                        <strong className="font-bold text-[#4E6557]">
                          {uploadedFileName}
                        </strong>
                      </span>

                      <CheckCircle2
                        size={12}
                        className="text-[#6B9566]"
                      />
                    </div>

                    {/* Analysis panel */}
                    <div className="rounded-[27px] border border-[#DCE3D9] bg-[#FFFEFB]/95 p-4 shadow-[0_15px_45px_rgba(45,65,49,0.12)] backdrop-blur-xl">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#405B49]">
                            ESG Report Analysis
                          </p>

                          <p className="mt-1 text-[10px] text-[#98A49C]">
                            Select one of the four available analyses
                          </p>
                        </div>

                        <div className="hidden items-center gap-1.5 rounded-full bg-[#EEF4EA] px-2.5 py-1.5 sm:flex">
                          <Sparkles
                            size={11}
                            className="text-[#658C60]"
                          />

                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#658064]">
                            Document RAG
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        {/* Carbon */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            runDocumentAnalysis("carbon")
                          }
                          className="group rounded-[18px] border border-[#DDE6DA] bg-[#F8FAF6] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#B9CDB4] hover:bg-[#F0F6ED] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E4F0E0] text-[#5D8959]">
                            <Leaf size={17} />
                          </div>

                          <p className="text-xs font-bold text-[#344D3D]">
                            Carbon Footprint
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#89958D]">
                            Emissions & reduction
                          </p>

                          <div className="mt-2 flex items-center text-[9px] font-bold text-[#6A8F65] opacity-0 transition group-hover:opacity-100">
                            Analyze
                            <ChevronRight size={11} />
                          </div>
                        </button>

                        {/* Water */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            runDocumentAnalysis("water")
                          }
                          className="group rounded-[18px] border border-[#DDE6DA] bg-[#F8FAF6] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#B9CDB4] hover:bg-[#F0F6ED] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F0F0] text-[#558181]">
                            <Droplets size={17} />
                          </div>

                          <p className="text-xs font-bold text-[#344D3D]">
                            Water Conservation
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#89958D]">
                            Usage & conservation
                          </p>

                          <div className="mt-2 flex items-center text-[9px] font-bold text-[#5B8580] opacity-0 transition group-hover:opacity-100">
                            Analyze
                            <ChevronRight size={11} />
                          </div>
                        </button>

                        {/* ESG */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            runDocumentAnalysis("esg")
                          }
                          className="group rounded-[18px] border border-[#DDE6DA] bg-[#F8FAF6] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#B9CDB4] hover:bg-[#F0F6ED] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBDC] text-[#987B45]">
                            <BarChart3 size={17} />
                          </div>

                          <p className="text-xs font-bold text-[#344D3D]">
                            ESG Prediction
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#89958D]">
                            Environmental • Social • Governance
                          </p>

                          <div className="mt-2 flex items-center text-[9px] font-bold text-[#927846] opacity-0 transition group-hover:opacity-100">
                            Predict
                            <ChevronRight size={11} />
                          </div>
                        </button>

                        {/* SDG */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            runDocumentAnalysis("sdg")
                          }
                          className="group rounded-[18px] border border-[#DDE6DA] bg-[#F8FAF6] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#B9CDB4] hover:bg-[#F0F6ED] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAE6F1] text-[#76678E]">
                            <Sprout size={17} />
                          </div>

                          <p className="text-xs font-bold text-[#344D3D]">
                            SDG Analysis
                          </p>

                          <p className="mt-1 text-[9px] leading-4 text-[#89958D]">
                            UN Sustainable Development Goals
                          </p>

                          <div className="mt-2 flex items-center text-[9px] font-bold text-[#76678E] opacity-0 transition group-hover:opacity-100">
                            Analyze
                            <ChevronRight size={11} />
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2 text-center text-[9px] text-[#9AA49D]">
                      <ShieldCheck size={11} />

                      <span>
                        Analysis is grounded in the uploaded sustainability
                        report.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* =================================================
                     NORMAL MODE
                     CUSTOM QUESTIONS ENABLED
                  ================================================= */

                  <div className="pointer-events-auto">
                    <div className="rounded-[27px] border border-[#DCE3D9] bg-[#FFFEFB]/95 p-2 shadow-[0_15px_45px_rgba(45,65,49,0.12)] backdrop-blur-xl">
                      <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2"
                      >
                        <div className="hidden pl-3 sm:block">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF4E9] text-[#638A60]">
                            <MessageSquare size={17} />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={input}
                          onChange={(e) =>
                            setInput(e.target.value)
                          }
                          placeholder="Ask about sustainability, ESG, climate, or impact..."
                          className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[14px] text-[#294436] outline-none placeholder:text-[#A0AAA2] sm:px-2"
                        />

                        <button
                          type="submit"
                          disabled={
                            isLoading || !input.trim()
                          }
                          className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-[#214D3A] text-white shadow-[0_7px_20px_rgba(33,77,58,0.18)] transition-all hover:bg-[#2C6149] hover:shadow-[0_10px_25px_rgba(33,77,58,0.25)] disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          {isLoading ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <Send
                              size={18}
                              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />
                          )}
                        </button>
                      </form>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2 text-center text-[9px] text-[#9AA49D]">
                      <ShieldCheck size={11} />

                      <span>
                        Ask custom questions about sustainability and ESG.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================
          PDF PROCESSING OVERLAY
      ========================================================= */}

      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17352A]/10 px-5 backdrop-blur-[3px]">
          <div className="w-full max-w-sm rounded-[28px] border border-[#DCE5D9] bg-[#FFFEFB] p-7 text-center shadow-[0_25px_80px_rgba(32,57,40,0.18)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#EAF3E5] text-[#5D895B]">
              <Loader2
                size={27}
                className="animate-spin"
              />
            </div>

            <h3 className="mt-5 text-lg font-black tracking-tight text-[#294436]">
              Processing your report
            </h3>

            <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#829087]">
              Preparing the document so EcoBot can run its focused ESG
              analyses.
            </p>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E8EEE5]">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#72976A]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
