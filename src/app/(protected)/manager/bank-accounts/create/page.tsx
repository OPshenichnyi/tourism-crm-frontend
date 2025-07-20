"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import BankAccountForm from "@/app/components/bankAccounts/BankAccountForm";
import {
  CreateBankAccountData,
  UpdateBankAccountData,
} from "@/app/types/bankAccount";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";

export default function CreateBankAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    data: CreateBankAccountData | UpdateBankAccountData
  ) => {
    setLoading(true);
    try {
      await apiService.bankAccounts.create(data as CreateBankAccountData);
      router.push("/manager/bank-accounts");
    } catch (error) {
      console.error("Failed to create bank account:", error);
      // Error handling is done in the form component
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/manager/bank-accounts");
  };

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
            Create New Bank Account
          </h1>
        </div>
        <p className="text-gray-600">
          Add a new bank account to receive payments from your agents and
          clients.
        </p>
      </div>

      {/* Form */}
      <BankAccountForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </DashboardLayout>
  );
}
