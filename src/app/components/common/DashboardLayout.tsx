"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Отримуємо дані користувача з localStorage
    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userJson || !token) {
      router.push("/");
      return;
    }

    try {
      const userData = JSON.parse(userJson);
      setUser(userData);

      // Перевіряємо, чи співпадає роль користувача з очікуваною
      if (userData.role !== role) {
        console.log(
          `Доступ заборонено: очікувана роль ${role}, отримана ${userData.role}`
        );
        // Перенаправляємо на сторінку відповідно до ролі користувача
        switch (userData.role) {
          case "admin":
            router.push("/admin");
            break;
          case "manager":
            router.push("/manager");
            break;
          case "agent":
            router.push("/agent");
            break;
          default:
            router.push("/");
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("user");
      router.push("/");
    }
  }, [role, router]);

  // Показуємо завантажувач, якщо користувач ще не завантажений
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Якщо роль не підходить, не показуємо контент
  if (user.role !== role) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {role === "admin"
                ? "Admin Dashboard"
                : role === "manager"
                ? "Manager Dashboard"
                : "Agent Dashboard"}
            </h1>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  router.push("/");
                }}
                className="bg-red-500 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
