import axios from "axios";
import {
  CreateBankAccountData,
  UpdateBankAccountData,
  BankAccountResponse,
  BankAccountsListResponse,
} from "@/app/types/bankAccount";
import { OrderDetails, OrderResponse } from "@/app/types/order";

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

interface Invitation {
  id: string;
  email: string;
  role: "manager" | "agent";
  invitedBy: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
}

interface InvitationsListResponse {
  invitations: Invitation[];
  page: number;
  totalPages: number;
  limit: number;
  total: number;
}
// Типи для роботи з замовленнями

// This is an update to the existing src/app/services/apiService.ts file.
// This content should be added to the existing file.

// Інтерфейси для створення замовлення
interface Child {
  age: number;
}

interface OrderFormData {
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
  reservationNumber: string;
  clientName: string;
  clientPhone: string[];
  clientEmail: string | null;
  clientDocumentNumber: string;
  guests: {
    adults: number;
    children: Child[];
  };
  officialPrice: number | null;
  taxClean: number | null;
  totalPrice: number | null;
  bankAccount: string;
  depositAmount: number | null;
  balanceAmount: number | null;
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
// User interfaces
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  phone: string;
  createdAt: string;
}

interface UsersListResponse {
  users: User[];

  page: number;
  totalPages: number;
  limit: number;
  total: number;
}

interface UserStatusUpdateResponse {
  message: string;
  user: User;
}

interface UserDetailsResponse {
  user: User;
}

// Інтерфейс для відповіді сервера
interface LoginResponse {
  token: string;
  user?: {
    email: string;
    role: string;
    [key: string]: string | number | boolean; // Більш конкретний тип замість any
  };
  role?: string;
}

interface ExportParams {
  orderIds?: string[];
  status?: "pending" | "approved" | "rejected";
  search?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  travelFrom?: string;
  travelTo?: string;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
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
  // Add this inside apiService object
  users: {
    // Get list of all users with optional filtering
    getList: async (
      params: {
        role?: string;
        search?: string;
        page?: number;
        limit?: number;
      } = {}
    ): Promise<UsersListResponse> => {
      setAuthToken();
      try {
        const response = await api.get("/api/users", { params });
        return response.data;
      } catch (error) {
        console.error("Get users list API error:", error);
        throw error;
      }
    },

    // Toggle user active status
    toggleStatus: async (
      userId: string,
      data: { isActive: boolean }
    ): Promise<UserStatusUpdateResponse> => {
      setAuthToken();
      try {
        const response = await api.patch(
          `/api/users/${userId}/toggle-status`,
          data
        );
        return response.data;
      } catch (error) {
        console.error("Toggle user status API error:", error);
        throw error;
      }
    },

    // Get user details
    getDetails: async (userId: string): Promise<UserDetailsResponse> => {
      setAuthToken();
      try {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error("Get user details API error:", error);
        throw error;
      }
    },
  },
  orders: {
    // Створення нового замовлення (POST /orders)
    create: async (data: Partial<OrderFormData>) => {
      setAuthToken();
      try {
        const response = await api.post("/api/orders", data);
        return response.data;
      } catch (error) {
        console.error("Create order API error:", error);
        throw error;
      }
    },

    // Отримання списку замовлень (GET /orders)
    getList: async (
      params: { page?: number; limit?: number; status?: string } = {}
    ) => {
      setAuthToken();
      try {
        const response = await api.get("/api/orders", { params });
        return response.data;
      } catch (error) {
        console.error("Get orders list API error:", error);
        throw error;
      }
    },

    // Отримання замовлення за ID (GET /orders/{id})
    getById: async (orderId: string): Promise<OrderResponse> => {
      setAuthToken();
      try {
        const response = await api.get(`/api/orders/${orderId}`);
        return response.data;
      } catch (error) {
        console.error(`Get order ${orderId} API error:`, error);
        throw error;
      }
    },

    // Оновлення замовлення (PUT /orders/{id})
    update: async (
      id: string,
      orderData: Partial<OrderDetails>
    ): Promise<OrderResponse> => {
      setAuthToken();
      try {
        const response = await api.put(`/api/orders/${id}`, orderData);
        return response.data;
      } catch (error) {
        console.error(`Update order ${id} API error:`, error);
        throw error;
      }
    },

    // Скасування замовлення (DELETE /orders/{id})
    cancel: async (orderId: string) => {
      setAuthToken();
      try {
        const response = await api.delete(`/api/orders/${orderId}`);
        return response.data;
      } catch (error) {
        console.error(`Cancel order ${orderId} API error:`, error);
        throw error;
      }
    },

    // Get orders list for manager with enhanced filtering
    getManagerList: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      agentId?: string;
      dateFrom?: string;
      dateTo?: string;
      travelFrom?: string;
      travelTo?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }) => {
      setAuthToken();
      try {
        const response = await api.get("/api/orders", { params });
        return response.data;
      } catch (error) {
        console.error("Get manager orders list API error:", error);
        throw error;
      }
    },

    // Update order status
    updateStatus: async (orderId: string, status: "approved" | "rejected") => {
      setAuthToken();
      try {
        const response = await api.put(`/api/orders/${orderId}`, {
          statusOrder: status,
        });
        return response.data;
      } catch (error) {
        console.error("Update order status API error:", error);
        throw error;
      }
    },

    // Export orders to CSV for manager
    exportManagerCSV: async (params: ExportParams) => {
      setAuthToken();
      try {
        const response = await api.get("/api/orders/export", {
          params,
          responseType: "blob",
        });
        return response.data;
      } catch (error) {
        console.error("Export orders API error:", error);
        throw error;
      }
    },

    // Generate PDF voucher for order
    generateVoucher: async (orderId: string) => {
      setAuthToken();
      try {
        const response = await api.get(`/api/orders/${orderId}/voucher`, {
          responseType: "blob",
          headers: {
            Accept: "application/pdf",
          },
        });
        return response.data;
      } catch (error) {
        console.error("Generate voucher API error:", error);
        throw error;
      }
    },
  },
  bankAccounts: {
    // Get list of all bank accounts
    getList: async (): Promise<BankAccountsListResponse> => {
      setAuthToken();
      try {
        const response = await api.get("/api/bank-accounts");
        return response.data;
      } catch (error) {
        console.error("Get bank accounts list API error:", error);
        throw error;
      }
    },

    // Get bank account by ID
    getById: async (id: string): Promise<BankAccountResponse> => {
      setAuthToken();
      try {
        const response = await api.get(`/api/bank-accounts/${id}`);
        return response.data;
      } catch (error) {
        console.error("Get bank account by ID API error:", error);
        throw error;
      }
    },

    // Create a new bank account
    create: async (
      data: CreateBankAccountData
    ): Promise<BankAccountResponse> => {
      setAuthToken();
      try {
        const response = await api.post("/api/bank-accounts", data);
        return response.data;
      } catch (error) {
        console.error("Create bank account API error:", error);
        throw error;
      }
    },

    // Update bank account
    update: async (
      id: string,
      data: UpdateBankAccountData
    ): Promise<BankAccountResponse> => {
      setAuthToken();
      try {
        const response = await api.put(`/api/bank-accounts/${id}`, data);
        return response.data;
      } catch (error) {
        console.error("Update bank account API error:", error);
        throw error;
      }
    },

    // Delete bank account
    delete: async (id: string) => {
      setAuthToken();
      try {
        const response = await api.delete(`/api/bank-accounts/${id}`);
        return response.data;
      } catch (error) {
        console.error("Delete bank account API error:", error);
        throw error;
      }
    },
  },
};

export default apiService;
