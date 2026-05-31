import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, ChevronRight, AlertCircle, Phone } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatWidgetProps {
  prefilledBill: number;
  prefilledGoal: string;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function ChatWidget({
  prefilledBill,
  prefilledGoal,
  isOpen,
  onClose,
  onOpen,
}: ChatWidgetProps) {
  // Onboarding Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [leadStatus, setLeadStatus] = useState<string>("NEW");

  // Chat Log State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Check if session exists in memory on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("synergy_chat_phone");
    const savedName = localStorage.getItem("synergy_chat_name");
    if (savedPhone && savedName) {
      setPhone(savedPhone);
      setName(savedName);
      setIsOnboarded(true);
      fetchChatLogs(savedPhone);
    }
  }, []);

  // Fetch historic chats for logged in customer
  const fetchChatLogs = async (userPhone: string) => {
    try {
      const res = await fetch("/api/crm/leads");
      const data = await res.json();
      if (data.success && data.leads) {
        const lead = data.leads.find((l: any) => l.phone.trim() === userPhone.trim());
        if (lead) {
          setLeadStatus(lead.status);
          if (lead.chatHistory && lead.chatHistory.length > 0) {
            setMessages(lead.chatHistory);
          } else {
            // First time greeting
            triggerSystemGreeting(lead.name);
          }
        }
      }
    } catch (err) {
      console.error("Error drawing logs:", err);
    }
  };

  const triggerSystemGreeting = (userName: string) => {
    setMessages([
      {
        role: "model",
        content: `Sincere greetings, ${userName}! ⚡ This is Synergy Renewable Energy AI Advisor. Sized beautifully with your custom bills and goal priorities, I am ready to plan your premium installation. What Kaduna district or installation load can I clarify for you today?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Onboard Action
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    localStorage.setItem("synergy_chat_phone", phone);
    localStorage.setItem("synergy_chat_name", name);
    setIsOnboarded(true);

    setIsTyping(true);

    try {
      // Upsert Lead document
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          monthlyBill: prefilledBill,
          powerGoal: prefilledGoal,
          status: "NEW",
        }),
      });

      const data = await res.json();
      if (data.success && data.lead) {
        setLeadStatus(data.lead.status);
        if (data.lead.chatHistory && data.lead.chatHistory.length > 0) {
          setMessages(data.lead.chatHistory);
        } else {
          triggerSystemGreeting(name);
        }
      }
    } catch (err) {
      console.error("Onboarding register error:", err);
      triggerSystemGreeting(name);
    } finally {
      setIsTyping(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Periodic status poll (detect if human status flips on the backend)
  useEffect(() => {
    if (!isOnboarded || !phone || !isOpen) return;
    const interval = setInterval(() => {
      fetchChatLogs(phone);
    }, 6000);
    return () => clearInterval(interval);
  }, [isOnboarded, phone, isOpen]);

  // Send Message Event
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          senderId: phone,
          source: "web",
          leadInfo: {
            name,
            phone,
            email,
            monthlyBill: prefilledBill,
            powerGoal: prefilledGoal,
          },
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
        if (data.leadStatus) {
          setLeadStatus(data.leadStatus);
        }
      }
    } catch (err) {
      console.error("Chat failure:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRequestHandoff = async () => {
    if (!phone) return;
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Can I speak to a human engineer regarding custom quotes and contracts?",
          senderId: phone,
          source: "web",
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: "Can I speak to a human engineer regarding custom quotes and contracts?",
            timestamp: new Date().toISOString(),
          },
          {
            role: "model",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
        setLeadStatus("HUMAN_INTERVENTION");
      }
    } catch (err) {
      console.error("Handoff trigger failed:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem("synergy_chat_phone");
    localStorage.removeItem("synergy_chat_name");
    setPhone("");
    setName("");
    setMessages([]);
    setIsOnboarded(false);
    setLeadStatus("NEW");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. Closed State - Action Trigger Floating Panel */}
      {!isOpen && (
        <button
          onClick={onOpen}
          id="chat-toggle-btn"
          className="w-14 h-14 rounded-full bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] flex items-center justify-center shadow-2xl glow-gold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative group"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-25" />
          <MessageSquare size={24} className="stroke-[2.5]" />
          {/* Tooltip badge */}
          <span className="absolute right-16 bg-[#10141C] border border-[#1E2535] text-[#F0F4FF] text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-mono tracking-wider uppercase">
            Plan solar with AI ⚡
          </span>
        </button>
      )}

      {/* 2. Expanded Chat Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[390px] h-[580px] rounded-2xl glass shadow-2xl overflow-hidden flex flex-col glow-gold transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="px-5 py-4 bg-[#050608]/90 border-b border-[#1E2535]/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623] flex items-center justify-center font-bold text-[#050608] text-sm shadow-[0_0_10px_rgba(245,166,35,0.4)]">
                S
              </div>
              <div>
                <h3 className="clash-display text-sm font-extrabold text-white leading-none">Synergy Solar Advisor</h3>
                <span className="text-[10px] text-[#00E5A0] mt-1.5 inline-flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
                  RAG Smart Logic Active
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOnboarded && (
                <button
                  onClick={handleLogOut}
                  title="Change Details"
                  className="text-[10px] text-[#8A95AA] hover:text-white border border-[#1E2535] px-2.5 py-1 rounded bg-[#050608] font-mono"
                >
                  Reset
                </button>
              )}
              <button onClick={onClose} className="text-[#8A95AA] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body content */}
          {!isOnboarded ? (
            /* onboarding form first so we keep database synchronized */
            <form onSubmit={handleOnboardSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center space-y-2 pb-2">
                  <div className="w-12 h-12 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 mx-auto flex items-center justify-center text-[#F5A623] text-lg glow-gold">
                    ⚡
                  </div>
                  <h4 className="clash-display text-sm font-extrabold text-white">Configure Your AI Agent</h4>
                  <p className="text-xs text-[#8A95AA] leading-relaxed">
                    Enter your name and phone number to instantly map your solar load parameters and timeline metrics.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#8A95AA] font-mono font-bold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alhaji Ibrahim Musa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050608]/85 border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F0F4FF] outline-none focus:border-[#F5A623] placeholder:text-[#4A5468] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#8A95AA] font-mono font-bold">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08038086258"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#050608]/85 border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F0F4FF] outline-none focus:border-[#F5A623] placeholder:text-[#4A5468] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-[#8A95AA] font-mono font-bold">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="musa.ibrahim@outlook.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050608]/85 border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F0F4FF] outline-none focus:border-[#F5A623] placeholder:text-[#4A5468] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#1E2535]/80">
                <div className="bg-[#050608]/50 p-2.5 rounded-lg border border-[#1E2535] flex items-center gap-2.5 text-[11px] text-[#8A95AA]">
                  <AlertCircle size={14} className="text-[#F5A623] shrink-0" />
                  <span>
                    Auto-attaching: <b>{(prefilledBill/1000).toFixed(0)}k bill</b> and priority: <b>{prefilledGoal.slice(0, 16)}...</b>
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-mono uppercase tracking-wider font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch AI Consultation</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </form>
          ) : (
            /* Chat Session Active state */
            <React.Fragment>
              {/* Human override Sticky notice */}
              {leadStatus === "HUMAN_INTERVENTION" && (
                <div className="bg-[#F5A623]/10 border-b border-[#F5A623]/25 px-4 py-2.5 flex items-start gap-2 text-xs text-[#F5A623] animate-pulse font-mono">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold leading-tight">Human Engineering Override Active</p>
                    <p className="text-[10px] text-[#8A95AA]">
                      AI triggers isolated. An expert engineer will respond manually. Call: 0803 808 6258.
                    </p>
                  </div>
                </div>
              )}

              {/* Message Streams view */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#050608]/40">
                {messages.map((msg, i) => {
                  const isModel = msg.role === "model" || msg.role === "system";
                  return (
                    <div key={i} className={`flex flex-col ${isModel ? "items-start" : "items-end"} space-y-1`}>
                      <span className="text-[9px] text-[#4A5468] font-mono px-1">
                        {isModel ? "Synergy Advisor" : "Me"} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed break-words whitespace-pre-wrap ${
                          isModel
                             ? "bg-[#161C28]/90 text-[#F0F4FF] border border-[#1E2535] rounded-tl-sm"
                             : "bg-[#F5A623]/10 text-white border border-[#F5A623]/20 rounded-tr-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex flex-col items-start space-y-1">
                    <span className="text-[9px] text-[#4A5468] font-mono px-1">Synergy Advisor</span>
                    <div className="bg-[#161C28]/90 border border-[#1E2535] p-3 rounded-2xl rounded-tl-sm text-xs text-[#8A95AA]">
                      <div className="flex gap-1.5 animate-pulse items-center py-1 px-1">
                        <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                        <span className="w-2 h-2 rounded-full bg-[#00B4FF]" />
                        <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Controls Form Footer */}
              <div className="p-4 bg-[#050608]/95 border-t border-[#1E2535]/80 space-y-3">
                {leadStatus !== "HUMAN_INTERVENTION" && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-[#8A95AA]">Questions about premium upgrades?</span>
                    <button
                      onClick={handleRequestHandoff}
                      className="text-[10px] text-[#F5A623] hover:text-[#C47E0F] font-semibold uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Phone size={10} /> Fast Handoff
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2.5">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      leadStatus === "HUMAN_INTERVENTION"
                        ? "Handoff active - call 0803 808 6258"
                        : "Ask about panel sizing, warranties, or tiers..."
                    }
                    disabled={leadStatus === "HUMAN_INTERVENTION" && messages.length > 0}
                    className="flex-1 bg-[#050608]/60 border border-[#1E2535] rounded-xl px-4 py-3 text-xs text-[#F0F4FF] outline-none focus:border-[#F5A623] placeholder:text-[#4A5468] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || (leadStatus === "HUMAN_INTERVENTION" && messages.length > 0)}
                    className="w-10 h-10 rounded-xl bg-[#F5A623] text-[#050608] flex items-center justify-center shrink-0 hover:bg-[#C47E0F] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(245,166,35,0.3)]"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}
