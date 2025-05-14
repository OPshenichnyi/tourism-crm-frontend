"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import Link from "next/link";
import apiService from "@/app/services/apiService";

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalAgents: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user count from API
  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      try {
        // Using the API service to get users list with minimal data (just to get the total count)
        const response = await apiService.users.getList({ limit: 1 });

        // Extract total count from meta data
        const totalUsers = response.total || 0;
        setStats({
          totalUsers: totalUsers,
          totalManagers: 0, // Will be updated by backend in the future
          totalAgents: 0, // Will be updated by backend in the future
        });
      } catch (err) {
        console.error("Error fetching user statistics:", err);
        setError(
          err.message || "Виникла помилка при отриманні статистики користувачів"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  // Format date for better display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("uk-UA", options);
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Огляд системи</h2>

          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Керування користувачами
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Всього користувачів
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholders for future backend statistics */}
            {/* These will be populated when the backend is updated */}
            <div className="bg-white rounded-lg shadow p-4 opacity-50">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Менеджери
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalManagers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 opacity-50">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Агенти</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalAgents}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Остання активність
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Користувач
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дія
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Деталі
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate("2023-05-28")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  John Manager
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Created order
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Order #12345
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate("2023-05-27")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Anna Agent
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Updated client
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Client #5432
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate("2023-05-26")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Admin User
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Added manager
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Michael Manager
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
