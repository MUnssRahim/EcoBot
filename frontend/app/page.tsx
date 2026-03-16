"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, UploadCloud, FileText, Leaf, Loader2, Info, 
  MessageSquare, Bot, User, CheckCircle2, Sparkles
} from "lucide-react";

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<"simple" | "pdf">("simple");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ CHANGED: Using permanent URL and NO trailing slash
      const res = await fetch("https://eco-bot-v2.vercel.app/upload-pdf", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadedFileName(file.name);
        setChatMode("pdf");
        setMessages((prev) => [
          ...prev, 
          { role: "bot", content: `✅ Document ingested successfully. I have processed **${file.name}** and am ready to analyze its ESG metrics.` }
        ]);
      } else {
        const errText = await res.text();
        alert(`Failed to upload PDF: ${errText.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(error);
      alert("Cannot connect to server. Is FastAPI running?");
    } finally {
      setIsUploading(false);
    }
  };

  // 🛡️ CRASH-PROOF MESSAGE HANDLER
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("question", userMessage);

    // ✅ CHANGED: Using permanent URLs and NO trailing slashes
    const endpoint = chatMode === "pdf" && uploadedFileName
        ? "https://eco-bot-v2.vercel.app/ask-question"
        : "https://eco-bot-v2.vercel.app/ask-simple";

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      
      // 1. Get raw text to prevent JSON crash
      const rawText = await res.text();
      
      try {
        // 2. Try to parse JSON
        const data = JSON.parse(rawText);
        if (res.ok) {
          setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
        } else {
          setMessages((prev) => [...prev, { role: "bot", content: `⚠️ API Error: ${data.error || data.message}` }]);
        }
      } catch (jsonError) {
        // 3. Catch Python server crashes
        console.error("Server crashed:", rawText);
        setMessages((prev) => [...prev, { role: "bot", content: `⚠️ Server Error: Python crashed. Check your terminal! \n\nRaw output: ${rawText.substring(0, 150)}...` }]);
      }

    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Connectivity Error. Is the Python server running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-eco-100 overflow-hidden">
      
      {/* 🌿 CRISP WHITE SIDEBAR */}
      <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Logo Area */}
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-eco-50 rounded-2xl flex items-center justify-center text-eco-600 border border-eco-100 shadow-sm animate-float">
            <Leaf size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">EcoBot</h1>
            <p className="text-xs font-semibold text-eco-600 tracking-wider uppercase mt-0.5">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-2 mt-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4">Select Mode</p>
          
          <button 
            onClick={() => setChatMode("simple")} 
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 font-medium ${
              chatMode === "simple" 
                ? "bg-eco-50 text-eco-600 border border-eco-200/60 shadow-sm" 
                : "bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare size={20} className={chatMode === "simple" ? "text-eco-500" : "text-slate-400"} />
            Global Context
          </button>

          <button 
            onClick={() => uploadedFileName && setChatMode("pdf")} 
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 font-medium ${
              !uploadedFileName 
                ? "opacity-50 cursor-not-allowed text-slate-400" 
                : chatMode === "pdf" 
                  ? "bg-eco-50 text-eco-600 border border-eco-200/60 shadow-sm" 
                  : "bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={20} className={chatMode === "pdf" ? "text-eco-500" : "text-slate-400"} />
            Document RAG
            {uploadedFileName && chatMode === "pdf" && <span className="ml-auto w-2 h-2 rounded-full bg-eco-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
          </button>
        </nav>

        {/* 📥 BEAUTIFUL UPLOAD WIDGET */}
        <div className="p-6 mt-auto">
          <div className={`relative p-6 rounded-3xl border-2 border-dashed transition-all duration-300 ${
            uploadedFileName ? "bg-eco-50/50 border-eco-300" : "bg-slate-50 border-slate-200 hover:border-eco-300 hover:bg-white"
          }`}>
            <label className="cursor-pointer flex flex-col items-center justify-center text-center group">
              {uploadedFileName ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-eco-100 flex items-center justify-center mb-3 text-eco-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate w-full px-2">{uploadedFileName}</p>
                  <p className="text-xs text-eco-600 mt-1 font-medium">Ready for analysis</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud size={20} className="text-eco-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Upload PDF Report</p>
                  <p className="text-xs text-slate-400 mt-1">Maximum size: 10MB</p>
                </>
              )}
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            {isUploading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
                 <Loader2 className="animate-spin text-eco-500 mb-2" size={24} />
                 <p className="text-xs font-bold text-eco-600 tracking-widest uppercase">Parsing...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⚪ MAIN CHAT CANVAS */}
      <div className="flex-1 flex flex-col relative bg-[#F8FAFC]">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

        {/* Clean Header */}
        <header className="h-20 flex items-center px-10 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <Sparkles size={16} className="text-eco-500" />
            <h2 className="text-sm font-bold text-slate-700 tracking-wide">
              {chatMode === "simple" ? "General Sustainability Intelligence" : "Document Context: Active"}
            </h2>
          </div>
        </header>

        {/* Message Stream */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-48 z-0">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-slide-up">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                  <Bot size={48} className="text-eco-500" strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">How can I assist?</h1>
                <p className="text-slate-500 text-lg max-w-md leading-relaxed">
                  I can analyze ESG scores from uploaded reports or answer global sustainability questions.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}>
                  
                  {/* Avatars */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-900 text-white" 
                      : "bg-eco-500 text-white"
                  }`}>
                    {msg.role === "user" ? <User size={18} /> : <Bot size={20} />}
                  </div>

                  {/* Chat Bubbles */}
                  <div className={`relative max-w-[80%] px-7 py-5 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-900 text-white rounded-3xl rounded-tr-sm" 
                      : "bg-white text-slate-700 border border-slate-100 rounded-3xl rounded-tl-sm whitespace-pre-wrap"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {/* Loading Animation */}
            {isLoading && (
              <div className="flex gap-5 items-center animate-fade-in">
                <div className="w-10 h-10 rounded-2xl bg-eco-100 flex items-center justify-center text-eco-600 border border-eco-200">
                  <Bot size={20} />
                </div>
                <div className="bg-white border border-slate-100 px-6 py-5 rounded-3xl rounded-tl-sm flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 bg-eco-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-eco-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-eco-600 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ⌨️ PREMIUM GLASS INPUT AREA */}
        <div className="absolute bottom-8 left-0 w-full px-6 z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-2.5 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 transition-all focus-within:ring-eco-500/20 focus-within:shadow-[0_8px_30px_rgba(16,185,129,0.1)]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={chatMode === "simple" ? "Type your message..." : "Ask about the document..."}
                  className="flex-1 bg-transparent border-none py-4 px-6 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-slate-900 text-white p-4 rounded-full hover:bg-eco-600 transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:bg-slate-900 shadow-md group"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                </button>
              </form>
            </div>
            <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
              <Info size={14} /> EcoBot can make mistakes. Verify critical data.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}