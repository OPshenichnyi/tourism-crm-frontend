"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { OrderDetails, Guest } from "@/app/types/order";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: PageProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const getOrderId = async () => {
      const { id } = await params;
      setOrderId(id);
    };
    getOrderId();
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

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
                  order.statusOrder === "approved"
                    ? "bg-green-100 text-green-800"
                    : order.statusOrder === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {order.statusOrder === "approved"
                  ? "Підтверджено"
                  : order.statusOrder === "rejected"
                  ? "Відхилено"
                  : "Очікування резервації"}
              </span>
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
