"use client";

import React, { useState } from "react";
import { BankAccount } from "@/app/types/bankAccount";

interface BankAccountCardProps {
  bankAccount: BankAccount;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function BankAccountCard({
  bankAccount,
  onDelete,
  onEdit,
}: BankAccountCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied!`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = () => {
    onDelete(bankAccount.id);
    setShowDeleteModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {bankAccount.bankName}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Identifier:{" "}
              <span className="font-medium">{bankAccount.identifier}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(bankAccount.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Account Holder */}
          <div>
            <p className="text-sm text-gray-600">Account Holder</p>
            <p className="font-medium text-gray-800">
              {bankAccount.holderName}
            </p>
          </div>

          {/* IBAN */}
          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">IBAN</p>
              <button
                onClick={() => copyToClipboard(bankAccount.iban, "IBAN")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="font-mono text-sm bg-gray-50 p-2 rounded border">
              {bankAccount.iban}
            </p>
          </div>

          {/* SWIFT/BIC */}
          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">SWIFT/BIC</p>
              <button
                onClick={() => copyToClipboard(bankAccount.swift, "SWIFT")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="font-mono text-sm bg-gray-50 p-2 rounded border">
              {bankAccount.swift}
            </p>
          </div>

          {/* Address */}
          {bankAccount.address && (
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-sm text-gray-800">{bankAccount.address}</p>
            </div>
          )}

          {/* Created Date */}
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="text-sm text-gray-800">
              {formatDate(bankAccount.createdAt)}
            </p>
          </div>
        </div>

        {/* Copy Success Message */}
        {copySuccess && (
          <div className="mt-3 p-2 bg-green-100 text-green-800 text-sm rounded-md">
            {copySuccess}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Delete Bank Account
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the bank account &quot;
              {bankAccount.bankName}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
