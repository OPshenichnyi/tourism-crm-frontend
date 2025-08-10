"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService"; // Імпортуємо наш API сервіс
import { getRegistrationUrl } from "@/app/config/constants";

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: string; // Змінив з expiresAt на invitedAt згідно з API
  used: boolean;
  createdInovation: string;
  token?: string; // Add token field
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Стан для нового запрошення
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("manager");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Отримання списку запрошень
  const fetchInvitations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Використовуємо функцію getList з нашого apiService
      const response = await apiService.invitations.getList();

      // Перетворюємо отримані дані в масив Invitation[]
      const fetchedInvitations = response.invitations.map(
        (invitation: any) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.invitedAt,
          used: invitation.used,
          createdInovation: invitation.createdAt,
          token: invitation.token, // Add token to the fetched data
        })
      );
      setInvitations(fetchedInvitations);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      setError(err.message || "Помилка при отриманні списку запрошень");
    } finally {
      setIsLoading(false);
    }
  };

  // Завантаження даних при монтуванні компонента
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Створення нового запрошення
  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      // Використовуємо функцію create з нашого apiService
      const response = await apiService.invitations.create({
        email: newEmail,
        role: newRole as "manager" | "agent",
      });

      // Оновлюємо список запрошень
      fetchInvitations();

      setCreateSuccess(`Запрошення успішно створено для ${newEmail}`);

      // Очищаємо форму
      setNewEmail("");
    } catch (err) {
      console.error("Error creating invitation:", err);
      setCreateError(err.message || "Помилка при створенні запрошення");
    } finally {
      setIsCreating(false);
    }
  };

  // Скасування запрошення
  const cancelInvitation = async (id: string) => {
    try {
      // Використовуємо функцію cancel з нашого apiService
      await apiService.invitations.cancel(id);

      // Оновлюємо список запрошень після успішного скасування
      setInvitations((prev) =>
        prev.filter((invitation) => invitation.id !== id)
      );
      setCreateSuccess("Запрошення успішно скасовано");

      // Очищаємо повідомлення про успіх через 3 секунди
      setTimeout(() => setCreateSuccess(null), 3000);
    } catch (err) {
      console.error("Error cancelling invitation:", err);
      setCreateError(err.message || "Помилка при скасуванні запрошення");

      // Очищаємо повідомлення про помилку через 3 секунди
      setTimeout(() => setCreateError(null), 3000);
    }
  };

  // Copy registration link to clipboard
  const copyRegistrationLink = async (token: string) => {
    try {
      const registrationUrl = getRegistrationUrl(token);
      await navigator.clipboard.writeText(registrationUrl);
      setCreateSuccess("Посилання для реєстрації скопійовано в буфер обміну");
      setTimeout(() => setCreateSuccess(null), 3000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      setCreateError("Помилка при копіюванні посилання");
      setTimeout(() => setCreateError(null), 3000);
    }
  };

  // Форматування дати
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("uk-UA", options);
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Керування запрошеннями
        </h1>
        <p className="text-gray-600">
          Створюйте запрошення для нових менеджерів системи
        </p>
      </div>

      {/* Форма створення запрошення */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Створити нове запрошення
        </h2>

        <form onSubmit={createInvitation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email користувача
              </label>
              <input
                type="email"
                id="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Роль
              </label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manager">Менеджер</option>
                <option value="agent">Агент</option>
              </select>
            </div>
          </div>

          {createError && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {createError}
            </div>
          )}

          {createSuccess && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              {createSuccess}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Створення...
                </>
              ) : (
                "Створити запрошення"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Список запрошень */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Активні запрошення
          </h2>
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
        ) : invitations.length === 0 ? (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Немає активних запрошень
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Створіть нове запрошення, щоб додати користувача в систему.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Роль
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Статус
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Дата створення
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Посилання для реєстрації
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invitation.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invitation.role === "manager" ? "Менеджер" : "Агент"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invitation.used
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {invitation.used ? "Використано" : "Активне"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invitation.createdInovation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invitation.token && !invitation.used ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                            {getRegistrationUrl(invitation.token)}
                          </span>
                          <button
                            onClick={() =>
                              copyRegistrationLink(invitation.token!)
                            }
                            className="text-blue-600 hover:text-blue-900 text-xs"
                            title="Копіювати посилання"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!invitation.used && (
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Скасувати
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
