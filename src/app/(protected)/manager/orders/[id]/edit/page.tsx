"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/common/DashboardLayout";
import apiService from "@/app/services/apiService";
import CountrySelect from "@/app/components/common/CountrySelect";
import { OrderDetails } from "@/app/types/order";

// Temporary interface for API response that might have number reservationNumber
interface ApiOrderDetails extends Omit<OrderDetails, "reservationNumber"> {
  reservationNumber: string;
}

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

interface OrderFormData {
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
    children: { age: number }[];
  };
  officialPrice: number | null;
  taxClean: number | null;
  totalPrice: number | null;
  bankAccount: string;
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<OrderFormData>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Додаємо стан для банківських акаунтів
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; identifier: string }[]
  >([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankAccountsError, setBankAccountsError] = useState<string | null>(
    null
  );

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
    // Only update if all required fields are present
    if (formData.clientCountry && formData.checkIn && formData.propertyNumber) {
      const newReservationNumber = generateReservationNumber();
      // Only update if the generated number is different from current
      if (
        newReservationNumber &&
        newReservationNumber !== formData.reservationNumber
      ) {
        setFormData((prev) => ({
          ...prev,
          reservationNumber: newReservationNumber,
        }));
      }
    }
  }, [formData.clientCountry, formData.checkIn, formData.propertyNumber]);

  // Завантаження банківських акаунтів при монтуванні
  useEffect(() => {
    async function fetchBankAccounts() {
      setBankAccountsLoading(true);
      setBankAccountsError(null);
      try {
        const response = await apiService.bankAccounts.getList();

        if (response.success && Array.isArray(response.data)) {
          const accounts = response.data.map(
            (acc: { id: string; identifier: string }) => ({
              id: acc.id,
              identifier: acc.identifier,
            })
          );
          setBankAccounts(accounts);
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

  // Load order data
  useEffect(() => {
    const fetchOrder = async () => {
      // Only fetch order if we have orderId and bank accounts are loaded
      if (!orderId || bankAccountsLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.orders.getById(orderId);
        const orderData = response.order as ApiOrderDetails;

        // Find the correct bank account ID if bankAccount contains identifier
        let bankAccountId = orderData.bankAccount;
        if (bankAccounts.length > 0 && orderData.bankAccount) {
          const foundAccount = bankAccounts.find(
            (account) => account.identifier === orderData.bankAccount
          );
          if (foundAccount) {
            bankAccountId = foundAccount.id;
          }
        }

        // Initialize form with order data
        setFormData({
          checkIn: orderData.checkIn,
          checkOut: orderData.checkOut,
          nights: orderData.nights,
          clientCountry: orderData.clientCountry,
          countryTravel: orderData.countryTravel,
          cityTravel: orderData.cityTravel,
          propertyName: orderData.propertyName,
          propertyNumber: orderData.propertyNumber,
          discount: orderData.discount,
          reservationNumber: orderData.reservationNumber,
          clientName: orderData.clientName,
          clientPhone: orderData.clientPhone,
          clientEmail: orderData.clientEmail || "",
          clientDocumentNumber: orderData.clientDocumentNumber || "",
          guests: orderData.guests,
          officialPrice: orderData.officialPrice,
          taxClean: orderData.taxClean,
          totalPrice: orderData.totalPrice,
          bankAccount: bankAccountId,
        });

        // Update order state with converted data
        setOrder({
          ...orderData,
          reservationNumber: orderData.reservationNumber,
        });
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, bankAccounts, bankAccountsLoading]);

  // Calculate nights when check-in or check-out dates change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);

      if (checkInDate && checkOutDate && checkOutDate >= checkInDate) {
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
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

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear errors for the current field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

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
      // Special handling for clientEmail to convert empty string to null
      if (name === "clientEmail") {
        setFormData((prev) => ({
          ...prev,
          [name]: value.trim() === "" ? null : value,
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

  // Handle adults change
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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
    // clientDocumentNumber is optional for editing - if empty, it won't be updated
    if (formData.clientPhone.length === 0 || !formData.clientPhone[0].trim()) {
      newErrors.clientPhone = "At least one phone number is required";
    }
    // Email validation only if email is provided
    if (formData.clientEmail && formData.clientEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail)) {
        newErrors.clientEmail = "Please enter a valid email address";
      }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = document.querySelector(
        `[name="${Object.keys(errors)[0]}"]`
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Create update data with proper type handling
      const updateData: Partial<OrderDetails> = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights: formData.nights,
        clientCountry: formData.clientCountry,
        countryTravel: formData.countryTravel,
        cityTravel: formData.cityTravel,
        propertyName: formData.propertyName,
        propertyNumber: formData.propertyNumber,
        discount: formData.discount,
        reservationNumber: formData.reservationNumber,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail:
          formData.clientEmail && formData.clientEmail.trim() !== ""
            ? formData.clientEmail.trim()
            : null,
        clientDocumentNumber:
          formData.clientDocumentNumber &&
          formData.clientDocumentNumber.trim() !== ""
            ? formData.clientDocumentNumber.trim()
            : undefined,
        guests: formData.guests,
        officialPrice: formData.officialPrice || undefined,
        taxClean: formData.taxClean || undefined,
        totalPrice: formData.totalPrice || undefined,
        bankAccount: formData.bankAccount,
      };

      await apiService.orders.update(orderId, updateData);
      setSuccess("Order updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        // Redirect to orders list
        router.push("/manager/orders");
      }, 3000);
    } catch (err) {
      console.error("Error updating order:", err);
      setError("Failed to update order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/manager/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="manager">
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !order) {
    return (
      <DashboardLayout role="manager">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <div className="mt-4">
            <button
              onClick={() => router.push("/manager/orders")}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="manager">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Order</h1>
        <p className="text-gray-600">Update order information</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
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
                <p className="mt-1 text-sm text-red-600">{errors.cityTravel}</p>
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
                Automatically generated from Client Country, Check-in Date, and
                Property Number
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
                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
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
                Client Document Number
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
              <p className="mt-1 text-xs text-gray-500">
                Optional - leave empty if not needed
              </p>
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
                  {formData.clientPhone.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhoneField(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addPhoneField}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Phone Number
              </button>
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
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Remove
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
                    errors.officialPrice ? "border-red-500" : "border-gray-300"
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
                Automatically calculated: Official Price + Tax/Clean - Discount
              </p>
            </div>

            <div>
              <label
                htmlFor="bankAccount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bank Account <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="bankAccount"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    errors.bankAccount ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none ${
                    formData.bankAccount ? "text-black" : "text-gray-500"
                  }`}
                >
                  <option value="">Select a bank account</option>
                  {bankAccountsLoading ? (
                    <option value="">Loading bank accounts...</option>
                  ) : bankAccountsError ? (
                    <option value="">{bankAccountsError}</option>
                  ) : (
                    bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.identifier}
                      </option>
                    ))
                  )}
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center">
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
                Saving...
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
