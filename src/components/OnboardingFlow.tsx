import React, { useState, useEffect } from "react";
import { Sun, ShieldCheck, Zap, Activity, MessageSquare, ChevronRight, ChevronLeft, X, PlayCircle, BarChart3, Users, Sparkles } from "lucide-react";

interface OnboardingFlowProps {
  onStartCalculator: () => void;
  onOpenChat: () => void;
}

export default function OnboardingFlow({ onStartCalculator, onOpenChat }: OnboardingFlowProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Interactive mini-simulator variables for Step 3
  const [miniBill, setMiniBill] = useState<number>(150000);
  const [miniGoal, setMiniGoal] = useState<string>("Bypassing KAEDCO Grid Instability");

  // Load from localStorage to show on first visit automatically
  useEffect(() => {
    const hasVisited = localStorage.getItem("synergy_onboard_v1");
    if (!hasVisited) {
      setIsOpen(true);
      localStorage.setItem("synergy_onboard_v1", "true");
    }
  }, []);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onStartCalculator();
  };

  if (!isOpen) {
    // Return a beautiful quick trigger chip that remains visible in top margins so users can rerun the onboarding anytime!
    return (
      <button
        onClick={() => {
          setCurrentStep(1);
          setIsOpen(true);
        }}
        id="trigger-onboard-tour-btn"
        className="fixed bottom-6 left-6 z-40 px-4 py-2.5 bg-[#10141C] border border-[#F5A623]/40 hover:border-[#F5A623] hover:bg-[#F5A623]/5 group rounded-full text-xs font-bold text-[#F5A623] flex items-center gap-2 shadow-2xl transition-all duration-300 hover:scale-105"
      >
        <Sparkles size={14} className="animate-spin text-[#F5A623]" />
        <span>Interactive AI Tour</span>
        <span className="bg-[#F5A623]/25 text-[#F5A623] px-1.5 py-0.5 rounded text-[9px] font-mono group-hover:bg-[#F5A623] group-hover:text-[#050608] duration-300">
          LEARN
        </span>
      </button>
    );
  }

  // Simulated mini calculations for Step 3
  const simulateSizingKva = Math.round((miniBill / 50000) * 2) || 2.5;
  const simulatePanelsCount = Math.round(simulateSizingKva * 1.5) || 4;
  const simulateBatteryKwh = (simulateSizingKva * 2.5).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        id="onboarding-wizard-container"
        className="w-full max-w-2xl bg-[#10141C]/90 border border-[#1E2535] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,166,35,0.15)] flex flex-col relative glow-gold animate-in zoom-in-95 duration-300"
      >
        {/* Absolute Background Accent Glows */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#00B4FF]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#050608]/50 border-b border-[#1E2535] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#F5A623] rounded flex items-center justify-center">
              <Sun size={16} className="text-[#050608] font-bold" />
            </div>
            <span className="clash-display uppercase text-sm font-extrabold tracking-tight text-white">
              Synergy<span className="text-[#F5A623]">Renewable</span> Tour
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-[#8A95AA] hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            title="Skip Onboarding"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Dynamic Step Content */}
        <div className="p-8 flex-1 overflow-y-auto min-h-[350px] max-h-[75vh] flex flex-col justify-between">
          
          {/* STEP 1: WELCOME & ADVOCATOR ADVISOR INTRO */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-bold text-[#F5A623] tracking-[0.2em] uppercase bg-[#F5A623]/10 border border-[#F5A623]/25 px-2.5 py-1 rounded-full font-mono">
                  Step 1: Introducing Synergy Advisor
                </span>
                <h3 className="clash-display text-2xl md:text-4.5xl font-extrabold text-white leading-tight">
                  Escape the Kaduna <br/>
                  <span className="text-[#F5A623]">KAEDCO Instability</span>
                </h3>
                <p className="text-sm text-[#8A95AA] leading-relaxed max-w-lg">
                  Welcome to Synergy Renewable Energy Limited. In Kaduna, businesses and residential hubs face massive blackouts. We have deployed a smart, RAG-enabled AI sales copilot to instantly analyze your property load metrics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#050608]/70 border border-[#1E2535] rounded-xl flex gap-3 items-start">
                  <div className="p-2 bg-[#F5A623]/10 text-[#F5A623] rounded-lg">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Instant Conversational Intelligence</h5>
                    <p className="text-[11px] text-[#8A95AA] mt-1">Our AI calculates required solar outputs based on your typical utility expenses.</p>
                  </div>
                </div>

                <div className="p-4 bg-[#050608]/70 border border-[#1E2535] rounded-xl flex gap-3 items-start">
                  <div className="p-2 bg-[#00B4FF]/10 text-[#00B4FF] rounded-lg">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">24/7 Off-Grid Consultation</h5>
                    <p className="text-[11px] text-[#8A95AA] mt-1">Chat through our Web system or direct WhatsApp business pipelines anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SYSTEM CAPABILITIES */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-bold text-[#00B4FF] tracking-[0.2em] uppercase bg-[#00B4FF]/10 border border-[#00B4FF]/25 px-2.5 py-1 rounded-full font-mono">
                  Step 2: AI Capabilities & Sizing Automation
                </span>
                <h3 className="clash-display text-2xl md:text-4.5xl font-extrabold text-white leading-tight">
                  Qualified Specs & <br/>
                  <span className="text-[#00B4FF]">Uncontested Billing</span>
                </h3>
                <p className="text-sm text-[#8A95AA] leading-relaxed">
                  Our system coordinates mathematical formulas custom-mapped for Kaduna sun intervals (5.5 hrs/day peak) and temperature de-ratings. The Synergy AI carries out:
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#050608]/50 border border-[#1E2535] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-xs font-bold shrink-0">✓</div>
                  <div className="text-xs">
                    <strong className="text-white">Load Level Diagnostics:</strong> Estimates KVA rating for multiple air conditioners, deep freezer loads, and borehole pumps.
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#050608]/50 border border-[#1E2535] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-xs font-bold shrink-0">✓</div>
                  <div className="text-xs">
                    <strong className="text-white">Lithium Vault BMS Sizing:</strong> Simulates battery depth-of-discharge to specify safe capacities over 6,000 deep cycles.
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#050608]/50 border border-[#1E2535] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-xs font-bold shrink-0">✓</div>
                  <div className="text-xs">
                    <strong className="text-white">Staff Coordinator Routing:</strong> If custom details require direct human wisdom, the AI switches status to "HUMAN_INTERVENTION" signaling staff in real-time.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CALCULATOR TUTORIAL & SIMULATOR */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-bold text-[#00E5A0] tracking-[0.2em] uppercase bg-[#00E5A0]/10 border border-[#00E5A0]/25 px-2.5 py-1 rounded-full font-mono">
                  Step 3: Solar Load Calculator Sizing
                </span>
                <h3 className="clash-display text-2xl md:text-4.5xl font-extrabold text-white leading-tight">
                  Interactive Sizing <br/>
                  <span className="text-[#00E5A0]">Micro-Simulator</span>
                </h3>
                <p className="text-xs md:text-sm text-[#8A95AA] leading-relaxed">
                  Below, adjust your estimated monthly utility expenses to preview how the Synergy calculator defines structural solar components, costs, and 5-year savings:
                </p>
              </div>

              {/* Live Mini Sandbox */}
              <div className="p-4 bg-[#050608]/80 border border-[#F5A623]/20 rounded-2xl space-y-4 font-sans relative">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#8A95AA]">
                    <span>MONTHLY KAEDCO BILL / FUEL SPEND</span>
                    <span className="text-[#F5A623]">₦{miniBill.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="40000"
                    max="1000000"
                    step="10000"
                    value={miniBill}
                    onChange={(e) => setMiniBill(Number(e.target.value))}
                    className="w-full accent-[#F5A623] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-[#1E2535] pt-3">
                  <div className="p-2 bg-[#10141C] rounded-lg border border-[#1E2535]">
                    <span className="block text-[8px] font-mono text-[#8A95AA] uppercase tracking-wider">Inverter Size</span>
                    <span className="text-xs font-bold text-[#F5A623]">{simulateSizingKva} KVA</span>
                  </div>
                  <div className="p-2 bg-[#10141C] rounded-lg border border-[#1E2535]">
                    <span className="block text-[8px] font-mono text-[#8A95AA] uppercase tracking-wider">Panels Recommended</span>
                    <span className="text-xs font-bold text-[#00B4FF]">{simulatePanelsCount} units</span>
                  </div>
                  <div className="p-2 bg-[#10141C] rounded-lg border border-[#1E2535]">
                    <span className="block text-[8px] font-mono text-[#8A95AA] uppercase tracking-wider">LiFePO4 Storage</span>
                    <span className="text-xs font-bold text-[#00E5A0]">{simulateBatteryKwh} KWh</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#4A5468] text-center italic">
                  *This simulates real-time data from our robust design matrix.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: PROGRESS OVERVIEW & CALL TO ACTION */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-bold text-[#F5A623] tracking-[0.2em] uppercase bg-[#F5A623]/10 border border-[#F5A623]/25 px-2.5 py-1 rounded-full font-mono">
                  Step 4: Empower Your Solar Sizing
                </span>
                <h3 className="clash-display text-2xl md:text-4.5xl font-extrabold text-white leading-tight">
                  Ready to Squeeze <br/>
                  <span className="text-[#F5A623]">Outage Volatility?</span>
                </h3>
                <p className="text-sm text-[#8A95AA] leading-relaxed">
                  Our calculations are ready. To receive a formal, itemized Synergy quotation and explore payment schedules:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleComplete}
                  className="flex-1 py-3 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-bold text-xs uppercase tracking-wider font-mono rounded-xl cursor-pointer transition-colors text-center flex items-center justify-center gap-2 glow-gold"
                >
                  <BarChart3 size={14} />
                  <span>Go to Full Load Calculator</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenChat();
                  }}
                  className="flex-1 py-3 bg-[#00B4FF] hover:bg-[#0087CC] text-[#050608] font-bold text-xs uppercase tracking-wider font-mono rounded-xl cursor-pointer transition-colors text-center flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  <span>Consult Solar AI Widget</span>
                </button>
              </div>

              <div className="p-3.5 bg-[#050608]/50 border border-[#1E2535] rounded-xl flex items-center gap-3">
                <div className="p-1 px-2 border border-[#F5A623]/30 rounded bg-[#F5A623]/5 text-[10px] text-[#F5A623] font-mono leading-none">
                  INFO
                </div>
                <span className="text-[10px] text-[#8A95AA]">
                  All calculations and chat sessions sync with coordinates in the <strong>CRM Staff Portal</strong>, allowing our engineers in Kaduna to quickly verify load parameters.
                </span>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="mt-8 pt-5 border-t border-[#1E2535]/80 flex items-center justify-between">
            {/* Left Button */}
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="px-4 py-2 border border-[#1E2535] text-[#8A95AA] hover:text-white rounded-xl text-xs hover:bg-[#1E2535]/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-[#4A5468] hover:text-[#8A95AA] text-xs transition-colors cursor-pointer"
              >
                Skip active tour
              </button>
            )}

            {/* Current Progress indicators */}
            <div className="flex items-center gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === currentStep 
                      ? "w-6 bg-[#F5A623]" 
                      : i + 1 < currentStep 
                      ? "w-1.5 bg-[#00E5A0]" 
                      : "w-1.5 bg-[#1E2535]"
                  }`}
                />
              ))}
              <span className="text-[10px] text-[#4A5468] font-mono ml-1">
                {currentStep}/{totalSteps}
              </span>
            </div>

            {/* Right Button */}
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{currentStep === totalSteps ? "Finish" : "Continue"}</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
