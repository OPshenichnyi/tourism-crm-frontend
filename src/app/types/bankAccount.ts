export interface BankAccount {
  id: string;
  managerId: string;
  bankName: string;
  swift: string;
  iban: string;
  holderName: string;
  address?: string;
  identifier: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountData {
  bankName: string;
  swift: string;
  iban: string;
  holderName: string;
  address?: string;
  identifier: string;
}

export interface UpdateBankAccountData {
  bankName?: string;
  swift?: string;
  iban?: string;
  holderName?: string;
  address?: string;
  identifier?: string;
}

export interface BankAccountResponse {
  success: boolean;
  message: string;
  data: BankAccount;
}

export interface BankAccountsListResponse {
  success: boolean;
  message: string;
  data: BankAccount[];
}
