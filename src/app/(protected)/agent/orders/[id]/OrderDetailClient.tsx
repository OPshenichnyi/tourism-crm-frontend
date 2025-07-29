"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { format } from "date-fns";
import Link from "next/link";
import { OrderDetails, Guest } from "@/app/types/order";
import { BankAccount } from "@/app/types/bankAccount";

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankAccountLoading, setBankAccountLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await apiService.orders.getById(orderId);
      setOrder(response.order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankAccount = async (bankAccountId: string) => {
    if (!bankAccountId) return;

    setBankAccountLoading(true);
    try {
      const response = await apiService.bankAccounts.getById(bankAccountId);
      setBankAccount(response.data);
    } catch (err) {
      console.error("Error fetching bank account:", err);
      // Don't set error for bank account as it's not critical
    } finally {
      setBankAccountLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order?.bankAccount) {
      fetchBankAccount(order.bankAccount);
    }
  }, [order?.bankAccount]);

  const formatDate = (date: string) => {
    return format(new Date(date), "dd.MM.yyyy");
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout role="agent">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">
            {error || "Order not found"}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/agent/orders"
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to orders list
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.reservationNumber}
              </h1>
              <p className="text-sm text-gray-500">
                Created: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.statusOrder === "approved"
                    ? "bg-green-100 text-green-800"
                    : order.statusOrder === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {order.statusOrder === "approved"
                  ? "Approved"
                  : order.statusOrder === "rejected"
                  ? "Rejected"
                  : "Reservation pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Information - Moved to top */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-2">
                Agent Name:
              </span>
              <span className="text-gray-900 font-medium">
                {order.agentName}
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Travel Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Travel Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Check-in:
                </span>
                <span className="text-gray-900">
                  {formatDate(order.checkIn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Check-out:
                </span>
                <span className="text-gray-900">
                  {formatDate(order.checkOut)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Nights:
                </span>
                <span className="text-gray-900">{order.nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Property Name:
                </span>
                <span className="text-gray-900">{order.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Property Number:
                </span>
                <span className="text-gray-900">{order.propertyNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Country of Travel:
                </span>
                <span className="text-gray-900">{order.countryTravel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  City of Travel:
                </span>
                <span className="text-gray-900">{order.cityTravel}</span>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Client Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-gray-900">{order.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Email:
                </span>
                <span className="text-gray-900">{order.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Client ID:
                </span>
                <span className="text-gray-900">
                  {order.clientDocumentNumber || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Client Country:
                </span>
                <span className="text-gray-900">{order.clientCountry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Phone:
                </span>
                <span className="text-gray-900">
                  {order.clientPhone.map((phone: string, index: number) => (
                    <span key={index}>
                      {phone}
                      {index < order.clientPhone.length - 1 && ", "}
                    </span>
                  ))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Guests:
                </span>
                <span className="text-gray-900">
                  {order.guests.adults} adults, {order.guests.children.length}{" "}
                  children
                </span>
              </div>
              {order.guests.children.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Children age:
                  </span>
                  <span className="text-gray-900">
                    {order.guests.children
                      .map((child: Guest) => child.age)
                      .join(", ")}{" "}
                    years
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Official price:
                </span>
                <span className="text-gray-900">
                  {formatMoney(order.officialPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Cleaning fee:
                </span>
                <span className="text-gray-900">
                  {formatMoney(order.taxClean)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Discount:
                  </span>
                  <span className="text-green-600 font-medium">
                    {formatMoney(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Total amount:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatMoney(order.totalPrice)}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Deposit</h3>
                  <div className="flex-1 flex justify-center">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.payments.deposit.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.payments.deposit.status === "paid"
                        ? "Paid"
                        : "Not paid"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatMoney(order.payments.deposit.amount)}
                  </span>
                </div>
                {order.payments.deposit.payment_methods.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Payment methods:{" "}
                    {order.payments.deposit.payment_methods.join(", ")}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Balance</h3>
                  <div className="flex-1 flex justify-center">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.payments.balance.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.payments.balance.status === "paid"
                        ? "Paid"
                        : "Not paid"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatMoney(order.payments.balance.amount)}
                  </span>
                </div>
                {order.payments.balance.payment_methods.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Payment methods:{" "}
                    {order.payments.balance.payment_methods.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bank Details
            </h2>
            <div className="space-y-3">
              {bankAccountLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : bankAccount ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Bank Name:
                    </span>
                    <span className="text-gray-900">
                      {bankAccount.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Swift & BIC:
                    </span>
                    <span className="text-gray-900">{bankAccount.swift}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      IBAN:
                    </span>
                    <span className="text-gray-900 font-mono">
                      {bankAccount.iban}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Holder (Beneficiary):
                    </span>
                    <span className="text-gray-900">
                      {bankAccount.holderName}
                    </span>
                  </div>
                  {bankAccount.address && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Address:
                      </span>
                      <span className="text-gray-900">
                        {bankAccount.address}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span className="font-medium">Account:</span>
                    <span className="break-all">{order?.bankAccount}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Detailed information unavailable
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            className={`font-semibold py-3 px-6 rounded-lg transition-colors ${
              order.statusOrder === "approved"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => {
              if (order.statusOrder === "approved") {
                // TODO: Implement voucher download functionality
                console.log("Download voucher clicked");
              }
            }}
            disabled={order.statusOrder !== "approved"}
          >
            Download voucher
          </button>
          <Link
            href={`/agent/orders/${orderId}/edit`}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Edit order
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
