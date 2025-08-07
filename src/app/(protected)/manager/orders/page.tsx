"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Types and Interfaces
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

interface DateRange {
  start: string | null;
  end: string | null;
}

// Enhanced FilterState for manager
interface FilterState {
  status: string;
  search: string;
  agentId: string;
  dateRange: DateRange;
  travelDateRange: DateRange;
  sortBy: string;
  sortOrder: "asc" | "desc";
  limit: number;
  minPrice: number | null;
  maxPrice: number | null;
}

type FilterChangeHandler = (
  filterName: keyof FilterState,
  value: string | number | DateRange | null
) => void;

interface ExportParams {
  orderIds?: string[];
  status?: "pending" | "approved" | "rejected";
  search?: string;
  agentId?: string;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  travelFrom?: string | undefined;
  travelTo?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default function ManagerOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Enhanced filters state for manager
  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get("status") || "",
    search: searchParams.get("search") || "",
    agentId: searchParams.get("agentId") || "",
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
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : null,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : null,
  });

  // Fetch agents for filter
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await apiService.agents.getList();
        setAgents(response.agents);
      } catch (err) {
        console.error("Error fetching agents:", err);
      }
    };
    fetchAgents();
  }, []);

  // Update URL with filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (typeof value === "object") {
          if (value.start) params.set(`${key}From`, value.start);
          if (value.end) params.set(`${key}To`, value.end);
        } else {
          params.set(key, String(value));
        }
      }
    });
    params.set("page", currentPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Fetch orders
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

      // Add all filters to params
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.agentId) params.agentId = filters.agentId;
      if (filters.dateRange.start) params.dateFrom = filters.dateRange.start;
      if (filters.dateRange.end) params.dateTo = filters.dateRange.end;
      if (filters.travelDateRange.start)
        params.travelFrom = filters.travelDateRange.start;
      if (filters.travelDateRange.end)
        params.travelTo = filters.travelDateRange.end;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const response = await apiService.orders.getManagerList(params);
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

  // Effect to update URL and fetch orders
  useEffect(() => {
    updateUrlWithFilters();
    fetchOrders();
  }, [currentPage, filters]);

  // Handlers
  const handleFilterChange: FilterChangeHandler = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (sortField: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortField,
      sortOrder:
        prev.sortBy === sortField && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newSize,
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExportCSV = async () => {
    try {
      const exportParams: ExportParams = {
        status: filters.status as "pending" | "approved" | "rejected",
        search: filters.search,
        agentId: filters.agentId,
        dateFrom: filters.dateRange.start || undefined,
        dateTo: filters.dateRange.end || undefined,
        travelFrom: filters.travelDateRange.start || undefined,
        travelTo: filters.travelDateRange.end || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const response = await apiService.orders.exportManagerCSV(exportParams);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `orders-export-${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting orders:", err);
      setError("Failed to export orders. Please try again later.");
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <DashboardLayout role="manager">
      {/* Header section */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Orders Management
          </h1>
          <p className="text-gray-600">Manage and monitor all agent orders</p>
          <div className="mt-2 text-sm text-gray-500">
            Total orders: {totalRecords}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export to CSV
          </button>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="approve">Approved</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <label
              htmlFor="agent"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Agent
            </label>
            <select
              id="agent"
              value={filters.agentId}
              onChange={(e) => handleFilterChange("agentId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Price
              </label>
              <input
                type="number"
                id="minPrice"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minPrice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Min €"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Price
              </label>
              <input
                type="number"
                id="maxPrice"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "maxPrice",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Max €"
              />
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholderText="End Date"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Travel Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Travel Date Range
            </label>
            <div className="flex gap-2">
              <DatePicker
                selected={
                  filters.travelDateRange.start
                    ? new Date(filters.travelDateRange.start)
                    : null
                }
                onChange={(date: Date | null) =>
                  handleFilterChange("travelDateRange", {
                    ...filters.travelDateRange,
                    start: date ? date.toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholderText="Start Date"
                dateFormat="dd/MM/yyyy"
              />
              <DatePicker
                selected={
                  filters.travelDateRange.end
                    ? new Date(filters.travelDateRange.end)
                    : null
                }
                onChange={(date: Date | null) =>
                  handleFilterChange("travelDateRange", {
                    ...filters.travelDateRange,
                    end: date ? date.toISOString() : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="px-3 py-2 border border-gray-300 rounded-md"
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
          <h2 className="text-lg font-semibold text-gray-800">All Orders</h2>
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
              Try changing your filters to see more results.
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
                    Status
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
                    className={`
                      ${
                        order.depositStatus === "unpaid" &&
                        new Date(order.checkIn) <
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ? "bg-yellow-50"
                          : ""
                      }
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium mb-1">
                          #{order.reservationNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.agentName}
                        </span>
                      </div>
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
                          className={`px-2 pr-1 inline-flex justify-center items-center text-xs leading-5 font-semibold rounded-full
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
                            : "Pending"}
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
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/manager/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                        <Link
                          href={`/manager/orders/${order.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                      </div>
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
