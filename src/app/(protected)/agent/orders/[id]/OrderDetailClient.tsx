"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { format } from "date-fns";
import Link from "next/link";
import { OrderDetails, Guest } from "@/app/types/order";

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchOrder();
  }, [orderId]);

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
            Повернутись до списку замовлень
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
                  order.statusOrder === "paid"
                    ? "bg-green-100 text-green-800"
                    : order.statusOrder === "unpaid"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {order.statusOrder === "paid"
                  ? "Оплачено"
                  : order.statusOrder === "unpaid"
                  ? "Не оплачено"
                  : "Підтверджено"}
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
              Інформація про оплату
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Офіційна ціна</label>
                <p className="font-medium">
                  {formatMoney(order.officialPrice)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Збір за прибирання
                </label>
                <p className="font-medium">{formatMoney(order.taxClean)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Загальна сума</label>
                <p className="text-xl font-bold text-blue-600">
                  {formatMoney(order.totalPrice)}
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Депозит</h3>
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      order.payments.deposit.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payments.deposit.status === "paid"
                      ? "Оплачено"
                      : "Не оплачено"}
                  </span>
                  <span className="font-medium">
                    {formatMoney(order.payments.deposit.amount)}
                  </span>
                </div>
                {order.payments.deposit.payment_methods.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Способи оплати:{" "}
                    {order.payments.deposit.payment_methods.join(", ")}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Баланс</h3>
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      order.payments.balance.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payments.balance.status === "paid"
                      ? "Оплачено"
                      : "Не оплачено"}
                  </span>
                  <span className="font-medium">
                    {formatMoney(order.payments.balance.amount)}
                  </span>
                </div>
                {order.payments.balance.payment_methods.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Способи оплати:{" "}
                    {order.payments.balance.payment_methods.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Банківські реквізити
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Рахунок</label>
                <p className="font-medium break-all">{order.bankAccount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
