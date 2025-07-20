"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import BankAccountsList from "@/app/components/common/BankAccountsList";
import apiService from "@/app/services/apiService";
import { BankAccount } from "@/app/types/bankAccount";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function AgentBankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.bankAccounts.getList();
      setBankAccounts(response.bankAccounts);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Failed to load bank accounts:", err);
      setError(
        apiError.response?.data?.message || "Failed to load bank accounts"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    // Agents cannot edit bank accounts
    console.log("Agents cannot edit bank accounts");
  };

  const handleDelete = (id: string) => {
    // Agents cannot delete bank accounts
    console.log("Agents cannot delete bank accounts");
  };

  return (
    <DashboardLayout role="agent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Available Bank Accounts
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Bank accounts from your manager for payment processing
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Manager's Bank Accounts
            </h3>
            <p className="text-sm text-gray-500">
              These are the bank accounts your manager has set up for payments
            </p>
          </div>
          <BankAccountsList
            bankAccounts={bankAccounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
            userRole="agent"
          />
        </div>

        {bankAccounts.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  How to use bank accounts
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    When creating orders, you can select one of these bank
                    accounts by its identifier (e.g., "My Account 1").
                  </p>
                  <p className="mt-1">
                    The selected account will be used for payment processing in
                    the voucher.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
