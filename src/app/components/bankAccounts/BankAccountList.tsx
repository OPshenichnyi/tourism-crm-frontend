"use client";

import React, { useState, useMemo } from "react";
import { BankAccount } from "@/app/types/bankAccount";
import BankAccountCard from "./BankAccountCard";

interface BankAccountListProps {
  bankAccounts: BankAccount[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function BankAccountList({
  bankAccounts,
  loading,
  error,
  onDelete,
  onEdit,
}: BankAccountListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"bankName" | "createdAt" | "identifier">(
    "bankName"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter and sort bank accounts
  const filteredAndSortedAccounts = useMemo(() => {
    // Перевіряємо, чи bankAccounts є масивом
    if (!Array.isArray(bankAccounts)) {
      return [];
    }

    const filtered = bankAccounts.filter((account) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        account.bankName.toLowerCase().includes(searchLower) ||
        account.identifier.toLowerCase().includes(searchLower) ||
        account.holderName.toLowerCase().includes(searchLower)
      );
    });

    // Sort accounts
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case "bankName":
          aValue = a.bankName.toLowerCase();
          bValue = b.bankName.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "identifier":
          aValue = a.identifier.toLowerCase();
          bValue = b.identifier.toLowerCase();
          break;
        default:
          aValue = a.bankName.toLowerCase();
          bValue = b.bankName.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bankAccounts, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: "bankName" | "createdAt" | "identifier") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
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
          Error Loading Bank Accounts
        </h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Bank Accounts Found
        </h3>
        <p className="text-gray-600 mb-4">
          You haven&apos;t created any bank accounts yet.
        </p>
        <p className="text-sm text-gray-500">
          Click the &quot;Add New Account&quot; button to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by bank name, identifier, or holder name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              handleSort(
                e.target.value as "bankName" | "createdAt" | "identifier"
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bankName">Sort by Bank Name</option>
            <option value="createdAt">Sort by Date</option>
            <option value="identifier">Sort by Identifier</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
          >
            {sortOrder === "asc" ? (
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedAccounts.length} of{" "}
        {Array.isArray(bankAccounts) ? bankAccounts.length : 0} bank accounts
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Bank Accounts Grid */}
      {filteredAndSortedAccounts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            No bank accounts match your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAccounts.map((account) => (
            <BankAccountCard
              key={account.id}
              bankAccount={account}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
