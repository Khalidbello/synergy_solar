export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  monthlyBill: number;
  powerGoal: string;
  status: 'NEW' | 'QUOTED' | 'AI_CHATTING' | 'HUMAN_INTERVENTION' | 'CLOSED';
  chatHistory: ChatMessage[];
  createdAt: string;
}

export interface QuoteDetails {
  inverterKva: number;
  solarWatts: number;
  batteryKwh: number;
  batteryAh: number;
  estimatedCost: number;
  breakdown: {
    item: string;
    quantity: number;
    spec: string;
    cost: number;
  }[];
}

export interface SavingsMetrics {
  recommendedKw: number;
  batteryKwh: number;
  initialInvestment: number;
  annualSavings: number;
  fiveYearSavings: number;
  dieselSavings: number;
  gridSavings: number;
}
