/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sun, ShieldCheck, Zap, Activity, HardHat, CheckCircle2, ChevronRight, MessageSquare, Database, ArrowRight, Star } from "lucide-react";
import CanvasBackground from "./components/CanvasBackground";
import SavingsCalculator from "./components/SavingsCalculator";
import ChatWidget from "./components/ChatWidget";
import DashboardView from "./components/DashboardView";
import OnboardingFlow from "./components/OnboardingFlow";

export default function App() {
  // Navigation active state
  const [activeView, setActiveView] = useState<"marketing" | "crm">("marketing");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Prefilled calculator specifications passed to AI Chat
  const [prefilledBill, setPrefilledBill] = useState<number>(120000);
  const [prefilledGoal, setPrefilledGoal] = useState<string>("Bypassing KAEDCO Grid Instability");

  // Kaduna KAEDCO outage records
  const KADUNA_TRIAL_STATS = [
    { district: "Barnawa", hours: "4h/day", status: "Volatile" },
    { district: "Narayi Central", hours: "3h/day", status: "Unstable" },
    { district: "Malali", hours: "6h/day", status: "Outages" },
    { district: "Sabon Tasha", hours: "2h/day", status: "Critical" },
  ];

  // Process installation steps - condensed to 3 clean milestones
  const CONDENSED_STEPS = [
    {
      step: "01",
      name: "Load Sizing",
      spec: "Register with our Naira calculator or speak directly with our AI assistant.",
      color: "text-[#F5A623]"
    },
    {
      step: "02",
      name: "Expert Audit",
      spec: "Our engineering staff inspects roof lines, shadows, and thermal derating.",
      color: "text-[#00B4FF]"
    },
    {
      step: "03",
      name: "Safe Turnkey",
      spec: "Tier-1 panels and smart LiFePO4 battery banks commissioned with a 5-year warranty.",
      color: "text-[#00E5A0]"
    }
  ];

  const handleApplySpecsForQuote = (specs: { monthlyBill: number; powerGoal: string }) => {
    setPrefilledBill(specs.monthlyBill);
    setPrefilledGoal(specs.powerGoal);
    setIsChatOpen(true);
    const chatToggle = document.getElementById("chat-toggle-btn");
    if (chatToggle) {
      chatToggle.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStartCalculator = () => {
    const calc = document.getElementById("calculator-section");
    if (calc) {
      calc.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#F0F4FF] selection:bg-[#F5A623] selection:text-[#050608] relative">
      {/* 1. Cinematic Particle Canvas Background */}
      <CanvasBackground />

      {/* 2. Top Glass Navigation Bar (Height: 80px) */}
      <header className="sticky top-0 z-50 h-20 bg-[#050608]/90 backdrop-blur-md border-b border-[#1E2535]/80 transition-all">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveView("marketing")}>
            <div className="w-10 h-10 bg-[#F5A623] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,166,35,0.4)]">
              <Sun size={22} className="text-[#050608] stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <h1 className="clash-display text-2xl uppercase tracking-tighter text-white font-extrabold leading-none">
                SYNERGY<span className="text-[#F5A623]">RENEWABLE</span>
              </h1>
              <span className="text-[9px] text-[#8A95AA] uppercase tracking-wider font-mono mt-1">KADUNA, NIGERIA</span>
            </div>
          </div>

          {/* Nav middle anchors (marketing view only) */}
          {activeView === "marketing" && (
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#8A95AA] tracking-wider uppercase font-mono transition-colors">
              <a href="#district-journey" className="hover:text-[#F5A623] transition-colors">District & Journey</a>
              <a href="#calculator-section" className="hover:text-[#F5A623] transition-colors">Savings Sizing</a>
              <a href="#testimonials" className="hover:text-[#F5A623] transition-colors">Client Reviews</a>
            </nav>
          )}

          {/* Right Column CRM portals and client switch triggers */}
          <div className="flex items-center gap-3">
            {activeView === "marketing" ? (
              <button
                onClick={() => setActiveView("crm")}
                className="px-5 py-2 border border-[#F5A623] text-[#F5A623] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#F5A623] hover:text-[#050608] transition-all cursor-pointer"
              >
                CRM Portal
              </button>
            ) : (
              <button
                onClick={() => setActiveView("marketing")}
                className="px-5 py-2 border border-[#F5A623]/30 bg-[#F5A623]/10 hover:bg-[#F5A623]/20 text-xs font-semibold rounded-full text-[#F5A623] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                ← Back to Landing Page
              </button>
            )}
            
            {activeView === "marketing" && (
              <a
                href="#calculator-section"
                className="hidden sm:inline-flex px-5 py-2 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] text-xs font-bold uppercase tracking-wider rounded-full glow-gold hover:scale-105 transition-transform"
              >
                Get Sized
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layer */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* VIEW A: Landing Marketing Page */}
        {activeView === "marketing" && (
          <div className="space-y-20 md:space-y-28">
            {/* 1. Immersive Hero Section */}
            <section className="min-h-[65vh] flex flex-col justify-center items-center text-center space-y-8 pt-6 relative overflow-hidden">
              <div className="space-y-4 max-w-4xl relative z-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5A623]/10 border border-[#F5A623]/25 rounded-full mx-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse"></span>
                  <span className="text-[9px] font-bold text-[#F5A623] uppercase tracking-wider font-mono">Nigeria's Premium Solar Network</span>
                </div>
                
                <h2 className="clash-display text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
                  Power Your Ambition <br />
                  <span className="text-[#F5A623] italic font-normal">
                    Off-Grid.
                  </span>
                </h2>

                <p className="text-sm md:text-base text-[#8A95AA] max-w-2xl mx-auto leading-relaxed">
                  Engineered for Kaduna’s climate. Synergy provides Tier-1 solar automation that bypasses grid instability with technical precision, pure sine smart MPPT hybrids, and LiFePO4 battery vaults.
                </p>
              </div>

              {/* Actions buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-20 w-full max-w-xs sm:max-w-md mx-auto">
                <a
                  href="#calculator-section"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] rounded-xl font-bold text-sm uppercase tracking-wider font-mono glow-gold hover:scale-105 transition-transform cursor-pointer text-center"
                >
                  Start My Quotation
                </a>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full sm:w-auto px-8 py-3.5 glass text-[#F0F4FF] rounded-xl font-bold text-sm uppercase tracking-wider font-mono hover:bg-[#1E2535] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Chat Solar AI</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Stats Block - Simplified */}
              <div className="mt-8 flex justify-center gap-12 border-t border-[#1E2535]/60 pt-8 w-full max-w-lg mx-auto text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#4A5468] font-mono font-bold">Sun Hours</span>
                  <span className="text-base font-semibold text-white mt-1 font-mono">5.5h / day</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#4A5468] font-mono font-bold">Coverage</span>
                  <span className="text-base font-semibold text-[#00E5A0] mt-1 font-mono">Kaduna Central</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#4A5468] font-mono font-bold">Support</span>
                  <span className="text-base font-semibold text-white mt-1 font-mono">24/7 AI loop</span>
                </div>
              </div>
            </section>

            {/* Consolidated Sections: Outage Grid & Milestone Journey in a cohesive 2-column Layout */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-[#1E2535]/60" id="district-journey">
              
              {/* Left Column: District Outages (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded border border-[#F5A623]/20">
                    DIAGNOSTICS
                  </span>
                  <h3 className="clash-display text-xl md:text-2xl font-extrabold text-white">
                    KAEDCO Outage Grid
                  </h3>
                  <p className="text-xs text-[#8A95AA] leading-relaxed">
                    Hourly outages and voltage spikes degrade appliances across Kaduna.
                  </p>
                </div>

                <div className="space-y-2">
                  {KADUNA_TRIAL_STATS.map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 bg-[#050608]/70 border border-[#1E2535]/80 rounded-xl">
                      <span className="text-xs font-semibold text-white font-mono">{stat.district}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#F5A623] font-bold bg-[#F5A623]/5 px-2 py-0.5 rounded border border-[#F5A623]/15">{stat.hours}</span>
                        <span className="text-[10px] font-mono text-red-400 capitalize bg-red-400/5 px-2 py-0.5 rounded border border-red-400/15">{stat.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Sizing steps (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#00E5A0] bg-[#00E5A0]/10 px-2 py-0.5 rounded border border-[#00E5A0]/25">
                    PROCESS MILSTONES
                  </span>
                  <h3 className="clash-display text-xl md:text-2xl font-extrabold text-white">
                    Our Installation Sizing Blueprint
                  </h3>
                  <p className="text-xs text-[#8A95AA] leading-relaxed">
                    Move safely from load evaluation directly to structured solar deployments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {CONDENSED_STEPS.map((step, idx) => (
                    <div key={idx} className="glass p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-[#F5A623]/40 transition-all duration-300">
                      <div className="space-y-2">
                        <span className={`font-mono ${step.color} font-bold text-xs tracking-widest block`}>{step.step}</span>
                        <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">{step.name}</h4>
                        <p className="text-[11px] text-[#8A95AA] leading-relaxed font-sans">{step.spec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>

            {/* 3. Localized Savings Calculator */}
            <SavingsCalculator onApplyForQuote={handleApplySpecsForQuote} />

            {/* 4. Kaduna Social Proof Testimonials */}
            <section className="space-y-8 pb-4" id="testimonials">
              <div className="text-center space-y-1.5">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#00E5A0] uppercase bg-[#00E5A0]/10 border border-[#00E5A0]/20 px-2.5 py-0.5 rounded-full inline-block">
                  💬 SOCIAL PROOF
                </span>
                <h3 className="clash-display text-xl md:text-3xl font-extrabold text-white">
                  Synergy Solar Reviews
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="glass p-5 rounded-2xl space-y-4 hover:border-[#F5A62340] duration-300 transition-all">
                  <div className="flex items-center gap-1 text-[#F5A623]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-[#8A95AA] leading-relaxed italic">
                    "Went from spending ₦180,000 monthly on diesel fuel to constant uninterrupted solar grids. Best decision ever. Synergy team are professional."
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-white font-mono">Alhaji Mustapha Aminu</h5>
                    <span className="text-[9px] text-[#4A5468] font-mono block">Barnawa General Clinic</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="glass p-5 rounded-2xl space-y-4 hover:border-[#F5A62340] duration-300 transition-all">
                  <div className="flex items-center gap-1 text-[#F5A623]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-[#8A95AA] leading-relaxed italic">
                    "The KAEDCO fluctuations ruined my cooling fans compressor. The dual SPD surge protectors fitted by Synergy isolated our supply nicely."
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-white font-mono">Dr. Elizabeth Yusuf</h5>
                    <span className="text-[9px] text-[#4A5468] font-mono block">Malali Housing Colony</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="glass p-5 rounded-2xl space-y-4 hover:border-[#F5A62340] duration-300 transition-all">
                  <div className="flex items-center gap-1 text-[#F5A623]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-[#8A95AA] leading-relaxed italic">
                    "Awesome backup power. It easily manages our water borehole pump and AC load without dropping battery thresholds. Highly sophisticated loop."
                  </p>
                  <div>
                    <h5 className="font-bold text-xs text-white font-mono">Facilities Coordinator</h5>
                    <span className="text-[9px] text-[#4A5468] font-mono block">Kaduna Innovations Tech Hub</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW B: CRM Dashboard operational view */}
        {activeView === "crm" && <DashboardView />}

      </main>

      {/* 3. Floating Interactive RAG-enabled AI Chat Advisor Widget (Client Only) */}
      {activeView === "marketing" && (
        <ChatWidget
          prefilledBill={prefilledBill}
          prefilledGoal={prefilledGoal}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onOpen={() => setIsChatOpen(true)}
        />
      )}

      {/* 4. Interactive Onboarding Tour Wizard (Client Only) */}
      {activeView === "marketing" && (
        <OnboardingFlow
          onStartCalculator={handleStartCalculator}
          onOpenChat={() => setIsChatOpen(true)}
        />
      )}

      {/* Footer Section */}
      <footer className="border-t border-[#1E2535] bg-[#050608] py-8 text-center text-xs text-[#4A5468] font-mono relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Synergy Renewable Energy Limited. Kaduna, Nigeria. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[#8A95AA] hover:text-[#F0F4FF] cursor-pointer" onClick={() => setActiveView("marketing")}>Client View</span>
            <span>•</span>
            <span className="text-[#8A95AA] hover:text-[#F0F4FF] cursor-pointer" onClick={() => setActiveView("crm")}>Staff Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
