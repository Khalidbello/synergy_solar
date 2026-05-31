import React, { useState, useEffect } from "react";
import { Users, Phone, Mail, Award, Edit, Trash2, Database, AlertTriangle, RefreshCw, Send, Radio, ShieldAlert } from "lucide-react";
import { Lead } from "../types";

export default function DashboardView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Administrative Manual override inputs
  const [overrideStatus, setOverrideStatus] = useState<string>("AI_CHATTING");
  const [overrideMessage, setOverrideMessage] = useState("");
  const [isSendingOverride, setIsSendingOverride] = useState(false);

  // Fallback diagnostic state
  const [systemDiag, setSystemDiag] = useState({
    fallbackMode: true,
    status: "connecting"
  });

  // Manual Add Form States
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadBill, setNewLeadBill] = useState(150000);
  const [newLeadGoal, setNewLeadGoal] = useState("Bypassing KAEDCO Grid Instability");
  const [showAddForm, setShowAddForm] = useState(false);

  // Load leads & diagnostics
  const refreshCRMData = async () => {
    setIsRefreshing(true);
    try {
      const leadsRes = await fetch("/api/crm/leads");
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.leads);
        // Sync selected lead if exists
        if (selectedLead) {
          const fresh = leadsData.leads.find((l: any) => l._id === selectedLead._id);
          if (fresh) {
            setSelectedLead(fresh);
            setOverrideStatus(fresh.status);
          }
        }
      }

      const diagRes = await fetch("/api/health");
      const diagData = await diagRes.json();
      setSystemDiag({
        fallbackMode: diagData.fallbackMode,
        status: diagData.status
      });
    } catch (err) {
      console.error("Error refreshing CRM:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshCRMData();
    // Poll updates every 5 seconds to ensure real time telemetry mapping
    const timer = setInterval(() => {
      refreshCRMData();
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedLead?._id]);

  // Handle select lead row
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setOverrideStatus(lead.status);
  };

  // Submit Administrative Status/Notes Override
  const handleUpdateStatus = async (status: string) => {
    if (!selectedLead) return;
    try {
      const res = await fetch("/api/crm/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLead._id,
          status: status
        })
      });
      const data = await res.json();
      if (data.success) {
        refreshCRMData();
      }
    } catch (err) {
      console.error("Update status failed:", err);
    }
  };

  // Submit human chat overrides
  const handleSendManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !overrideMessage.trim()) return;
    setIsSendingOverride(true);

    try {
      // Mock dispatch or insert message into lead's chat history directly
      const userMessageObj = {
        role: "model", // manual administrative responder speaks as the business/model
        content: `[Human Override] ${overrideMessage}`,
        timestamp: new Date().toISOString()
      };

      const res = await fetch("/api/crm/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLead._id,
          chatHistory: [...selectedLead.chatHistory, userMessageObj]
        })
      });

      const data = await res.json();
      if (data.success) {
        setOverrideMessage("");
        refreshCRMData();
      }
    } catch (err) {
      console.error("Error dispatching manual override:", err);
    } finally {
      setIsSendingOverride(false);
    }
  };

  // Delete lead handler
  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this lead from Synergy CRM?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        if (selectedLead?._id === id) {
          setSelectedLead(null);
        }
        refreshCRMData();
      }
    } catch (err) {
      console.error("Delete client error:", err);
    }
  };

  // Manual Offline Registration submission
  const handleOfflineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          email: newLeadEmail,
          monthlyBill: Number(newLeadBill),
          powerGoal: newLeadGoal,
          status: "NEW"
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewLeadName("");
        setNewLeadPhone("");
        setNewLeadEmail("");
        setNewLeadBill(150000);
        setShowAddForm(false);
        refreshCRMData();
      }
    } catch (err) {
      console.error("Offline registration error:", err);
    }
  };

  // Process filter arrays
  const filteredLeads = leads.filter(l => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "HANDOFF") return l.status === "HUMAN_INTERVENTION";
    if (activeFilter === "CHATTING") return l.status === "AI_CHATTING";
    if (activeFilter === "NEW") return l.status === "NEW";
    if (activeFilter === "CLOSED") return l.status === "CLOSED";
    return true;
  });

  // Calculate quick metrics
  const totalPipelineNaira = leads.reduce((sum, current) => {
    // Sized estimates of initial hardware investments mapping values
    const blendedRatePerKwh = 250;
    const recommendedKw = (current.monthlyBill / blendedRatePerKwh / 30 / 5.5) * 1.3 || 1.2;
    const batteryKwh = (current.monthlyBill / blendedRatePerKwh / 30) * 1.2 || 5;
    const est = (recommendedKw * 450000) + (batteryKwh * 350000) + 600000;
    return sum + (current.monthlyBill > 0 ? est : 2200000);
  }, 0);

  const humanNeedsCount = leads.filter(l => l.status === "HUMAN_INTERVENTION").length;
  const aiChattingCount = leads.filter(l => l.status === "AI_CHATTING").length;

  return (
    <div className="w-full min-h-[90vh] text-[#F0F4FF] space-y-8 font-sans pb-12">
      {/* 1. Urgent Handoff Sticky Banner */}
      {humanNeedsCount > 0 && (
        <div className="glass border border-[#F5A623]/35 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse glow-gold">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center text-[#F5A623] shrink-0 border border-[#F5A623]/20">
              <ShieldAlert size={22} className="animate-bounce" />
            </div>
            <div>
              <h3 className="clash-display font-extrabold text-[#F5A623] text-sm tracking-wider uppercase leading-tight">Urgent Human Override Alerts Active</h3>
              <p className="text-xs text-[#8A95AA] mt-0.5">
                Current {humanNeedsCount} Kaduna client(s) requested offline engineering overrides and contract advisory.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveFilter("HANDOFF")}
            className="px-4 py-2 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] text-xs font-mono uppercase tracking-widest font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Intervene Now
          </button>
        </div>
      )}

      {/* CRM Dashboard Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#F5A623] uppercase inline-flex items-center gap-1.5 bg-[#F5A623]/10 px-2.5 py-1 rounded-full border border-[#F5A623]/20">
            <Radio size={12} className="animate-pulse" /> Live Operational CRM Portals
          </span>
          <h2 className="clash-display text-2xl md:text-3.5xl font-extrabold text-white mt-2">Synergy Kaduna Coordinator</h2>
          <p className="text-sm text-[#8A95AA] mt-1.5 max-w-3xl leading-relaxed">
            Track active customer specifications, view conversations logs, override AI controls, and coordinate local pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-mono tracking-wider uppercase font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(245,166,35,0.2)]"
          >
            Register Manual Client
          </button>
          <button
            onClick={refreshCRMData}
            disabled={isRefreshing}
            className="p-2.5 bg-black/60 border border-[#1E2535] rounded-lg text-[#8A95AA] hover:text-[#F0F4FF] disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Offline Lead Manual Capture Form Overlay */}
      {showAddForm && (
        <form onSubmit={handleOfflineRegister} className="glass border border-[#1E2535] rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-5 animate-in slide-in-from-top-6 duration-300">
          <div className="md:col-span-12 pb-2 border-b border-[#1E2535]/80">
            <h4 className="clash-display text-base font-extrabold text-white">Staff Leads Offline Registration Portal</h4>
            <p className="text-xs text-[#8A95AA]">Manually file quotes and loads context for Kaduna walk-in clients.</p>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-[#8A95AA] tracking-wider">Client Name</label>
            <input required type="text" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} placeholder="Alhaji Bello" className="w-full bg-[#050608]/80 border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-[#8A95AA] tracking-wider">Phone Phone</label>
            <input required type="text" value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} placeholder="08031200000" className="w-full bg-[#050608]/80 border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-[#8A95AA] tracking-wider">Client Email</label>
            <input type="email" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} placeholder="bello@kaduna.ng" className="w-full bg-[#050608]/80 border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-[#8A95AA] tracking-wider">Monthly Bill (₦)</label>
            <input type="number" value={newLeadBill} onChange={e => setNewLeadBill(Number(e.target.value))} className="w-full bg-[#050608]/80 border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] transition-colors font-mono" />
          </div>
          <div className="md:col-span-8 space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-[#8A95AA] tracking-wider">Objective / Goal</label>
            <select value={newLeadGoal} onChange={e => setNewLeadGoal(e.target.value)} className="w-full bg-[#050608]/80 border border-[#1E2535] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] transition-colors">
              <option value="Bypassing KAEDCO Grid Instability">Bypass erratic KAEDCO blackout grids</option>
              <option value="Constant AC & Cooling">Power consistent home air conditioning load</option>
              <option value="Running a Borehole Pump">Run water borehole pumping</option>
              <option value="Complete Off-Grid Autonomy">Entirely off-grid system assembly</option>
            </select>
          </div>
          <div className="md:col-span-4 flex items-end gap-3.5 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-mono font-bold text-xs rounded-lg cursor-pointer">Register Lead</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2.5 border border-[#1E2535] bg-[#050608]/55 hover:bg-[#10141C]/55 text-xs rounded-lg cursor-pointer text-white">Cancel</button>
          </div>
        </form>
      )}

      {/* 2. Operations Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass p-5 rounded-xl hover:-translate-y-0.5 duration-300 transition-all shadow-lg select-none">
          <span className="block text-[10px] font-bold text-[#8A95AA] uppercase tracking-widest font-mono">
            TOTAL ACTIVE LEADS
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-white mt-1 inline-flex items-center gap-2 font-mono">
            {leads.length} <Users className="text-[#F5A623]" size={20} />
          </span>
          <div className="mt-1 text-[11px] text-[#4A5468]">Walk-ins, Web, and WhatsApp</div>
        </div>

        {/* KPI 2 */}
        <div className="glass p-5 rounded-xl hover:-translate-y-0.5 duration-300 transition-all shadow-lg select-none">
          <span className="block text-[10px] font-bold text-[#8A95AA] uppercase tracking-widest font-mono">
            ESTIMATED PROJECT PIPELINE
          </span>
          <span className="text-xl md:text-2xl font-extrabold text-[#F5A623] mt-1 block font-mono">
            ₦{Math.round(totalPipelineNaira / 1000000).toFixed(1)}M
          </span>
          <div className="mt-1 text-[11px] text-[#4A5468]">Calculated from hardware size</div>
        </div>

        {/* KPI 3 */}
        <div className="glass border-l-2 border-l-[#F5A623] p-5 rounded-xl hover:-translate-y-0.5 duration-300 transition-all shadow-lg select-none">
          <span className="block text-[10px] font-bold text-[#8A95AA] uppercase tracking-widest font-mono">
            HUMAN REQUIRED ACTIONS
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-[#F5A623] mt-1 inline-flex items-center gap-2 font-mono">
            {humanNeedsCount} <AlertTriangle size={20} className="text-[#F5A623] animate-pulse" />
          </span>
          <div className="mt-1 text-[11px] text-[#4A5468]">Currently require overrides</div>
        </div>

        {/* KPI 4 */}
        <div className="glass p-5 rounded-xl hover:-translate-y-0.5 duration-300 transition-all shadow-lg select-none">
          <span className="block text-[10px] font-bold text-[#8A95AA] uppercase tracking-widest font-mono">
            AI CHATTING ACTIVE
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-[#00E5A0] mt-1 inline-flex items-center gap-2 font-mono">
            {aiChattingCount} <Database size={18} className="text-[#00E5A0]" />
          </span>
          <div className="mt-1 text-[11px] text-[#4A5468]">Handling chats automatically</div>
        </div>
      </div>

      {/* 3. Main Operational Board Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Table Register - Left Column (8 units) */}
        <div className="xl:col-span-7 glass rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2535]/50">
            <h3 className="clash-display font-extrabold text-[#F0F4FF] text-base">Registries & Active Leads</h3>
            
            {/* Filter Toggle Controls */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono">
              {[
                { name: "All", tag: "ALL" },
                { name: "NEW", tag: "NEW" },
                { name: "Active Chat", tag: "CHATTING" },
                { name: "Requires Human", tag: "HANDOFF" },
              ].map((pill) => (
                <button
                  key={pill.tag}
                  onClick={() => setActiveFilter(pill.tag)}
                  className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${
                    activeFilter === pill.tag
                      ? "bg-[#F5A623] text-[#050608] font-extrabold"
                      : "bg-[#050608]/70 text-[#8A95AA] border border-[#1E2535]/50 hover:text-white"
                  }`}
                >
                  {pill.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tabular Lists block */}
          <div className="overflow-x-auto">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-sm text-[#8A95AA]">No leads match your active filtered state.</p>
                <button
                  onClick={() => setActiveFilter("ALL")}
                  className="text-xs text-[#00B4FF] hover:underline"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-[#8A95AA] whitespace-nowrap min-w-[500px]">
                <thead className="bg-[#050608]/50 text-xs font-semibold tracking-wider text-[#8A95AA] uppercase font-mono">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer Profile</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Monthly Bill</th>
                    <th className="px-4 py-3">Status Badge</th>
                    <th className="px-4 py-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2535]/35">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLead?._id === lead._id;
                    return (
                      <tr
                        key={lead._id}
                        onClick={() => handleSelectLead(lead)}
                        className={`hover:bg-[#1E2535]/30 transition-all cursor-pointer ${
                          isSelected ? "bg-[#1E2535]/50 border-l-2 border-l-[#F5A623]" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span className="text-[#F0F4FF] font-semibold text-sm block">
                              {lead.name}
                            </span>
                            <span className="text-[10px] text-[#4A5468] font-mono flex items-center gap-1.5">
                              {lead.email || "No email listed"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-[#00B4FF]">
                          {lead.phone}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[#F0F4FF] font-medium block">
                              ₦{lead.monthlyBill?.toLocaleString() || "0"}
                            </span>
                            <span className="text-[9px] text-[#4A5468] truncate max-w-xs block">
                              {lead.powerGoal}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                              lead.status === "HUMAN_INTERVENTION"
                                ? "bg-[#F5A623]/15 text-[#F5A623] animate-pulse border border-[#F5A623]/30"
                                : lead.status === "AI_CHATTING"
                                ? "bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/30"
                                : lead.status === "NEW"
                                ? "bg-[#00B4FF]/12 text-[#00B4FF] border border-[#00B4FF]/25"
                                : lead.status === "QUOTED"
                                ? "bg-purple-500/12 text-purple-400 border border-purple-500/25"
                                : "bg-zinc-700/15 text-zinc-500 border border-zinc-700/25"
                            }`}
                          >
                            {lead.status === "HUMAN_INTERVENTION" && (
                              <span className="w-1 h-1 rounded-full bg-[#F5A623] animate-ping" />
                            )}
                            {lead.status === "AI_CHATTING" ? "AI CHATTING" : lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) => handleDeleteLead(lead._id, e)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Override Panels & Chat Stream Monitor - Right Column (5 units) */}
        <div className="xl:col-span-5 glass rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[500px]">
          {selectedLead ? (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {/* Header Profile Info inside logs */}
              <div className="space-y-3 pb-3 border-b border-[#1E2535]">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="clash-display font-extrabold text-[#F5A623] text-base">{selectedLead.name}</h3>
                    <span className="text-xs text-[#8A95AA] inline-flex items-center gap-1.5 mt-1 font-mono">
                      <Phone size={11} /> {selectedLead.phone}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#4A5468] uppercase font-mono font-bold">STATUS CONTROL</span>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="mt-1 bg-[#050608] border border-[#1E2535] rounded-md text-[11px] text-[#F5A623] font-bold uppercase px-2 py-1 outline-none"
                    >
                      <option value="NEW">New</option>
                      <option value="AI_CHATTING">AI Chatting</option>
                      <option value="QUOTED">Quoted</option>
                      <option value="HUMAN_INTERVENTION">Human Override</option>
                      <option value="CLOSED">Closed/Signed</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#050608]/50 p-2.5 rounded-lg border border-[#1E2535]/80 text-[10px] text-[#8A95AA] font-mono space-y-0.5">
                  <p>Goal Priority: <span className="text-[#F0F4FF] font-medium">{selectedLead.powerGoal}</span></p>
                  <p>Calculated sizing: <span className="text-[#F5A623] font-medium">₦{selectedLead.monthlyBill?.toLocaleString()} monthly bill</span></p>
                </div>
              </div>

              {/* Chat log timeline */}
              <div className="flex-1 bg-[#050608]/40 border border-[#1E2535]/50 rounded-xl p-3 h-[250px] overflow-y-auto space-y-3.5">
                <p className="text-[10px] text-[#4A5468] font-bold text-center border-b border-[#1E2535]/50 pb-2 font-mono">
                  CHRONOLOGICAL TRANSCRIPT STREAM
                </p>
                {selectedLead.chatHistory && selectedLead.chatHistory.length > 0 ? (
                  selectedLead.chatHistory.map((item, index) => {
                    const isModel = item.role === "model";
                    const isSysOverride = item.content.startsWith("[Human Override]");
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-[#4A5468]">
                          <span>{isModel ? "BUSINESS / AI" : "CLIENT"}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p
                          className={`text-xs p-2.5 rounded-lg text-[#F0F4FF] leading-relaxed break-words whitespace-pre-wrap ${
                            isSysOverride
                              ? "bg-purple-950/30 border border-purple-800/30 text-purple-300"
                              : isModel
                              ? "bg-[#1E2535]/50 border border-[#1E2535]/80"
                              : "bg-[#F5A623]/5 border border-[#F5A623]/20"
                          }`}
                        >
                          {item.content}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-[#4A5468] text-center pt-8 italic">
                    No active messages recorded under this lead dossier yet.
                  </p>
                )}
              </div>

              {/* Offline Manual Override Messenger */}
              <form onSubmit={handleSendManualOverride} className="pt-2 border-t border-[#1E2535]/80 space-y-3">
                <span className="text-[10px] font-bold text-[#8A95AA] uppercase tracking-wider flex items-center gap-1.5 leading-none font-mono">
                  <Edit size={12} className="text-[#F5A623]" /> Send Manual Override Response
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={overrideMessage}
                    onChange={(e) => setOverrideMessage(e.target.value)}
                    placeholder="Enter manual override reply directly to client log..."
                    className="flex-1 bg-[#050608]/75 border border-[#1E2535] text-xs text-[#F0F4FF] rounded-xl px-4 py-3 outline-none focus:border-[#F5A623] placeholder:text-[#4A5468]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingOverride || !overrideMessage.trim()}
                    className="px-4 py-3 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] rounded-xl font-mono uppercase tracking-wider font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-[0_0_10px_rgba(245,166,35,0.2)]"
                  >
                    <span>Send</span> <Send size={12} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-3">
                <Database size={44} className="text-[#1E2535]/80" />
                <h4 className="clash-display font-bold text-sm text-[#8A95AA]">No Lead Dossier Selected</h4>
                <p className="text-xs text-[#4A5468] max-w-xs leading-relaxed">
                  Click on an individual customer row in the table diagram to read active conversations, check Kaduna sizing, delete leads, or register overrides.
                </p>
              </div>

              {/* Diagnostic Card */}
              <div className="p-4 bg-black/60 border border-[#1E2535]/80 rounded-xl space-y-2.5 text-xs glow-gold">
                <span className="text-[10px] uppercase font-bold text-[#8A95AA] tracking-wider block font-mono">
                  Synergy Cluster Diagnostics
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#4A5468]">Database Mode</span>
                    <span className={`font-mono font-bold ${systemDiag.fallbackMode ? "text-[#F5A623]" : "text-[#00E5A0]"}`}>
                      {systemDiag.fallbackMode ? "Mongoose Fallback (Sandbox)" : "MongoDB Connected (Production)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#4A5468]">Server Engine</span>
                    <span className="font-mono text-[#00E5A0]">online • active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. WhatsApp Business API — Developer Integration Hub */}
      <div className="glass rounded-3xl p-6 border border-[#1E2535] space-y-6 shadow-xl relative overflow-hidden select-none">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E2535]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 border border-[#F5A623]/30 rounded-md bg-[#F5A623]/10 text-[9px] font-mono font-bold text-[#F5A623]">
                DEV SERVICES
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
              <span className="text-[10px] font-mono text-[#8A95AA]">WEBHOOK LOGIC ACTIVE</span>
            </div>
            <h3 className="clash-display text-xl font-extrabold text-[#F0F4FF] mt-1.5 flex items-center gap-2">
              WhatsApp Business API Integration Suite
            </h3>
            <p className="text-xs text-[#8A95AA] mt-1 leading-relaxed max-w-2xl">
              Provides local staff engineers with live schemas, expected payload request/response JSON interfaces, and step-by-step instructions to connect custom Next.js endpoints.
            </p>
          </div>
          <a
            href="/WHATSAPP_INTEGRATION_GUIDE.md"
            target="_blank"
            className="px-4 py-2 border border-[#F5A623]/40 bg-[#F5A623]/5 text-[#F5A623] hover:bg-[#F5A623] hover:text-[#050608] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer text-center"
          >
            Open Guide Guide 🗎
          </a>
        </div>

        {/* Integration Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#050608]/50 p-5 rounded-2xl border border-[#1E2535]/40">
          
          {/* Steps & Guidelines left column */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Core Integration Steps
            </h4>

            <div className="space-y-3.5 text-xs text-[#8A95AA]">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[10px] text-[#F5A623] font-bold font-mono shrink-0">1</span>
                <div>
                  <strong className="text-white block font-mono text-[11px]">GET Verification Challenge</strong>
                  <p className="text-[10px] leading-relaxed mt-0.5 text-[#8A95AA]">Validate verify tokens against your verification handshake parameter.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[10px] text-[#F5A623] font-bold font-mono shrink-0">2</span>
                <div>
                  <strong className="text-white block font-mono text-[11px]">POST Event Listeners</strong>
                  <p className="text-[10px] leading-relaxed mt-0.5 text-[#8A95AA]">Parse incoming text messages, profile user Wa_IDs, and timestamps.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[10px] text-[#F5A623] font-bold font-mono shrink-0">3</span>
                <div>
                  <strong className="text-white block font-mono text-[11px]">RAG Sizing Execution</strong>
                  <p className="text-[10px] leading-relaxed mt-0.5 text-[#8A95AA]">Compute recommended panel count and LiFePO4 battery capacity dynamically.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[10px] text-[#F5A623] font-bold font-mono shrink-0">4</span>
                <div>
                  <strong className="text-white block font-mono text-[11px]">Outbound WhatsApp REST</strong>
                  <p className="text-[10px] leading-relaxed mt-0.5 text-[#8A95AA]">Construct payload and invoke Meta messaging endpoint with access token headers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* JSON Schema Code boxes right col */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Request Schema */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider font-mono text-[#8A95AA]">
                <span>Inbound Payloads (POST /api/whatsapp/webhook)</span>
              </div>
              <pre className="bg-[#050608] border border-[#1E2535] p-3 text-[10.5px] text-[#00E5A0] font-mono rounded-lg overflow-x-auto max-h-[175px] leading-relaxed select-all">
{`{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "contacts": [{
          "profile": { "name": "Alhaji Ibrahim" },
          "wa_id": "2348038086258"
        }],
        "messages": [{
          "from": "2348038086258",
          "text": { "body": "Need 5KVA estimate" },
          "type": "text"
        }]
      }
    }]
  }]
}`}
              </pre>
            </div>

            {/* Response Schema */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider font-mono text-[#8A95AA]">
                <span>Outbound Reply (POST /v20.0/messages)</span>
              </div>
              <pre className="bg-[#050608] border border-[#1E2535] p-3 text-[10.5px] text-[#F5A623] font-mono rounded-lg overflow-x-auto max-h-[175px] leading-relaxed select-all">
{`{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "2348038086258",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Hello Alhaji Ibrahim! Your Synergy Advisor estimated a 5KVA Solar rig. Total Cost: ₦3,850,000."
  }
}`}
              </pre>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
