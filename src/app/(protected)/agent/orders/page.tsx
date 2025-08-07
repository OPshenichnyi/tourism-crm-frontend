"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Guest {
  age: number;
}

interface Guests {
  adults: number;
  children: Guest[];
}

interface Payment {
  status: "paid" | "unpaid";
  amount: number;
  payment_methods: string[];
}

interface Payments {
  deposit: Payment;
  balance: Payment;
}

interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Order {
  id: string;
  agentId: string;
  createdOrder: string;
  agentName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  clientCountry: string;
  countryTravel: string;
  cityTravel: string;
  propertyName: string;
  propertyNumber: string;
  discount: number;
  reservationNumber: number;
  clientName: string;
  clientPhone: string[];
  clientEmail: string;
  clientDocumentNumber?: string;
  guests: Guests;
  officialPrice: number;
  taxClean: number;
  totalPrice: number;
  bankAccount: string;
  // New payment structure
  depositAmount: number;
  depositStatus: "paid" | "unpaid";
  depositDueDate?: string;
  depositPaymentMethods: ("cash" | "bank" | "revolut")[];
  balanceAmount: number;
  balanceStatus: "paid" | "unpaid";
  balanceDueDate?: string;
  balancePaymentMethods: ("cash" | "bank" | "revolut")[];
  // Legacy payments structure for backward compatibility
  payments?: Payments;
  statusOrder: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  agent: Agent;
}

// State interface for filters
interface FilterState {
  status: string;
  search: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  travelDateRange: {
    start: string | null;
    end: string | null;
  };
  sortBy: string;
  sortOrder: "asc" | "desc";
  limit: number;
}

// Define type for filter change handler
type FilterChangeHandler = (
  filterName: keyof FilterState,
  value: string | number | DateRange | TravelDateRange
) => void;

// Define date range types
interface DateRange {
  start: string | null;
  end: string | null;
}

interface TravelDateRange {
  start: string | null;
  end: string | null;
}

export default function AgentOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Enhanced state management
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get("status") || "",
    search: searchParams.get("search") || "",
    dateRange: {
      start: searchParams.get("dateFrom") || null,
      end: searchParams.get("dateTo") || null,
    },
    travelDateRange: {
      start: searchParams.get("travelFrom") || null,
      end: searchParams.get("travelTo") || null,
    },
    sortBy: searchParams.get("sortBy") || "createdOrder",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    limit: Number(searchParams.get("limit")) || 10,
  });

  // Function to update URL with current filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.dateRange.start)
      params.set("dateFrom", filters.dateRange.start);
    if (filters.dateRange.end) params.set("dateTo", filters.dateRange.end);
    if (filters.travelDateRange.start)
      params.set("travelFrom", filters.travelDateRange.start);
    if (filters.travelDateRange.end)
      params.set("travelTo", filters.travelDateRange.end);
    params.set("sortBy", filters.sortBy);
    params.set("sortOrder", filters.sortOrder);
    params.set("limit", filters.limit.toString());
    params.set("page", currentPage.toString());

    router.push(`?${params.toString()}`);
  };

  // Function to fetch orders with enhanced filtering
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.dateRange.start) params.dateFrom = filters.dateRange.start;
      if (filters.dateRange.end) params.dateTo = filters.dateRange.end;
      if (filters.travelDateRange.start)
        params.travelFrom = filters.travelDateRange.start;
      if (filters.travelDateRange.end)
        params.travelTo = filters.travelDateRange.end;

      const response = await apiService.orders.getList(params);
      setOrders(response.orders);
      setTotalPages(response.totalPages);
      setTotalRecords(response.total);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to update URL and fetch orders when filters change
  useEffect(() => {
    updateUrlWithFilters();
    fetchOrders();
  }, [currentPage, filters]);

  // Handle filter changes with proper typing
  const handleFilterChange: FilterChangeHandler = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (sortField: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortField,
      sortOrder:
        prev.sortBy === sortField && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newSize,
    }));
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Export function with proper error handling
  const handleExportCSV = async () => {
    try {
      // Since exportCSV is not implemented in apiService yet, we'll show an error
      setError("Export functionality is not implemented yet.");
    } catch (err) {
      console.error("Error exporting orders:", err);
      setError("Failed to export orders. Please try again later.");
    }
  };

  return (
    <DashboardLayout role="agent">
      {/* Header section */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Orders Management
          </h1>
          <p className="text-gray-600">View and manage your client orders</p>
          <div className="mt-2 text-sm text-gray-500">
            Total orders: {totalRecords}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Export to CSV
          </button>
          <Link
            href="/agent/orders/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Order
          </Link>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Order Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="approve">Approved</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creation Date Range
            </label>
            <div className="flex gap-2">
              <DatePicker
                selected={
                  filters.dateRange.start
                    ? new Date(filters.dateRange.start)
                    : null
                }
                onChange={(date: Date | null) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    start: date ? date.toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Start Date"
                dateFormat="dd/MM/yyyy"
              />
              <DatePicker
                selected={
                  filters.dateRange.end ? new Date(filters.dateRange.end) : null
                }
                onChange={(date: Date | null) =>
                  handleFilterChange("dateRange", {
                    ...filters.dateRange,
                    end: date ? date.toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholderText="End Date"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by client name, location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Records per page selector */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="limit"
              className="text-sm font-medium text-gray-700"
            >
              Show
            </label>
            <select
              id="limit"
              value={filters.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Your Orders</h2>
          <button
            onClick={() => fetchOrders()}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded inline-block">
              {error}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or create a new order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("reservationNumber")}
                  >
                    Reservation #
                    {filters.sortBy === "reservationNumber" && (
                      <span className="ml-1">
                        {filters.sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("clientName")}
                  >
                    Client
                    {filters.sortBy === "clientName" && (
                      <span className="ml-1">
                        {filters.sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={
                      order.balanceStatus === "unpaid" &&
                      new Date(order.checkIn) <
                        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? "bg-yellow-50"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.reservationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{order.clientName}</span>
                        <span className="text-gray-500">
                          {order.clientPhone.join(", ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Check-in: {formatDate(order.checkIn)}</div>
                      <div>Check-out: {formatDate(order.checkOut)}</div>
                      <div className="text-xs text-gray-400">
                        {order.nights} nights
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.countryTravel}
                        </span>
                        <span className="text-gray-500">
                          {order.cityTravel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.propertyName}
                        </span>
                        <span className="text-gray-500">
                          {order.propertyNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
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
                        <span className="text-xs text-gray-500">
                          Deposit: {order.depositStatus || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Balance: {order.balanceStatus || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/agent/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/agent/orders/${order.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && orders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * filters.limit + 1} to{" "}
              {Math.min(currentPage * filters.limit, totalRecords)} of{" "}
              {totalRecords} entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
