"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BankAccountList from "@/app/components/bankAccounts/BankAccountList";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { BankAccount } from "@/app/types/bankAccount";

export default function ManagerBankAccountsPage() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchBankAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.bankAccounts.getList();
      console.log("API Response:", response);

      // Перевіряємо правильний формат відповіді API
      if (
        response &&
        response.success &&
        response.data &&
        Array.isArray(response.data)
      ) {
        console.log("Bank accounts found:", response.data);
        setBankAccounts(response.data);
      } else {
        console.log("No bank accounts in response, setting empty array");
        setBankAccounts([]);
      }
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch bank accounts"
      );
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await apiService.bankAccounts.delete(id);
      await fetchBankAccounts(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete bank account:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/manager/bank-accounts/${id}/edit`);
  };

  const handleCreate = () => {
    router.push("/manager/bank-accounts/create");
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  return (
    <DashboardLayout role="manager">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bank Accounts</h1>
            <p className="text-gray-600">
              Manage your bank accounts for receiving payments
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Account
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading bank accounts
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchBankAccounts}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts List */}
      <BankAccountList
        bankAccounts={bankAccounts}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Delete Loading Overlay */}
      {deleteLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <p className="text-gray-700">Deleting bank account...</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
