import React, { useState, useMemo } from "react";
import { calculateSolarSavings, generateSystemQuotation } from "../calculatorUtils";

interface SavingsCalculatorProps {
  onApplyForQuote: (specs: { name?: string; phone?: string; monthlyBill: number; powerGoal: string }) => void;
}

export default function SavingsCalculator({ onApplyForQuote }: SavingsCalculatorProps) {
  const [monthlyBill, setMonthlyBill] = useState<number>(120000);
  const [powerGoal, setPowerGoal] = useState<string>("Bypassing KAEDCO Grid Instability");
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const metrics = useMemo(() => {
    return calculateSolarSavings(monthlyBill, powerGoal);
  }, [monthlyBill, powerGoal]);

  const quote = useMemo(() => {
    return generateSystemQuotation(monthlyBill, powerGoal);
  }, [monthlyBill, powerGoal]);

  // Generate 5-year projection data arrays for SVG chart
  const timelineData = useMemo(() => {
    const data = [];
    let cumulativeGridAndDiesel = 0;
    const baseAnnualCost = monthlyBill * 12;
    const baseAnnualDiesel = monthlyBill * 12 * 0.8;
    const blendedYearlyInflation = 1.18; // Typical utility & fuel hike in Nigeria

    let currentYearlyCost = baseAnnualCost + baseAnnualDiesel;

    for (let year = 1; year <= 5; year++) {
      cumulativeGridAndDiesel += currentYearlyCost;
      currentYearlyCost *= blendedYearlyInflation;

      // Solar has a high upfront investment, but trivial maintenance (1% per year)
      const cumulativeSolar = metrics.initialInvestment + (metrics.initialInvestment * 0.012 * (year - 1));

      data.push({
        year,
        gridCost: Math.round(cumulativeGridAndDiesel),
        solarCost: Math.round(cumulativeSolar),
        savings: Math.max(0, Math.round(cumulativeGridAndDiesel - cumulativeSolar))
      });
    }
    return data;
  }, [monthlyBill, metrics.initialInvestment]);

  // Coordinate chart markers
  const chartHeight = 220;
  const chartWidth = 560;
  const paddingX = 64;
  const paddingY = 24;

  const maxVal = Math.max(
    timelineData[4].gridCost,
    timelineData[4].solarCost
  ) * 1.05 || 5000000;

  const points = useMemo(() => {
    // Generate SVG path coordinates
    const gridPoints: string[] = [];
    const solarPoints: string[] = [];

    timelineData.forEach((d, idx) => {
      const x = paddingX + (idx / 4) * (chartWidth - paddingX * 2);
      const yGrid = chartHeight - paddingY - (d.gridCost / maxVal) * (chartHeight - paddingY * 2);
      const ySolar = chartHeight - paddingY - (d.solarCost / maxVal) * (chartHeight - paddingY * 2);

      gridPoints.push(`${x},${yGrid}`);
      solarPoints.push(`${x},${ySolar}`);
    });

    return {
      gridPath: `M ${gridPoints.join(" L ")}`,
      solarPath: `M ${solarPoints.join(" L ")}`,
      gridArea: `M ${paddingX},${chartHeight - paddingY} L ${gridPoints.join(" L ")} L ${chartWidth - paddingX},${chartHeight - paddingY} Z`,
      solarArea: `M ${paddingX},${chartHeight - paddingY} L ${solarPoints.join(" L ")} L ${chartWidth - paddingX},${chartHeight - paddingY} Z`,
      pointCoords: timelineData.map((d, idx) => ({
        year: d.year,
        x: paddingX + (idx / 4) * (chartWidth - paddingX * 2),
        yGrid: chartHeight - paddingY - (d.gridCost / maxVal) * (chartHeight - paddingY * 2),
        ySolar: chartHeight - paddingY - (d.solarCost / maxVal) * (chartHeight - paddingY * 2),
        data: d
      }))
    };
  }, [timelineData, maxVal]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10" id="calculator-section">
      {/* Title Header */}
      <div className="text-center md:text-left space-y-2">
        <span className="text-xs font-semibold tracking-wider text-[#00B4FF] uppercase">
          ⚡ Sizing & Sizing Engine
        </span>
        <h2 className="clash-display text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          Kaduna Solar Load Calculator
        </h2>
        <p className="text-sm md:text-base text-[#8A95AA] max-w-xl">
          Instantly size your panels and battery banks adjusted dynamically for peak Kaduna heat indexes and KAEDCO outages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs and Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-6 glow-blue">
            {/* Input 1: Monthly Bill */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs uppercase font-semibold tracking-wider">
                <span className="text-[#8A95AA]">Monthly Bill (₦)</span>
                <span className="text-[#F5A623] font-mono text-base tracking-normal">
                  ₦{monthlyBill.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="15000"
                max="800000"
                step="5000"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#050608] border border-[#1E2535] appearance-none cursor-pointer accent-[#F5A623]"
              />
              <div className="flex justify-between items-center text-[10px] text-[#4A5468] font-mono">
                <span>₦15k</span>
                <span className="text-[#8A95AA] border border-[#1E2535] px-2 py-0.5 rounded-md bg-[#050608]">
                  Or Enter Amount:{" "}
                  <input
                    type="number"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(Math.max(1000, Number(e.target.value)))}
                    className="w-20 bg-transparent text-[#F0F4FF] outline-none font-mono text-right"
                  />
                </span>
                <span>₦800k</span>
              </div>
            </div>

            {/* Input 2: Power Goal */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-semibold tracking-wider text-[#8A95AA]">
                Primary Solar Objective
              </label>
              <select
                value={powerGoal}
                onChange={(e) => setPowerGoal(e.target.value)}
                className="w-full bg-[#050608] border border-[#1E2535] rounded-xl px-4 py-3 text-sm text-[#F0F4FF] outline-none focus:border-[#00B4FF] transition-colors"
              >
                <option value="Bypassing KAEDCO Grid Instability">Bypass Grid Cuts & voltage surges</option>
                <option value="Constant AC & Cooling">Run Continuous Air Conditioners</option>
                <option value="Running a Borehole Pump">Power Heavy Borehole Pumping</option>
                <option value="Complete Off-Grid Autonomy">Complete Grid Independence (Entirely Off-Grid)</option>
              </select>
            </div>
          </div>

          {/* Sizing Metrics Output */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass hover:border-[#00B4FF]/65 rounded-xl p-4 transition-all duration-300">
              <span className="block text-[10px] font-semibold text-[#8A95AA] uppercase tracking-wider">
                Array Size
              </span>
              <span className="text-xl md:text-2xl font-bold text-[#F5A623] font-mono block mt-1">
                {metrics.recommendedKw} <span className="text-sm font-sans font-medium text-[#8A95AA]">kW</span>
              </span>
              <span className="text-[10px] text-[#4A5468] block mt-1">
                Approx. {Math.ceil(metrics.recommendedKw * 1000)}W Peak
              </span>
            </div>

            <div className="glass hover:border-[#00B4FF]/65 rounded-xl p-4 transition-all duration-300">
              <span className="block text-[10px] font-semibold text-[#8A95AA] uppercase tracking-wider">
                Battery storage
              </span>
              <span className="text-xl md:text-2xl font-bold text-[#00B4FF] font-mono block mt-1">
                {metrics.batteryKwh} <span className="text-sm font-sans font-medium text-[#8A95AA]">kWh</span>
              </span>
              <span className="text-[10px] text-[#4A5468] block mt-1">
                LiFePO4 Smart lithium bank
              </span>
            </div>

            <div className="glass hover:border-[#00B4FF]/65 rounded-xl p-4 transition-all duration-300">
              <span className="block text-[10px] font-semibold text-[#8A95AA] uppercase tracking-wider">
                Upfront Cost
              </span>
              <span className="text-lg md:text-xl font-bold text-[#F0F4FF] font-mono block mt-1">
                ₦{metrics.initialInvestment.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#4A5468] block mt-1">
                Fully installed, in Kaduna
              </span>
            </div>

            <div className="glass hover:border-[#00E5A0]/65 rounded-xl p-4 transition-all duration-300 border-l-2 border-l-[#00E5A0]">
              <span className="block text-[10px] font-semibold text-[#8A95AA] uppercase tracking-wider">
                5-Year Net Savings
              </span>
              <span className="text-lg md:text-xl font-bold text-[#00E5A0] font-mono block mt-1">
                ₦{metrics.fiveYearSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#4A5468] block mt-1">
                Against bills & diesel fuel
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Chart and Quote Sheet */}
        <div className="lg:col-span-7 space-y-6">
          {/* SVG Area Chart */}
          <div className="glass rounded-2xl p-6 space-y-4 glow-blue">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#F0F4FF]">5-Year Cumulative Costs Projection</h3>
                <span className="text-[11px] text-[#8A95AA] block">Grid & Private Generation is massive compared to Synergy Solar investment</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#00B4FF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B4FF]" /> Grid + Diesel
                </span>
                <span className="flex items-center gap-1.5 text-[#F5A623]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" /> Synergy Solar
                </span>
              </div>
            </div>

            {/* Custom SVG Drawing */}
            <div className="relative overflow-visible">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Gradients */}
                  <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00B4FF" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#00B4FF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5A623" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const y = paddingY + r * (chartHeight - paddingY * 2);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.04)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#4A5468] font-mono text-[10px]"
                      >
                        ₦{Math.round(((1 - r) * maxVal) / 1000000).toFixed(1)}M
                      </text>
                    </g>
                  );
                })}

                {/* Areas Fill */}
                <path d={points.gridArea} fill="url(#gridGrad)" />
                <path d={points.solarArea} fill="url(#solarGrad)" />

                {/* Plot Lines */}
                <path d={points.gridPath} fill="none" stroke="#00B4FF" strokeWidth="2" strokeLinecap="round" />
                <path d={points.solarPath} fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />

                {/* Vertical Intersections and Interactive Points */}
                {points.pointCoords.map((coord, idx) => {
                  const isHovered = hoveredYear === coord.year;
                  return (
                    <g key={idx} onMouseEnter={() => setHoveredYear(coord.year)} onMouseLeave={() => setHoveredYear(null)}>
                      {/* Interactive vertical hover helper */}
                      {isHovered && (
                        <line
                          x1={coord.x}
                          y1={paddingY}
                          x2={coord.x}
                          y2={chartHeight - paddingY}
                          stroke="#00B4FF"
                          strokeOpacity="0.3"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Grid/Diesel Points */}
                      <circle
                        cx={coord.x}
                        cy={coord.yGrid}
                        r={isHovered ? 6 : 3.5}
                        fill="#10141C"
                        stroke="#00B4FF"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200"
                      />

                      {/* Solar Points */}
                      <circle
                        cx={coord.x}
                        cy={coord.ySolar}
                        r={isHovered ? 7 : 4}
                        fill="#10141C"
                        stroke="#F5A623"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all duration-200"
                      />

                      {/* Axis Labels (Years) */}
                      <text
                        x={coord.x}
                        y={chartHeight - 6}
                        textAnchor="middle"
                        className={`font-mono text-[11px] cursor-pointer transition-colors ${
                          isHovered ? "fill-[#F0F4FF] font-semibold" : "fill-[#8A95AA]"
                        }`}
                      >
                        Year {coord.year}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Float Mini Tooltip Tool */}
              {hoveredYear !== null && (
                <div
                  className="absolute bg-[#161C28] border border-[#F5A623]/40 rounded-xl p-3 shadow-xl z-20 pointer-events-none text-xs space-y-1.5 backdrop-blur-md"
                  style={{
                    left: `${((hoveredYear - 1) / 4) * 78 + 10}%`,
                    top: "30%",
                  }}
                >
                  <p className="font-semibold text-[#F0F4FF] border-bottom border-[#1E2535] pb-1 font-mono">
                    PROJECTION: YEAR {hoveredYear}
                  </p>
                  <div>
                    <span className="text-[#8A95AA] block">Grid & Fuel Cost:</span>
                    <span className="font-mono text-[#00B4FF] font-medium">
                      ₦{timelineData[hoveredYear - 1].gridCost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8A95AA] block">Synergy Solar Cost:</span>
                    <span className="font-mono text-[#F5A623] font-medium">
                      ₦{timelineData[hoveredYear - 1].solarCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-[#1E2535] pt-1 mt-1">
                    <span className="text-[#8A95AA] block">Net Savings:</span>
                    <span className="font-mono text-[#00E5A0] font-bold">
                      ₦{timelineData[hoveredYear - 1].savings.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Quotation Card (Level 3 premium gradient panel) */}
      <div className="border border-[#F5A623]/30 rounded-2xl bg-gradient-to-br from-[#10141C]/80 to-[#1e2535]/50 backdrop-blur-md overflow-hidden shadow-2xl relative glow-gold">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Quote Header */}
        <div className="px-6 py-5 border-b border-[#1E2535]/80 bg-[#050608]/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-[#F5A623] uppercase block font-mono">
              OFFICIAL PROJECT BILL OF QUANTITIES
            </span>
            <h4 className="clash-display text-lg font-bold text-[#F0F4FF]">
              Itemized Synergy Commercial Sizing Breakdown
            </h4>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[10px] text-[#8A95AA] uppercase font-mono">ESTIMATED INVESTMENT</span>
            <span className="text-xl md:text-2xl font-bold font-mono text-[#F5A623]">
              ₦{quote.estimatedCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quote Items List */}
        <div className="divide-y divide-[#1E2535]/50 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
            <thead className="bg-[#050608]/20 text-[11px] font-bold tracking-wider text-[#8A95AA] uppercase font-mono">
              <tr>
                <th className="px-6 py-3">Equipment / Work item</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3">Technical Specifications</th>
                <th className="px-6 py-3 text-right">Cost (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2535]/35">
              {quote.breakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#1E2535]/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#F0F4FF]">{item.item}</td>
                  <td className="px-6 py-4 text-center text-[#8A95AA] font-mono text-xs">{item.quantity}</td>
                  <td className="px-6 py-4 text-xs text-[#8A95AA] max-w-sm truncate whitespace-normal font-sans">
                    {item.spec}
                  </td>
                  <td className="px-6 py-4 text-right text-[#F5A623] font-mono text-xs font-semibold">
                    ₦{item.cost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Interactive CTA */}
        <div className="p-6 bg-[#050608]/20 border-t border-[#1E2535]/80 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-[#8A95AA] max-w-md leading-relaxed">
            *This calculations handles Kaduna grid averages. Sizing coordinates automatically synchronize to our AI sales agent to preserve your consultation state.
          </p>
          <button
            onClick={() => onApplyForQuote({ monthlyBill, powerGoal })}
            id="claim-quote-btn"
            className="w-full md:w-auto px-8 py-3.5 bg-[#F5A623] hover:bg-[#C47E0F] text-[#050608] font-bold text-sm rounded-xl transition-all shadow-xl hover:shadow-[#F5A623]/20 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
          >
            <span>Consult AI Advisor</span>
            <span className="text-xs">⚡</span>
          </button>
        </div>
      </div>
    </div>
  );
}
