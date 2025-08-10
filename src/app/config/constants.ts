// Configuration constants
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://travel-agentonline.com";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://travel-agentonline.com:3000/api";

// Registration URL template
export const getRegistrationUrl = (token: string) =>
  `${BASE_URL}/register/${token}`;
