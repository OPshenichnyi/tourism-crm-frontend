import axios from "axios";

// Чітко вкажіть URL, який ви бачили в Postman
const API_URL = "http://localhost:3000";

// Створюємо екземпляр axios з базовою URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Функція для додавання токену авторизації до запитів
const setAuthToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Додаємо логування для всіх запитів
api.interceptors.request.use((request) => {
  console.log("Starting Request", {
    url: request.url,
    method: request.method,
    data: request.data,
    headers: request.headers,
  });
  return request;
});

// Додаємо логування для всіх відповідей
api.interceptors.response.use(
  (response) => {
    console.log("Response:", response);
    return response;
  },
  (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// Типи для роботи з запрошеннями
interface CreateInvitationData {
  email: string;
  role: "manager" | "agent";
}

interface InvitationResponse {
  message: string;
  invitationId: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: string;
  used: boolean;
}

interface InvitationsListResponse {
  invitations: InvitationResponse[];
  meta: {
    page: number;
    totalPages: number;
    limit: number;
  };
}

// Функції для роботи з API
const apiService = {
  auth: {
    login: async (data) => {
      try {
        // Використовуємо точний URL з Postman
        const response = await api.post("/api/auth/login", data);

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);

          // Перевіряємо, чи API повертає дані користувача
          if (response.data.user) {
            // Якщо є user у відповіді, зберігаємо його
            localStorage.setItem("user", JSON.stringify(response.data.user));
          } else {
            // Якщо API не повертає user, створюємо базову інформацію
            const basicUserInfo = {
              email: data.email,
              role:
                response.data.role || // якщо є роль в відповіді
                (data.email.includes("admin")
                  ? "admin"
                  : data.email.includes("manager")
                  ? "manager"
                  : "agent"),
            };
            localStorage.setItem("user", JSON.stringify(basicUserInfo));
          }
        }

        return response.data;
      } catch (error) {
        console.error("Login API error:", error);
        throw error;
      }
    },
  },

  // Методи для роботи з запрошеннями
  invitations: {
    // Створення запрошення для нового користувача (POST /invitations)
    create: async (data: CreateInvitationData) => {
      setAuthToken();
      try {
        const response = await api.post("/api/invitations", data);
        return response.data;
      } catch (error) {
        console.error("Create invitation API error:", error);
        throw error;
      }
    },

    // Отримання списку запрошень (GET /invitations)
    getList: async (
      params: { page?: number; limit?: number; invitedBy?: string } = {}
    ) => {
      setAuthToken();
      try {
        const response = await api.get("/api/invitations", { params });
        console.log("response list", response.data);
        return response.data as InvitationsListResponse;
      } catch (error) {
        console.error("Get invitations list API error:", error);
        throw error;
      }
    },

    // Скасування запрошення (DELETE /invitations/{id})
    cancel: async (invitationId: string) => {
      setAuthToken();
      try {
        const response = await api.delete(`/api/invitations/${invitationId}`);

        return response.data;
      } catch (error) {
        console.error("Cancel invitation API error:", error);
        throw error;
      }
    },
  },
};

export default apiService;
