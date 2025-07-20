"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import BankAccountForm from "@/app/components/bankAccounts/BankAccountForm";
import { UpdateBankAccountData, BankAccount } from "@/app/types/bankAccount";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";

export default function EditBankAccountPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bankAccountId = params.id as string;

  useEffect(() => {
    const fetchBankAccount = async () => {
      if (!bankAccountId) {
        setError("Bank account ID is required");
        setLoadingData(false);
        return;
      }

      try {
        console.log("Fetching bank account with ID:", bankAccountId);

        // Отримуємо список всіх банківських рахунків і знаходимо потрібний
        const response = await apiService.bankAccounts.getList();
        console.log("Bank accounts list response:", response);

        if (
          response &&
          response.success &&
          response.data &&
          Array.isArray(response.data)
        ) {
          const foundAccount = response.data.find(
            (account) => account.id === bankAccountId
          );

          if (foundAccount) {
            console.log("Found bank account:", foundAccount);
            setBankAccount(foundAccount);
          } else {
            console.log("Bank account not found in list");
            setError("Bank account not found");
          }
        } else {
          console.log("Invalid response format:", response);
          setError("Failed to load bank accounts");
        }
      } catch (error) {
        console.error("Error fetching bank account:", error);
        setError("Failed to load bank account");
      } finally {
        setLoadingData(false);
      }
    };

    fetchBankAccount();
  }, [bankAccountId]);

  const handleSubmit = async (data: UpdateBankAccountData) => {
    if (!bankAccount) return;

    setLoading(true);
    try {
      await apiService.bankAccounts.update(bankAccount.id, data);
      router.push("/manager/bank-accounts");
    } catch (error) {
      console.error("Failed to update bank account:", error);
      // Error handling is done in the form component
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/manager/bank-accounts");
  };

  if (loadingData) {
    return (
      <DashboardLayout role="manager">
        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !bankAccount) {
    return (
      <DashboardLayout role="manager">
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              {error || "Bank account not found"}
            </h3>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Edit Bank Account
          </h1>
        </div>
        <p className="text-gray-600">Update your bank account information.</p>
      </div>

      {/* Form */}
      <BankAccountForm
        bankAccount={bankAccount}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </DashboardLayout>
  );
}
