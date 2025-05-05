"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Перевіряємо, чи користувач вже авторизований
    const checkIfLoggedIn = () => {
      const userJson = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (userJson && token) {
        try {
          const user = JSON.parse(userJson);

          // Перенаправляємо на відповідну сторінку
          switch (user.role) {
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
              // Не перенаправляємо нікуди
              setIsChecking(false);
          }
        } catch (error) {
          // Якщо помилка парсингу, очищаємо дані
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setIsChecking(false);
        }
      } else {
        setIsChecking(false);
      }
    };

    checkIfLoggedIn();
  }, [router]);

  // Показуємо завантажувач під час перевірки
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
