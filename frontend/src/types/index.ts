export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  email: string;
  openingHours: string;
  timezone?: string;
  isOpen: boolean;
}

export interface ModifierOption {
  name: string;
  price: number;
  available?: boolean;
  modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
  name: string;
  required?: boolean;
  multiple?: boolean;
  minSelection?: number;
  maxSelection?: number;
  options: ModifierOption[];
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  image?: string;
  available: boolean;
  preparationTime?: number;
  keywords?: string[];
  modifierGroups?: ModifierGroup[];
}

export interface SelectedModifier {
modifierOptionId: string;
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  _id?: string;
  menuId: string;
  itemName: string;
  basePrice: number;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  totalPrice: number;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  tax?: number;
  total: number;
}

export interface Order {
  _id: string;
  sessionId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  orderStatus: "pending" | "confirmed" | "preparing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface Analytics {
  sessionId: string;
  orderId?: string | null;
  totalTurns: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  toolCalls: number;
  firstResponseLatency: number;
  averageLatency: number;
  totalLatency: number;
  totalDuration: number;
  orderPlaced: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface ToolCall {
  toolName: string;
  arguments?: Record<string, unknown>;
  result?: Record<string, unknown>;
  executionTime: number;
  timestamp: string;
}

export interface CallLog {
  _id: string;
  sessionId: string;
  orderId?: string | null;
  transcript?: TranscriptEntry[];
  summary?: string;
  toolCalls?: ToolCall[];
  duration?: number;
  startedAt: string;
  endedAt?: string;
  completed?: boolean;
}

