export interface Guest {
  age: number;
}

export interface Guests {
  adults: number;
  children: Guest[];
}

export interface Payment {
  status: "paid" | "unpaid";
  amount: number;
  payment_methods: ("cash" | "bank" | "revolut")[];
}

export interface Payments {
  deposit: Payment;
  balance: Payment;
}

export interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface OrderDetails {
  id: string;
  agentId: string;
  createdOrder: string;
  agentName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  clientCountry: string;
  countryTravel: string;
  cityTravel: string;
  propertyName: string;
  propertyNumber: string;
  discount: number;
  reservationNumber: string;
  clientName: string;
  clientPhone: string[];
  clientEmail: string | null;
  clientDocumentNumber?: string;
  guests: Guests;
  officialPrice: number;
  taxClean: number;
  totalPrice: number;
  bankAccount: string;
  // New payment structure
  depositAmount: number;
  depositStatus: "paid" | "unpaid";
  depositDueDate?: string;
  depositPaymentMethods: ("cash" | "bank" | "revolut")[];
  balanceAmount: number;
  balanceStatus: "paid" | "unpaid";
  balanceDueDate?: string;
  balancePaymentMethods: ("cash" | "bank" | "revolut")[];
  // Legacy payments structure for backward compatibility
  payments?: Payments;
  statusOrder: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  agent: Agent;
}

export interface OrderResponse {
  message: string;
  order: OrderDetails;
}

export type PaymentType = "deposit" | "balance";
export type PaymentStatus = "paid" | "unpaid";

export interface UpdatePaymentStatusRequest {
  orderId: string;
  paymentType: PaymentType;
  status: PaymentStatus;
}
