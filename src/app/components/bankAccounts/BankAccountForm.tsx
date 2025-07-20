"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  BankAccount,
  CreateBankAccountData,
  UpdateBankAccountData,
} from "@/app/types/bankAccount";

interface BankAccountFormProps {
  bankAccount?: BankAccount;
  onSubmit: (
    data: CreateBankAccountData | UpdateBankAccountData
  ) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormData {
  bankName: string;
  swift: string;
  iban: string;
  holderName: string;
  address: string;
  identifier: string;
}

export default function BankAccountForm({
  bankAccount,
  onSubmit,
  onCancel,
  loading = false,
}: BankAccountFormProps) {
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [isCheckingIdentifier, setIsCheckingIdentifier] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      bankName: bankAccount?.bankName || "",
      swift: bankAccount?.swift || "",
      iban: bankAccount?.iban || "",
      holderName: bankAccount?.holderName || "",
      address: bankAccount?.address || "",
      identifier: bankAccount?.identifier || "",
    },
  });

  const watchedIdentifier = watch("identifier");

  // SWIFT/BIC validation
  const validateSwift = (value: string) => {
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    if (!value) return "SWIFT/BIC is required";
    if (!swiftRegex.test(value)) {
      return "SWIFT/BIC must be 8 or 11 characters, uppercase letters and numbers only";
    }
    return true;
  };

  // IBAN validation
  const validateIban = (value: string) => {
    if (!value) return "IBAN is required";
    if (value.length < 15 || value.length > 34) {
      return "IBAN must be between 15 and 34 characters";
    }
    // Basic IBAN format check
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    if (!ibanRegex.test(value.replace(/\s/g, ""))) {
      return "Invalid IBAN format";
    }
    return true;
  };

  // Check identifier uniqueness
  const checkIdentifierUniqueness = async (identifier: string) => {
    if (!identifier || identifier.length < 1) return;

    setIsCheckingIdentifier(true);
    setIdentifierError(null);

    try {
      // This would be a separate API call to check uniqueness
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate check - in real implementation, call API
      if (identifier === "duplicate") {
        setIdentifierError("This identifier is already in use");
      }
    } catch {
      setIdentifierError("Failed to check identifier uniqueness");
    } finally {
      setIsCheckingIdentifier(false);
    }
  };

  useEffect(() => {
    if (watchedIdentifier && watchedIdentifier.length >= 1) {
      const timeoutId = setTimeout(() => {
        checkIdentifierUniqueness(watchedIdentifier);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [watchedIdentifier]);

  const handleFormSubmit = async (data: FormData) => {
    if (identifierError) {
      return;
    }

    try {
      await onSubmit(data as CreateBankAccountData | UpdateBankAccountData);
    } catch {
      console.error("Form submission error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {bankAccount ? "Edit Bank Account" : "Create New Bank Account"}
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Bank Name */}
        <div>
          <label
            htmlFor="bankName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Bank Name *
          </label>
          <input
            {...register("bankName", {
              required: "Bank name is required",
              minLength: {
                value: 3,
                message: "Bank name must be at least 3 characters",
              },
              maxLength: {
                value: 100,
                message: "Bank name must be less than 100 characters",
              },
            })}
            type="text"
            id="bankName"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.bankName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter bank name"
          />
          {errors.bankName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.bankName.message}
            </p>
          )}
        </div>

        {/* SWIFT/BIC */}
        <div>
          <label
            htmlFor="swift"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            SWIFT/BIC *
          </label>
          <input
            {...register("swift", {
              required: "SWIFT/BIC is required",
              validate: validateSwift,
            })}
            type="text"
            id="swift"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.swift ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter SWIFT/BIC code"
            style={{ textTransform: "uppercase" }}
          />
          {errors.swift && (
            <p className="mt-1 text-sm text-red-600">{errors.swift.message}</p>
          )}
        </div>

        {/* IBAN */}
        <div>
          <label
            htmlFor="iban"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            IBAN *
          </label>
          <div className="relative">
            <input
              {...register("iban", {
                required: "IBAN is required",
                validate: validateIban,
              })}
              type="text"
              id="iban"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.iban ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter IBAN"
              style={{ textTransform: "uppercase" }}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(watch("iban"))}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              title="Copy IBAN"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          {errors.iban && (
            <p className="mt-1 text-sm text-red-600">{errors.iban.message}</p>
          )}
        </div>

        {/* Holder Name */}
        <div>
          <label
            htmlFor="holderName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Account Holder Name *
          </label>
          <input
            {...register("holderName", {
              required: "Holder name is required",
              pattern: {
                value: /^[a-zA-Z\s]+$/,
                message: "Holder name can only contain letters and spaces",
              },
              minLength: {
                value: 2,
                message: "Holder name must be at least 2 characters",
              },
              maxLength: {
                value: 100,
                message: "Holder name must be less than 100 characters",
              },
            })}
            type="text"
            id="holderName"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.holderName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter account holder name"
          />
          {errors.holderName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.holderName.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Address (Optional)
          </label>
          <textarea
            {...register("address", {
              maxLength: {
                value: 200,
                message: "Address must be less than 200 characters",
              },
            })}
            id="address"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter address (optional)"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Identifier */}
        <div>
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Identifier *
          </label>
          <div className="relative">
            <input
              {...register("identifier", {
                required: "Identifier is required",
                minLength: {
                  value: 1,
                  message: "Identifier must be at least 1 character",
                },
                maxLength: {
                  value: 50,
                  message: "Identifier must be less than 50 characters",
                },
              })}
              type="text"
              id="identifier"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.identifier || identifierError
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter unique identifier"
            />
            {isCheckingIdentifier && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {errors.identifier && (
            <p className="mt-1 text-sm text-red-600">
              {errors.identifier.message}
            </p>
          )}
          {identifierError && (
            <p className="mt-1 text-sm text-red-600">{identifierError}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValid || !!identifierError}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : bankAccount ? (
              "Update Account"
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
