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
interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface UpdateAgentData {
  firstName: string;
  lastName: string;
  phone: string;
}
interface LoginData {
  email: string;
  password: string;
}

// Інтерфейс для відповіді сервера
interface LoginResponse {
  token: string;
  user?: {
    email: string;
    role: string;
    [key: string]: any; // Для додаткових полів
  };
  role?: string;
}
// Функції для роботи з API
const apiService = {
  auth: {
    login: async (data: LoginData): Promise<LoginResponse> => {
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
    register: async (
      token: string,
      data: {
        password: string;
        firstName: string;
        lastName: string;
        phone: string;
      }
    ) => {
      try {
        const response = await api.post(`/api/auth/register/${token}`, data);

        // Якщо бекенд повертає токен авторизації, зберігаємо його
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);

          // Якщо повертаються дані користувача, також зберігаємо їх
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
        }

        return response.data;
      } catch (error) {
        console.error("Register API error:", error);
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
  profile: {
    // Отримання профілю користувача
    getProfile: async () => {
      setAuthToken();
      try {
        const response = await api.get("/api/profile");
        return response.data;
      } catch (error) {
        console.error("Get profile API error:", error);
        throw error;
      }
    },

    // Оновлення профілю користувача
    updateProfile: async (data: UpdateProfileData) => {
      setAuthToken();
      try {
        const response = await api.put("/api/profile", data);

        // Оновлюємо інформацію про користувача в локальному сховищі
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            const updatedUser = { ...user, ...data };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          } catch (parseError) {
            console.error("Error updating local user data:", parseError);
          }
        }

        return response.data;
      } catch (error) {
        console.error("Update profile API error:", error);
        throw error;
      }
    },

    // Зміна пароля
    changePassword: async (data: ChangePasswordData) => {
      setAuthToken();
      try {
        const response = await api.put("/api/profile/change-password", data);
        return response.data;
      } catch (error) {
        console.error("Change password API error:", error);
        throw error;
      }
    },
  },
  agents: {
    // Отримання списку агентів
    getList: async (
      params: { page?: number; limit?: number; search?: string } = {}
    ) => {
      setAuthToken();
      try {
        const response = await api.get("/api/agents", { params });
        return response.data;
      } catch (error) {
        console.error("Get agents list API error:", error);
        throw error;
      }
    },

    // Отримання конкретного агента за ID
    getById: async (agentId: string) => {
      setAuthToken();
      try {
        const response = await api.get(`/api/agents/${agentId}`);
        return response.data;
      } catch (error) {
        console.error("Get agent by ID API error:", error);
        throw error;
      }
    },

    // Оновлення даних агента
    update: async (agentId: string, data: UpdateAgentData) => {
      setAuthToken();
      try {
        const response = await api.put(`/api/agents/${agentId}`, data);
        return response.data;
      } catch (error) {
        console.error("Update agent API error:", error);
        throw error;
      }
    },

    // Зміна статусу активності агента
    toggleStatus: async (agentId: string, isActive: boolean) => {
      setAuthToken();
      try {
        const response = await api.patch(
          `/api/agents/${agentId}/toggle-status`,
          {
            isActive,
          }
        );
        return response.data;
      } catch (error) {
        console.error("Toggle agent status API error:", error);
        throw error;
      }
    },
  },
};

export default apiService;
