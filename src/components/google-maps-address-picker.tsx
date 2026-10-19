"use client";

import React, { useRef, useState } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

export interface AddressFormData {
  fullName: string;
  mobileNumber: string;
  houseOrShop: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  instructions: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapsAddressPickerProps {
  initialData?: Partial<AddressFormData>;
  onChange: (data: AddressFormData) => void;
}

export function GoogleMapsAddressPicker({
  initialData,
  onChange,
}: GoogleMapsAddressPickerProps) {
  const [address, setAddress] = useState<AddressFormData>({
    fullName: initialData?.fullName || "",
    mobileNumber: initialData?.mobileNumber || "",
    houseOrShop: initialData?.houseOrShop || "",
    street: initialData?.street || "",
    locality: initialData?.locality || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pinCode: initialData?.pinCode || "",
    country: initialData?.country || "India",
    instructions: initialData?.instructions || "",
    latitude: initialData?.latitude || 28.6139,
    longitude: initialData?.longitude || 77.209,
  });

  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const updateField = (
    key: keyof AddressFormData,
    val: AddressFormData[keyof AddressFormData]
  ) => {
    const updated = { ...address, [key]: val };
    setAddress(updated);
    onChange(updated);
  };

  // Browser Geolocation Quick-Locate
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const updated = { ...address, latitude: lat, longitude: lng };
        setAddress(updated);
        onChange(updated);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation permission denied or timed out:", err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Map Header / Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FCA311]" />
            Retail Outlet & Delivery Location
          </h3>
          <p className="text-xs text-gray-500">
            Provide full dispatch details and pin location for logistics freight calculation
          </p>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 transition"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Detecting..." : "Detect Current Location"}
        </button>
      </div>

      {/* Map Container & Interactive Fallback */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 h-56 flex flex-col items-center justify-center p-4 text-center">
        {apiKey ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <div className="space-y-2 max-w-sm">
            <MapPin className="w-8 h-8 text-[#FCA311] mx-auto animate-bounce" />
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Interactive Map Positioning (GPS Active)
            </p>
            <p className="text-[11px] text-gray-500">
              Pinned Coordinates: {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Google Maps fallback mode active. Complete manual address fields below.</span>
            </div>
          </div>
        )}
      </div>

      {/* Address Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Retailer / Contact Person Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Sharma"
            value={address.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Mobile Number for Dispatch Coordination *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +91 98234 56789"
            value={address.mobileNumber}
            onChange={(e) => updateField("mobileNumber", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Shop / House / Warehouse No. *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shop No. 14, Ground Floor"
            value={address.houseOrShop}
            onChange={(e) => updateField("houseOrShop", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Street / Market Complex *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Main Market Road, Near Clock Tower"
            value={address.street}
            onChange={(e) => updateField("street", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Locality / Sector
          </label>
          <input
            type="text"
            placeholder="e.g. Laxmi Nagar"
            value={address.locality}
            onChange={(e) => updateField("locality", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            City *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. New Delhi"
            value={address.city}
            onChange={(e) => updateField("city", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            State *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Delhi"
            value={address.state}
            onChange={(e) => updateField("state", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            PIN Code *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 110092"
            value={address.pinCode}
            onChange={(e) => updateField("pinCode", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
            Special Delivery / Unloading Instructions (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Delivery between 11 AM - 7 PM. Loading bay accessible from rear street."
            value={address.instructions}
            onChange={(e) => updateField("instructions", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-[#FCA311]"
          />
        </div>
      </div>
    </div>
  );
}
