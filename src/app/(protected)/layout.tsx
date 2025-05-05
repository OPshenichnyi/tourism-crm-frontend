"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Перевіряємо авторизацію при монтуванні компонента
    const checkAuth = () => {
      // Отримуємо дані користувача з localStorage
      const userJson = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userJson || !token) {
        // Якщо користувач не автентифікований, перенаправляємо на сторінку входу
        console.log(
          "Користувач не автентифікований. Перенаправлення на сторінку входу."
        );
        router.push("/");
        return;
      }

      // Якщо дані користувача є, дозволяємо доступ
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Показуємо індикатор завантаження
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Показуємо контент тільки якщо користувач авторизований
  return isAuthorized ? <>{children}</> : null;
}
