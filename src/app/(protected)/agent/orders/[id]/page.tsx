"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";

interface Order {
  id: string;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  location: string;
  country: string;
  reservationCode: string;
  reservationLink: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  adults: number;
  children: number;
  totalPrice: number;
  cashOnCheckIn: boolean;
  damageDeposit: boolean;
  status: "draft" | "confirmed" | "paid";
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.orders.getById(id);
        console.log("load", response);
        setOrder(response.order);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Update order status
  const updateOrderStatus = async (
    newStatus: "draft" | "confirmed" | "paid"
  ) => {
    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      await apiService.orders.update(id, { status: newStatus });

      // Update local state
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));

      setUpdateMessage({
        type: "success",
        text: `Order status successfully updated to ${newStatus}`,
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      setUpdateMessage({
        type: "error",
        text: "Failed to update order status. Please try again.",
      });
    } finally {
      setIsUpdating(false);

      // Clear message after 3 seconds
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);
    }
  };

  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex justify-center items-center h-full">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout role="agent">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Order not found"}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push("/agent/orders")}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Order #{order.id.substring(0, 8)}
          </h1>
          <p className="text-gray-600">
            Created on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex">
          <button
            onClick={() => router.push("/agent/orders")}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 mr-2"
          >
            Back to Orders
          </button>
          <button
            onClick={() => router.push(`/agent/orders/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Order
          </button>
        </div>
      </div>

      {updateMessage && (
        <div
          className={`mb-6 p-4 rounded-md ${
            updateMessage.type === "success"
              ? "bg-green-50 border border-green-400 text-green-700"
              : "bg-red-50 border border-red-400 text-red-700"
          }`}
        >
          {updateMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow overflow-hidden md:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Order Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Property Details
                </h3>
                <p className="text-gray-800 font-medium">
                  {order.propertyName}
                </p>
                <p className="text-gray-600">
                  {order.location}, {order.country}
                </p>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Reservation Code
                </p>
                <p className="text-gray-800">{order.reservationCode}</p>
                {order.reservationLink && (
                  <div className="mt-2">
                    <a
                      href={order.reservationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Reservation Link
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Stay Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="text-gray-800">{formatDate(order.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="text-gray-800">
                      {formatDate(order.checkOut)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-gray-800">
                  {calculateNights(order.checkIn, order.checkOut)} nights
                </p>

                <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">
                  Guests
                </h3>
                <p className="text-gray-800">
                  {order.adults} adults
                  {order.children > 0 ? `, ${order.children} children` : ""}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-gray-800">{order.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-800">{order.clientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-800">{order.clientPhone}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="text-gray-800 font-semibold">
                    ${order.totalPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="text-gray-800">
                    {order.paymentMethod || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="text-gray-800">
                    {order.paymentStatus || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={order.cashOnCheckIn}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Cash payment on check-in
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={order.damageDeposit}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Damage deposit required
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Order Status
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Current Status
              </h3>
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  order.status === "draft"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "confirmed"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Update Status
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => updateOrderStatus("draft")}
                  disabled={order.status === "draft" || isUpdating}
                  className={`w-full py-2 px-3 rounded-md text-sm font-medium text-left ${
                    order.status === "draft"
                      ? "bg-yellow-100 text-yellow-800 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-yellow-50 text-gray-700 hover:text-yellow-800"
                  }`}
                >
                  Set as Draft
                </button>
                <button
                  onClick={() => updateOrderStatus("confirmed")}
                  disabled={order.status === "confirmed" || isUpdating}
                  className={`w-full py-2 px-3 rounded-md text-sm font-medium text-left ${
                    order.status === "confirmed"
                      ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-800"
                  }`}
                >
                  Set as Confirmed
                </button>
                <button
                  onClick={() => updateOrderStatus("paid")}
                  disabled={order.status === "paid" || isUpdating}
                  className={`w-full py-2 px-3 rounded-md text-sm font-medium text-left ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-800 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-800"
                  }`}
                >
                  Set as Paid
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-800">{formatDate(order.updatedAt)}</p>
                </div>
                <button
                  onClick={() => router.push(`/agent/orders/${id}/edit`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
