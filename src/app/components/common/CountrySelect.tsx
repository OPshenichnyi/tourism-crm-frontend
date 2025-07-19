"use client";

import { useState, useRef, useEffect } from "react";
import { countries, Country } from "@/app/data/countries";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select a country",
  className = "",
  error = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(
    countries
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get selected country name
  const selectedCountry = countries.find((country) => country.code === value);

  const handleCountrySelect = (country: Country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`w-full px-3 py-2 border rounded-md shadow-sm cursor-pointer ${
          error ? "border-red-500" : "border-gray-300"
        } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        onClick={handleInputClick}
      >
        <div className="flex justify-between items-center">
          <span className={selectedCountry ? "text-gray-900" : "text-gray-500"}>
            {selectedCountry
              ? `${selectedCountry.name} (${selectedCountry.code})`
              : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-gray-900">{country.name}</span>
                  <span className="text-gray-500 text-sm">{country.code}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
