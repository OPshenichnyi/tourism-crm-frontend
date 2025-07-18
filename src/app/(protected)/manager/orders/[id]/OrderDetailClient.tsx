"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import { OrderDetails } from "@/app/types/order";

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async (
    newStatus: "approve" | "paid" | "unpaid"
  ) => {
    if (!order || isUpdating) return;

    setIsUpdating(true);
    try {
      await apiService.orders.updateStatus(order.id, newStatus);
      await fetchOrder();
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (
    paymentType: "deposit" | "balance",
    newStatus: "paid" | "unpaid"
  ) => {
    if (!order || isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedOrder = {
        payments: {
          deposit:
            paymentType === "deposit"
              ? {
                  status: newStatus,
                  payment_methods: order.payments.deposit.payment_methods,
                  amount: order.payments.deposit.amount,
                }
              : order.payments.deposit,
          balance:
            paymentType === "balance"
              ? {
                  status: newStatus,
                  payment_methods: order.payments.balance.payment_methods,
                  amount: order.payments.balance.amount,
                }
              : order.payments.balance,
        },
      };
      await apiService.orders.update(order.id, updatedOrder);
      await fetchOrder();
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("Failed to update payment status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: uk });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="manager">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout role="manager">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">
            {error || "Order not found"}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/manager/orders"
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

        {/* Header with Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Замовлення #{order.reservationNumber}
              </h1>
              <p className="text-sm text-gray-500">
                Створено: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Status Badge */}
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

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusUpdate("approve")}
                  disabled={isUpdating || order.statusOrder === "approve"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Підтвердити
                </button>
                <button
                  onClick={() => handleStatusUpdate("paid")}
                  disabled={isUpdating || order.statusOrder === "paid"}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Позначити як оплачене
                </button>
                <Link
                  href={`/manager/orders/${order.id}/edit`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Редагувати
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Agent Information
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Agent Name:
                </span>
                <p className="text-gray-900">{order.agentName}</p>
              </div>
            </div>
          </div>

          {/* Travel Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Travel Information
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Check-in:
                </span>
                <p className="text-gray-900">{formatDate(order.checkIn)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Check-out:
                </span>
                <p className="text-gray-900">{formatDate(order.checkOut)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Nights:
                </span>
                <p className="text-gray-900">{order.nights}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Client Country:
                </span>
                <p className="text-gray-900">{order.clientCountry}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Country of Travel:
                </span>
                <p className="text-gray-900">{order.countryTravel}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  City of Travel:
                </span>
                <p className="text-gray-900">{order.cityTravel}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Property Name:
                </span>
                <p className="text-gray-900">{order.propertyName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Property Number:
                </span>
                <p className="text-gray-900">{order.propertyNumber}</p>
              </div>
              {order.discount > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Discount:
                  </span>
                  <p className="text-green-600 font-medium">
                    {order.discount}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Інформація про клієнта
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Ім&apos;я</label>
                <p className="font-medium">{order.clientName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{order.clientEmail}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Телефон</label>
                {order.clientPhone.map((phone, index) => (
                  <p key={index} className="font-medium">
                    {phone}
                  </p>
                ))}
              </div>
              <div>
                <label className="text-sm text-gray-500">Гості</label>
                <p className="font-medium">
                  {order.guests.adults} дорослих, {order.guests.children.length}{" "}
                  дітей
                </p>
                {order.guests.children.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Вік дітей:{" "}
                    {order.guests.children.map((child) => child.age).join(", ")}{" "}
                    років
                  </p>
                )}
              </div>
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
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Депозит</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePaymentStatusUpdate("deposit", "paid")
                      }
                      disabled={
                        isUpdating || order.payments.deposit.status === "paid"
                      }
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Оплачено
                    </button>
                    <button
                      onClick={() =>
                        handlePaymentStatusUpdate("deposit", "unpaid")
                      }
                      disabled={
                        isUpdating || order.payments.deposit.status === "unpaid"
                      }
                      className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Не оплачено
                    </button>
                  </div>
                </div>
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
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Баланс</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePaymentStatusUpdate("balance", "paid")
                      }
                      disabled={
                        isUpdating || order.payments.balance.status === "paid"
                      }
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Оплачено
                    </button>
                    <button
                      onClick={() =>
                        handlePaymentStatusUpdate("balance", "unpaid")
                      }
                      disabled={
                        isUpdating || order.payments.balance.status === "unpaid"
                      }
                      className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Не оплачено
                    </button>
                  </div>
                </div>
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
