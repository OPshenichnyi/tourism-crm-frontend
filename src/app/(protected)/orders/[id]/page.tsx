"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { OrderDetails, Guest } from "@/app/types/order";
import { use } from "react";

interface PageProps {
  params: { id: string };
}

export default function OrderDetailsPage({ params }: PageProps) {
  const { id } = use(Promise.resolve(params));
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiService.orders.getById(id);
        setOrder(response.order);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

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
        {/* Header */}
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                {order.clientPhone.map((phone: string, index: number) => (
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
                    {order.guests.children
                      .map((child: Guest) => child.age)
                      .join(", ")}{" "}
                    років
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Travel Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Інформація про подорож
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Локація</label>
                <p className="font-medium">{order.locationTravel}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Дати</label>
                <p className="font-medium">
                  {formatDate(order.checkIn)} - {formatDate(order.checkOut)}
                </p>
                <p className="text-sm text-gray-500">{order.nights} ночей</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Країна агента</label>
                <p className="font-medium">{order.agentCountry}</p>
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
