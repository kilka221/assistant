export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export type Language = 'ru' | 'en';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Hypothesis {
  name: string;
  confidence: number; // 0 to 100
  reasoning: string;
}

export interface ClinicalAnalysis {
  sentiment: number; // -1.0 to 1.0
  status: string; // e.g., "Active Listening", "Intervention", "Crisis"
  sentimentReasoning?: string; // Why did it change?
  primaryHypothesis: Hypothesis;
  secondaryHypotheses: Hypothesis[];
  triggers: string[];
  recommendations: string[];
  narrativeUpdate?: string; // Optional update to the user's story
}

export interface UserProfile {
  diagnosis: string; // e.g., "Eating Disorder", "Anxiety"
  isStoryModeActive: boolean;
  storyText: string;
  messageCount: number;
  isSubscribed: boolean;
}

export interface ChartDataPoint {
  step: number;
  sentiment: number;
  status: string;
  reason?: string; // Short explanation for the tooltip
}

export interface UserInfo {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppState {
  messages: Message[];
  chartData: ChartDataPoint[];
  currentAnalysis: ClinicalAnalysis;
  userProfile: UserProfile;
  isLoading: boolean;
  apiKey: string;
}