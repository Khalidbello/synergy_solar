import { SavingsMetrics, QuoteDetails } from "./types";

/**
 * Localized Solar & Savings Sizing calculator for Kaduna, Nigeria
 * Base average sun hours for Kaduna: 5.5 hours/day
 * Temperature premium de-rating factor: 1.3 (to account for high Kaduna ambient temperature)
 */
export function calculateSolarSavings(monthlyBillNaira: number, powerGoal: string): SavingsMetrics {
  // Convert monthly Naira bill to estimated monthly kWh consumption
  // Effective blended rate (Grid tariff Band A + private diesel backup) in Kaduna is around ₦250/kWh
  const blendedRatePerKwh = 250;
  const monthlyKwh = monthlyBillNaira / blendedRatePerKwh;
  const dailyKwh = monthlyKwh / 30;

  // 1. Recommended system size in Kilowatts (kW)
  // Base average sun hours: 5.5 hours. Add de-rating factor of 1.3 for dusty Harmattan/heat in Kaduna.
  const recommendedKw = Number(((dailyKwh / 5.5) * 1.3).toFixed(2)) || 1.2;

  // 2. Battery capacity requirement (kWh)
  // Kaduna grids undergo heavy fluctuations; we size batteries for 1.2 days of autonomy/night load buffer
  const batteryKwh = Number((dailyKwh * 1.2).toFixed(2)) || 5.0;

  // 3. Initial investment in Naira (estimations for quality components in Nigeria)
  // Average premium panel, inverter, lithium battery costs in Nigeria:
  const costPerKwSolar = 450000; // ₦450k per kW of panels
  const costPerKwhBattery = 350000; // ₦350k per kWh of Lithium battery
  const baseInverterCost = 600000; // ₦600k base inverter/installation
  const initialInvestment = Math.round((recommendedKw * costPerKwSolar) + (batteryKwh * costPerKwhBattery) + baseInverterCost);

  // 4. Savings Projection
  // Annual grid cost (inflating with 15% annual tariff/grid hike projections in Nigeria)
  // Plus diesel fuel savings: Kaduna residents spend heavy running costs off grid.
  // We assume monthly generator petrol/diesel expense is roughly 60% of monthly electricity bill if grid is unstable.
  const annualGridCost = monthlyBillNaira * 12;
  const annualDieselCost = monthlyBillNaira * 12 * 0.8; // Nigeria diesel backup is extremely expensive
  const annualSavings = Math.round(annualGridCost * 0.85 + annualDieselCost * 0.95);

  const fiveYearSavings = Math.round(annualSavings * 5.8); // Includes compound inflation of fuel and grid rates
  const dieselSavings = Math.round(annualDieselCost * 5);
  const gridSavings = Math.round(annualGridCost * 5 * 0.85);

  return {
    recommendedKw: Math.max(1.0, recommendedKw),
    batteryKwh: Math.max(2.4, batteryKwh),
    initialInvestment,
    annualSavings,
    fiveYearSavings,
    dieselSavings,
    gridSavings,
  };
}

/**
 * Generate a detailed system quotation based on Kaduna criteria
 */
export function generateSystemQuotation(monthlyBillNaira: number, powerGoal: string): QuoteDetails {
  const metrics = calculateSolarSavings(monthlyBillNaira, powerGoal);
  
  // Decide system sizing and capacity specs
  const solarWatts = Math.ceil(metrics.recommendedKw * 1000);
  const inverterKva = metrics.recommendedKw > 4 ? 8 : metrics.recommendedKw > 2.5 ? 5 : 3.5;
  const batteryKwh = metrics.batteryKwh;
  // Convert kWh to Ah at 48V (standard solar voltage in Nigeria for medium/large setups)
  const batteryAh = Math.round((batteryKwh * 1000) / 48);

  const solarPanelsCost = Math.round(solarWatts * 450);
  const lithiumBatteryCost = Math.round(batteryKwh * 350000);
  const inverterCost = inverterKva === 8 ? 1200000 : inverterKva === 5 ? 800000 : 500000;
  const installationCivilCost = Math.round((solarPanelsCost + lithiumBatteryCost + inverterCost) * 0.12); // 12% of hardware
  
  const estimatedCost = solarPanelsCost + lithiumBatteryCost + inverterCost + installationCivilCost;

  return {
    inverterKva,
    solarWatts,
    batteryKwh,
    batteryAh,
    estimatedCost,
    breakdown: [
      {
        item: "Mono-crystalline Solar Panels",
        quantity: Math.ceil(solarWatts / 450),
        spec: "Tier-1 High-Efficiency 450W Panels (Heat Coefficient Tolerant)",
        cost: solarPanelsCost,
      },
      {
        item: "LiFePO4 Lithium Battery Battery",
        quantity: Math.ceil(batteryKwh / 5),
        spec: `48V ${batteryAh}Ah Smart BMS Lithium Battery Bank`,
        cost: lithiumBatteryCost,
      },
      {
        item: "Pure Sine Wave Smart Inverter",
        quantity: 1,
        spec: `${inverterKva}kVA Inverter with Dual MPPT Charge Controllers`,
        cost: inverterCost,
      },
      {
        item: "Surge Protection, Rails & Cabling",
        quantity: 1,
        spec: "AC/DC Isolators, Lightening Protection, Premium Kaduna Wind-Resistant Roof Racks",
        cost: Math.round(installationCivilCost * 0.4),
      },
      {
        item: "Kaduna Site Installation & Engineering",
        quantity: 1,
        spec: "Professional installation, testing, and 2-year maintenance contract warranty",
        cost: Math.round(installationCivilCost * 0.6),
      }
    ]
  };
}
