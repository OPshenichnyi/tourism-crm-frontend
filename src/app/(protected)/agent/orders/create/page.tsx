"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import CountrySelect from "@/app/components/common/CountrySelect";

// Payment method type
type PaymentMethod = "cash" | "bank" | "revolut";
// Payment status type
type PaymentStatus = "paid" | "unpaid";

// Child interface
interface Child {
  age: number;
}

// Interface for form data
interface OrderFormData {
  // Agent information
  agentName: string;

  // Travel information
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

  // Client information
  clientName: string;
  clientPhone: string[];
  clientEmail: string | null;
  clientDocumentNumber: string;

  // Guests information
  guests: {
    adults: number;
    children: Child[];
  };

  // Price information
  officialPrice: number | null;
  taxClean: number | null;
  totalPrice: number | null;
  bankAccount: string;

  // Payment information
  payments: {
    deposit: {
      status: PaymentStatus;
      amount: number | null;
      paymentMethods: PaymentMethod[];
    };
    balance: {
      status: PaymentStatus;
      amount: number | null;
      paymentMethods: PaymentMethod[];
    };
  };
}

export default function CreateOrderPage() {
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    agentName: "",
    checkIn: "",
    checkOut: "",
    nights: 0,
    clientCountry: "",
    countryTravel: "",
    cityTravel: "",
    propertyName: "",
    propertyNumber: "",
    discount: 0,
    reservationNumber: "",
    clientName: "",
    clientPhone: [""],
    clientEmail: null,
    clientDocumentNumber: "",
    guests: {
      adults: 1,
      children: [],
    },
    officialPrice: null,
    taxClean: null,
    totalPrice: null,
    bankAccount: "",
    payments: {
      deposit: {
        status: "unpaid",
        amount: null,
        paymentMethods: [],
      },
      balance: {
        status: "unpaid",
        amount: null,
        paymentMethods: [],
      },
    },
  });

  // Додаємо стан для банківських акаунтів
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; identifier: string }[]
  >([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankAccountsError, setBankAccountsError] = useState<string | null>(
    null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const router = useRouter();

  // Function to generate reservation number
  const generateReservationNumber = (): string => {
    const { clientCountry, checkIn, propertyNumber } = formData;

    if (!clientCountry || !checkIn || !propertyNumber) {
      return "";
    }

    // Format check-in date as DDMMYYYY
    const checkInDate = new Date(checkIn);
    const day = checkInDate.getDate().toString().padStart(2, "0");
    const month = (checkInDate.getMonth() + 1).toString().padStart(2, "0");
    const year = checkInDate.getFullYear().toString();
    const formattedDate = `${day}${month}${year}`;

    // Generate reservation number: [Country Code][Date][N][Property Number]
    return `${clientCountry}${formattedDate}N${propertyNumber}`;
  };

  // Update reservation number when dependent fields change
  useEffect(() => {
    const newReservationNumber = generateReservationNumber();
    setFormData((prev) => ({
      ...prev,
      reservationNumber: newReservationNumber,
    }));
  }, [formData.clientCountry, formData.checkIn, formData.propertyNumber]);

  // Get user data on component mount
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);

        // Prefill agent name if available
        if (userData.firstName && userData.lastName) {
          setFormData((prev) => ({
            ...prev,
            agentName: `${userData.firstName} ${userData.lastName}`,
          }));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Calculate nights when check-in or check-out dates change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);

      if (checkInDate && checkOutDate && checkOutDate >= checkInDate) {
        // Calculate the difference in milliseconds
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        // Convert to days
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setFormData((prev) => ({
          ...prev,
          nights: diffDays,
        }));
      }
    }
  }, [formData.checkIn, formData.checkOut]);

  // Calculate total price when official price, tax, or discount changes
  useEffect(() => {
    const officialPrice = formData.officialPrice || 0;
    const taxClean = formData.taxClean || 0;
    const discount = formData.discount || 0;

    setFormData((prev) => ({
      ...prev,
      totalPrice: officialPrice + taxClean - discount,
    }));
  }, [formData.officialPrice, formData.taxClean, formData.discount]);

  // Calculate balance amount when total price or deposit amount changes
  useEffect(() => {
    const totalPrice = formData.totalPrice || 0;
    const depositAmount = formData.payments.deposit.amount || 0;

    setFormData((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        balance: {
          ...prev.payments.balance,
          amount: totalPrice - depositAmount,
        },
      },
    }));
  }, [formData.totalPrice, formData.payments.deposit.amount]);

  // Завантаження банківських акаунтів при монтуванні
  useEffect(() => {
    async function fetchBankAccounts() {
      setBankAccountsLoading(true);
      setBankAccountsError(null);
      try {
        const response = await apiService.bankAccounts.getList();
        if (response.success && Array.isArray(response.data)) {
          setBankAccounts(
            response.data.map((acc: { id: string; identifier: string }) => ({
              id: acc.id,
              identifier: acc.identifier,
            }))
          );
        } else {
          setBankAccountsError(
            "Не вдалося отримати список банківських акаунтів"
          );
        }
      } catch (error) {
        setBankAccountsError(
          error instanceof Error
            ? error.message
            : "Помилка при завантаженні акаунтів"
        );
      } finally {
        setBankAccountsLoading(false);
      }
    }
    fetchBankAccounts();
  }, []);

  // Handle input change for simple fields
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Clear errors for the current field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof OrderFormData] as Record<string, unknown>),
          [child]: value,
        },
      }));
    } else {
      // Convert to number if the field expects a number
      const numberFields = [
        "nights",
        "officialPrice",
        "taxClean",
        "totalPrice",
        "discount",
      ];

      if (numberFields.includes(name) && value) {
        setFormData((prev) => ({
          ...prev,
          [name]: parseFloat(value),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  // Handle country selection
  const handleCountryChange = (countryCode: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.clientCountry;
      return newErrors;
    });

    setFormData((prev) => ({
      ...prev,
      clientCountry: countryCode,
    }));
  };

  // Handle change for guests.adults
  const handleAdultsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setFormData((prev) => ({
        ...prev,
        guests: {
          ...prev.guests,
          adults: value,
        },
      }));
    }
  };

  // Handle phone number changes
  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.clientPhone];
    newPhones[index] = value;

    setFormData((prev) => ({
      ...prev,
      clientPhone: newPhones,
    }));
  };

  // Add new phone field
  const addPhoneField = () => {
    setFormData((prev) => ({
      ...prev,
      clientPhone: [...prev.clientPhone, ""],
    }));
  };

  // Remove phone field
  const removePhoneField = (index: number) => {
    if (formData.clientPhone.length > 1) {
      const newPhones = [...formData.clientPhone];
      newPhones.splice(index, 1);

      setFormData((prev) => ({
        ...prev,
        clientPhone: newPhones,
      }));
    }
  };

  // Handle child age change
  const handleChildAgeChange = (index: number, age: number) => {
    const newChildren = [...formData.guests.children];
    newChildren[index] = { age };

    setFormData((prev) => ({
      ...prev,
      guests: {
        ...prev.guests,
        children: newChildren,
      },
    }));
  };

  // Add child
  const addChild = () => {
    setFormData((prev) => ({
      ...prev,
      guests: {
        ...prev.guests,
        children: [...prev.guests.children, { age: 0 }],
      },
    }));
  };

  // Remove child
  const removeChild = (index: number) => {
    const newChildren = [...formData.guests.children];
    newChildren.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      guests: {
        ...prev.guests,
        children: newChildren,
      },
    }));
  };

  // Handle payment status change
  const handlePaymentStatusChange = (
    paymentType: "deposit" | "balance",
    status: PaymentStatus
  ) => {
    setFormData((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        [paymentType]: {
          ...prev.payments[paymentType],
          status,
        },
      },
    }));
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (
    paymentType: "deposit" | "balance",
    amount: string
  ) => {
    const numericAmount = parseFloat(amount);

    setFormData((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        [paymentType]: {
          ...prev.payments[paymentType],
          amount: isNaN(numericAmount) ? null : numericAmount,
        },
      },
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate agent information
    if (!formData.agentName.trim()) {
      newErrors.agentName = "Agent name is required";
    }

    // Validate travel information
    if (!formData.checkIn) {
      newErrors.checkIn = "Check-in date is required";
    }
    if (!formData.checkOut) {
      newErrors.checkOut = "Check-out date is required";
    }
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      if (checkOutDate < checkInDate) {
        newErrors.checkOut = "Check-out date must be after check-in date";
      }
    }
    if (!formData.clientCountry.trim()) {
      newErrors.clientCountry = "Client country is required";
    }
    if (!formData.countryTravel.trim()) {
      newErrors.countryTravel = "Country of travel is required";
    }
    if (!formData.cityTravel.trim()) {
      newErrors.cityTravel = "City of travel is required";
    }
    if (!formData.propertyName.trim()) {
      newErrors.propertyName = "Property name is required";
    }
    if (!formData.propertyNumber.trim()) {
      newErrors.propertyNumber = "Property number is required";
    }

    // Validate client information
    if (!formData.clientName.trim()) {
      newErrors.clientName = "Client name is required";
    }
    if (formData.clientPhone.length === 0 || !formData.clientPhone[0].trim()) {
      newErrors.clientPhone = "At least one phone number is required";
    }
    // Email validation only if email is provided
    if (formData.clientEmail && formData.clientEmail.trim()) {
      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail)) {
        newErrors.clientEmail = "Please enter a valid email address";
      }
    }
    if (!formData.clientDocumentNumber.trim()) {
      newErrors.clientDocumentNumber = "Client document number is required";
    }

    // Validate price information
    if (formData.officialPrice === null || formData.officialPrice < 0) {
      newErrors.officialPrice =
        "Official price is required and must be a positive number";
    }
    // Validate bank account
    if (!formData.bankAccount) {
      newErrors.bankAccount = "Bank account is required";
    }

    // Set errors and return validation result
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector(
        `[name="${Object.keys(errors)[0]}"]`
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Format the data according to API requirements
      const baseData = {
        ...formData,
        payments: {
          deposit: {
            ...formData.payments.deposit,
            payment_methods: formData.payments.deposit.paymentMethods,
          },
          balance: {
            ...formData.payments.balance,
            payment_methods: formData.payments.balance.paymentMethods,
          },
        },
      };

      // Create requestData - exclude clientEmail if it's empty
      const requestData =
        formData.clientEmail && formData.clientEmail.trim() !== ""
          ? baseData
          : Object.fromEntries(
              Object.entries(baseData).filter(([key]) => key !== "clientEmail")
            );

      // Call the API
      console.log("Sending order data:", requestData);
      await apiService.orders.create(requestData);

      // Handle successful response
      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/agent/orders");
      }, 2000);
    } catch (error) {
      console.error("Error creating order:", error);

      // Handle different error types
      if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error as {
          response: {
            status: number;
            data: { errors?: Record<string, unknown>; message?: string };
          };
        };

        if (errorResponse.response.status === 422) {
          // Validation errors from the server
          const serverErrors = errorResponse.response.data.errors;
          const formattedErrors: Record<string, string> = {};

          // Format server errors to match our local error structure
          if (serverErrors) {
            Object.entries(serverErrors).forEach(
              ([key, messages]: [string, unknown]) => {
                formattedErrors[key] = Array.isArray(messages)
                  ? String(messages[0])
                  : String(messages);
              }
            );
          }

          setErrors(formattedErrors);
        } else if (
          errorResponse.response.status === 401 ||
          errorResponse.response.status === 403
        ) {
          // Authentication or authorization error
          setSubmitError(
            "You don't have permission to create orders. Please log in again."
          );

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          // Other server errors
          setSubmitError(
            `Server error: ${
              errorResponse.response.data.message || "Something went wrong"
            }`
          );
        }
      } else if (error && typeof error === "object" && "request" in error) {
        // The request was made but no response was received
        setSubmitError(
          "No response from server. Please check your internet connection and try again."
        );
      } else {
        // Something happened in setting up the request that triggered an error
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setSubmitError(`Error: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    if (!showPreview) {
      // Validate before showing preview
      if (validateForm()) {
        setShowPreview(true);
      } else {
        // Scroll to the first error
        const firstErrorField = document.querySelector(
          `[name="${Object.keys(errors)[0]}"]`
        );
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    } else {
      setShowPreview(false);
    }
  };

  // Determine if user can edit payment statuses (admin or manager)
  const canEditPaymentStatus =
    user && (user.role === "admin" || user.role === "manager");

  // Format date for display in preview
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout role={user?.role || "agent"}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {showPreview ? "Preview Order" : "Create New Order"}
        </h1>
        <p className="text-gray-600">
          {showPreview
            ? "Review your order details before submitting"
            : "Fill in the details to create a new travel order"}
        </p>
      </div>

      {submitSuccess ? (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Order created successfully!</p>
          <p>You will be redirected to the orders list...</p>
        </div>
      ) : null}

      {submitError ? (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error</p>
          <p>{submitError}</p>
        </div>
      ) : null}

      {showPreview ? (
        // Order Preview
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Agent Information
              </h2>
              <p>
                <span className="font-medium">Agent Name:</span>{" "}
                {formData.agentName}
              </p>

              <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">
                Travel Information
              </h2>
              <p>
                <span className="font-medium">Check-in Date:</span>{" "}
                {formatDate(formData.checkIn)}
              </p>
              <p>
                <span className="font-medium">Check-out Date:</span>{" "}
                {formatDate(formData.checkOut)}
              </p>
              <p>
                <span className="font-medium">Nights:</span> {formData.nights}
              </p>
              <p>
                <span className="font-medium">Client Country:</span>{" "}
                {formData.clientCountry}
              </p>
              <p>
                <span className="font-medium">Country of Travel:</span>{" "}
                {formData.countryTravel}
              </p>
              <p>
                <span className="font-medium">City of Travel:</span>{" "}
                {formData.cityTravel}
              </p>
              <p>
                <span className="font-medium">Property Name:</span>{" "}
                {formData.propertyName}
              </p>
              <p>
                <span className="font-medium">Property Number:</span>{" "}
                {formData.propertyNumber}
              </p>
              <p>
                <span className="font-medium">Discount:</span>{" "}
                {formData.discount}%
              </p>
              <p>
                <span className="font-medium">Reservation Number:</span>{" "}
                {formData.reservationNumber || "Not specified"}
              </p>

              <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">
                Client Information
              </h2>
              <p>
                <span className="font-medium">Name:</span> {formData.clientName}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {formData.clientEmail || "Not specified"}
              </p>
              <p>
                <span className="font-medium">Document Number:</span>{" "}
                {formData.clientDocumentNumber || "Not specified"}
              </p>
              <div>
                <span className="font-medium">Phone Numbers:</span>
                <ul className="list-disc ml-5 mt-1">
                  {formData.clientPhone.map((phone, index) => (
                    <li key={index}>{phone}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Guests Information
              </h2>
              <p>
                <span className="font-medium">Adults:</span>{" "}
                {formData.guests.adults}
              </p>
              {formData.guests.children.length > 0 && (
                <div>
                  <span className="font-medium">Children:</span>
                  <ul className="list-disc ml-5 mt-1">
                    {formData.guests.children.map((child, index) => (
                      <li key={index}>Age: {child.age}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">
                Price Information
              </h2>
              <p>
                <span className="font-medium">Official Price:</span> $
                {formData.officialPrice}
              </p>
              <p>
                <span className="font-medium">Tax/Cleaning:</span> $
                {formData.taxClean}
              </p>
              <p>
                <span className="font-medium">Total Price:</span> $
                {formData.totalPrice}
              </p>
              <p>
                <span className="font-medium">Bank Account:</span>{" "}
                {formData.bankAccount}
              </p>

              <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">
                Payment Information
              </h2>
              <div className="mb-4">
                <h3 className="font-medium">Deposit:</h3>
                <p>
                  Status:{" "}
                  <span
                    className={
                      formData.payments.deposit.status === "paid"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {formData.payments.deposit.status === "paid"
                      ? "Paid"
                      : "Not paid"}
                  </span>
                </p>
                <p>Amount: ${formData.payments.deposit.amount}</p>
              </div>

              <div>
                <h3 className="font-medium">Balance:</h3>
                <p>
                  Status:{" "}
                  <span
                    className={
                      formData.payments.balance.status === "paid"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {formData.payments.balance.status === "paid"
                      ? "Paid"
                      : "Not paid"}
                  </span>
                </p>
                <p>Amount: ${formData.payments.balance.amount}</p>
                {formData.payments.balance.paymentMethods.length > 0 && (
                  <p>
                    Methods:{" "}
                    {formData.payments.balance.paymentMethods.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={togglePreview}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Edit
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
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
                  Submitting...
                </>
              ) : (
                "Confirm & Create Order"
              )}
            </button>
          </div>
        </div>
      ) : (
        // Order Form
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Agent Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Agent Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="agentName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="agentName"
                  name="agentName"
                  value={formData.agentName}
                  disabled={true}
                  className={`w-full px-3 py-2 border ${
                    errors.agentName ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.agentName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agentName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Travel Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Travel Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkIn"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.checkIn ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.checkIn && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkOut"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.checkOut ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.checkOut && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="nights"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nights
                </label>
                <input
                  type="number"
                  id="nights"
                  name="nights"
                  value={formData.nights || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated from dates
                </p>
              </div>

              <div>
                <label
                  htmlFor="clientCountry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Country <span className="text-red-500">*</span>
                </label>
                <CountrySelect
                  value={formData.clientCountry}
                  onChange={handleCountryChange}
                  placeholder="Select a country"
                  error={!!errors.clientCountry}
                />
                {errors.clientCountry && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientCountry}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="countryTravel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Country of Travel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="countryTravel"
                  name="countryTravel"
                  value={formData.countryTravel}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.countryTravel ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.countryTravel && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.countryTravel}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="cityTravel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City of Travel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cityTravel"
                  name="cityTravel"
                  value={formData.cityTravel}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.cityTravel ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.cityTravel && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.cityTravel}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="propertyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="propertyName"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.propertyName ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.propertyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.propertyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="propertyNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Property Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="propertyNumber"
                  name="propertyNumber"
                  value={formData.propertyNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.propertyNumber ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.propertyNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.propertyNumber}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reservationNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reservation Number
                </label>
                <input
                  type="text"
                  id="reservationNumber"
                  name="reservationNumber"
                  value={formData.reservationNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically generated from Client Country, Check-in Date,
                  and Property Number
                </p>
              </div>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Client Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.clientName ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={formData.clientEmail || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.clientEmail ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientEmail}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="clientDocumentNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client Document Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientDocumentNumber"
                  name="clientDocumentNumber"
                  value={formData.clientDocumentNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.clientDocumentNumber
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.clientDocumentNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientDocumentNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone Numbers <span className="text-red-500">*</span>
                </label>
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.clientPhone}
                  </p>
                )}

                {formData.clientPhone.map((phone, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+380123456789"
                    />
                    {index === 0 ? (
                      <button
                        type="button"
                        onClick={addPhoneField}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removePhoneField(index)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Guests Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Guests Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="adults"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Number of Adults <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="adults"
                  name="adults"
                  min="1"
                  value={formData.guests.adults}
                  onChange={handleAdultsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Children
                  </label>
                  <button
                    type="button"
                    onClick={addChild}
                    className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Child
                  </button>
                </div>

                {formData.guests.children.length === 0 ? (
                  <p className="text-sm text-gray-500">No children added</p>
                ) : (
                  <div className="space-y-2">
                    {formData.guests.children.map((child, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Child {index + 1} - Age
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="17"
                              value={child.age}
                              onChange={(e) =>
                                handleChildAgeChange(
                                  index,
                                  parseInt(e.target.value)
                                )
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeChild(index)}
                              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 hover:bg-gray-100"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Price Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="officialPrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Official Price <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="officialPrice"
                    name="officialPrice"
                    min="0"
                    step="0.01"
                    value={formData.officialPrice || ""}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border ${
                      errors.officialPrice
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                </div>
                {errors.officialPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.officialPrice}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="taxClean"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tax/Cleaning Fee
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="taxClean"
                    name="taxClean"
                    min="0"
                    step="0.01"
                    value={formData.taxClean || ""}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="discount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Discount (currency)
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    min="0"
                    step="0.01"
                    value={formData.discount || ""}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="totalPrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Price
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    id="totalPrice"
                    name="totalPrice"
                    value={formData.totalPrice || ""}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm bg-gray-50"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated: Official Price + Tax/Clean -
                  Discount
                </p>
              </div>

              <div>
                <label
                  htmlFor="bankAccount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bank Account <span className="text-red-500">*</span>
                </label>
                {bankAccountsLoading ? (
                  <div className="text-gray-500 text-sm">
                    Завантаження акаунтів...
                  </div>
                ) : bankAccountsError ? (
                  <div className="text-red-500 text-sm">
                    {bankAccountsError}
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <select
                        id="bankAccount"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.bankAccount
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none ${
                          formData.bankAccount ? "text-black" : "text-gray-500"
                        }`}
                      >
                        <option value="">Оберіть банківський акаунт</option>
                        {bankAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.identifier}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    {errors.bankAccount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.bankAccount}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Payment Information
            </h2>

            {/* Deposit Section */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Deposit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {canEditPaymentStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="depositStatus"
                          checked={formData.payments.deposit.status === "paid"}
                          onChange={() =>
                            handlePaymentStatusChange("deposit", "paid")
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">Paid</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="depositStatus"
                          checked={
                            formData.payments.deposit.status === "unpaid"
                          }
                          onChange={() =>
                            handlePaymentStatusChange("deposit", "unpaid")
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Not Paid
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="depositAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Amount
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="depositAmount"
                      min="0"
                      step="0.01"
                      value={formData.payments.deposit.amount || ""}
                      onChange={(e) =>
                        handlePaymentAmountChange("deposit", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Section */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Balance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {canEditPaymentStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="balanceStatus"
                          checked={formData.payments.balance.status === "paid"}
                          onChange={() =>
                            handlePaymentStatusChange("balance", "paid")
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">Paid</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-blue-600"
                          name="balanceStatus"
                          checked={
                            formData.payments.balance.status === "unpaid"
                          }
                          onChange={() =>
                            handlePaymentStatusChange("balance", "unpaid")
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Not Paid
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="balanceAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Amount
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      id="balanceAmount"
                      min="0"
                      step="0.01"
                      value={formData.payments.balance.amount || ""}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md shadow-sm bg-gray-50"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically calculated: Total Price - Deposit Amount
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={togglePreview}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Preview
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
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
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
