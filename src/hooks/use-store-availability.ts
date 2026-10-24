"use client";

import { useState, useEffect, useCallback } from "react";
import { StoreAvailabilityResult } from "@/lib/store-availability";

interface UseStoreAvailabilityReturn {
  availability: StoreAvailabilityResult | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStoreAvailability(): UseStoreAvailabilityReturn {
  const [availability, setAvailability] = useState<StoreAvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability", {
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (res.ok && data) {
        setAvailability(data);
        setError(null);
      } else if (res.status === 503) {
        // 503 returned when closed in fallback mode
        setAvailability({
          isOpen: false,
          status: "CLOSED",
          reason: data.reason || "Store closed",
          scheduleMode: data.scheduleMode || "FOLLOW_SCHEDULE",
          acceptOrders: false,
          openTime: "09:00",
          closeTime: "23:00",
          timeZone: "Asia/Kolkata",
          closureMessage: data.closureMessage || "Our ordering service is currently unavailable.",
          currentServerTimeIso: new Date().toISOString(),
          currentTimeInZone: "00:00",
          nextOpenTime: data.nextOpenTime || null,
          version: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch store availability");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAvailability();
      }
    };

    const handleFocus = () => {
      fetchAvailability();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Periodic background refresh every 60 seconds
    const interval = setInterval(fetchAvailability, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchAvailability]);

  return {
    availability,
    isOpen: availability ? availability.isOpen : true, // default optimistic before load
    isLoading,
    error,
    refresh: fetchAvailability,
  };
}
