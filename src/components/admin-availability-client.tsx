"use client";

import React, { useState } from "react";
import {
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Power,
  Calendar,
  Globe,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  StoreAvailabilityConfig,
  StoreAvailabilityResult,
  ScheduleMode,
  formatTime12h,
} from "@/lib/store-availability";

interface AdminAvailabilityClientProps {
  initialConfig: StoreAvailabilityConfig;
  initialAvailability: StoreAvailabilityResult;
}

export function AdminAvailabilityClient({
  initialConfig,
  initialAvailability,
}: AdminAvailabilityClientProps) {
  const [config, setConfig] = useState<StoreAvailabilityConfig>(initialConfig);
  const [liveAvailability, setLiveAvailability] = useState<StoreAvailabilityResult>(initialAvailability);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/availability");
      const data = await res.json();
      if (res.ok && data.success) {
        setConfig(data.config);
        setLiveAvailability(data.availability);
      } else {
        setErrorMessage(data.error || "Failed to refresh availability status");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reach server");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validate times
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(config.openTime)) {
      setErrorMessage("Opening time must be a valid 24-hour time in HH:mm format (e.g. 09:00).");
      setSaving(false);
      return;
    }
    if (!timeRegex.test(config.closeTime)) {
      setErrorMessage("Closing time must be a valid 24-hour time in HH:mm format (e.g. 23:00).");
      setSaving(false);
      return;
    }
    if (config.closureMessage.trim().length < 5) {
      setErrorMessage("Closure message must be at least 5 characters long.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptOrders: config.acceptOrders,
          scheduleMode: config.scheduleMode,
          openTime: config.openTime,
          closeTime: config.closeTime,
          timeZone: config.timeZone || "Asia/Kolkata",
          closureMessage: config.closureMessage.trim(),
          expectedVersion: config.version,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfig(data.config);
        setLiveAvailability(data.availability);
        setSuccessMessage("Store availability & order scheduling settings updated successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else if (res.status === 409) {
        setErrorMessage("Conflict: Settings were updated by another administrator. Please refresh before saving.");
      } else {
        setErrorMessage(data.error || "Failed to save availability settings");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              liveAvailability.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Store Status:
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                  liveAvailability.isOpen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {liveAvailability.isOpen ? "OPEN FOR ORDERS" : "CLOSED FOR ORDERS"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{liveAvailability.reason}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh live status from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#B3853E] hover:bg-[#9E7332] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Master Order Acceptance Toggle */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Power className="w-4 h-4 text-[#B3853E]" />
                  <span>Master Ordering Control</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle whether customer order creation is permitted on the platform
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.acceptOrders}
                  onChange={(e) => setConfig({ ...config, acceptOrders: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {config.acceptOrders ? "ON (Accepting)" : "OFF (Paused)"}
                </span>
              </label>
            </div>

            <div
              className={`p-3 rounded-lg text-xs leading-relaxed border ${
                config.acceptOrders
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                  : "bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900"
              }`}
            >
              {config.acceptOrders
                ? "The store is configured to accept new wholesale orders subject to the schedule mode and opening hours below."
                : "Ordering is completely shut down. Customers cannot submit new orders regardless of schedule."}
            </div>
          </div>

          {/* Section C: Manual Override Mode Selection */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B3853E]" />
                <span>Operating Schedule Mode</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select whether order placement follows daily operating hours or has an active manual override
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Follow Schedule */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, scheduleMode: "FOLLOW_SCHEDULE" })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  config.scheduleMode === "FOLLOW_SCHEDULE"
                    ? "border-[#B3853E] bg-[#B3853E]/10 dark:bg-[#B3853E]/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Follow Schedule</span>
                  <input
                    type="radio"
                    name="scheduleMode"
                    checked={config.scheduleMode === "FOLLOW_SCHEDULE"}
                    onChange={() => setConfig({ ...config, scheduleMode: "FOLLOW_SCHEDULE" })}
                    className="accent-[#B3853E]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically accept orders only between configured opening and closing times.
                </p>
              </button>

              {/* Option 2: Force Open */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, scheduleMode: "FORCE_OPEN" })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  config.scheduleMode === "FORCE_OPEN"
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5">
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">Force Open</span>
                  <input
                    type="radio"
                    name="scheduleMode"
                    checked={config.scheduleMode === "FORCE_OPEN"}
                    onChange={() => setConfig({ ...config, scheduleMode: "FORCE_OPEN" })}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Allow orders 24/7 regardless of the regular schedule (holiday sales, extended trade).
                </p>
              </button>

              {/* Option 3: Force Closed */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, scheduleMode: "FORCE_CLOSED" })}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  config.scheduleMode === "FORCE_CLOSED"
                    ? "border-rose-500 bg-rose-500/10 dark:bg-rose-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5">
                  <span className="font-bold text-xs text-rose-700 dark:text-rose-400">Force Closed</span>
                  <input
                    type="radio"
                    name="scheduleMode"
                    checked={config.scheduleMode === "FORCE_CLOSED"}
                    onChange={() => setConfig({ ...config, scheduleMode: "FORCE_CLOSED" })}
                    className="accent-rose-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Reject all new orders immediately regardless of operating hours (warehouse inventory count, maintenance).
                </p>
              </button>
            </div>
          </div>

          {/* Section B: Service Hours Configuration */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B3853E]" />
                <span>Service Operating Hours</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure standard opening and closing time in India Standard Time (IST)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Daily Opening Time
                </label>
                <input
                  type="time"
                  required
                  value={config.openTime}
                  onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#B3853E]"
                />
                <span className="text-[11px] text-slate-500">
                  {formatTime12h(config.openTime, config.timeZone)} (Orders accepted starting exactly at this time)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Daily Closing Time
                </label>
                <input
                  type="time"
                  required
                  value={config.closeTime}
                  onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#B3853E]"
                />
                <span className="text-[11px] text-slate-500">
                  {formatTime12h(config.closeTime, config.timeZone)} (Orders rejected starting at this time)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Authoritative Time Zone: <strong>Asia/Kolkata (IST • UTC+05:30)</strong>. Server validates time authoritatively; client clocks are not trusted.</span>
            </div>
          </div>

          {/* Section D: Customer Closure Message */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#B3853E]" />
                  <span>Customer Closure Notice</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Message presented to retailers on the website and checkout when ordering is closed
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {config.closureMessage.length}/300 chars
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={300}
              required
              value={config.closureMessage}
              onChange={(e) => setConfig({ ...config, closureMessage: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#B3853E]"
              placeholder="Enter customer-facing closure message..."
            />

            <div className="text-[11px] text-slate-500">
              Recommended default: &quot;Our ordering service is currently unavailable. Please check back during our service hours.&quot;
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Preview & Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Status Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200 dark:border-slate-800">
              Live Evaluation Metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Effective State:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-xs ${
                    liveAvailability.isOpen
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono"
                  }`}
                >
                  {liveAvailability.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Active Rule:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                  {liveAvailability.scheduleMode}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Time (IST):</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {liveAvailability.currentTimeInZone} IST
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Operating Window:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                  {formatTime12h(liveAvailability.openTime)} - {formatTime12h(liveAvailability.closeTime)}
                </span>
              </div>

              {liveAvailability.nextOpenTime && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Next Service Window:</span>
                  <span className="font-bold text-[#B3853E] text-[11px]">
                    {liveAvailability.nextOpenTime}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Settings Version:</span>
                <span className="text-slate-400 font-mono text-[11px]">v{config.version}</span>
              </div>
            </div>
          </div>

          {/* Customer UI Live Simulation Box */}
          <div className="bg-[#0F1A17] text-white p-5 rounded-xl border border-[#212E28] space-y-3.5 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-[#212E28]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8AB64]">
                Customer Notice Preview
              </span>
              <span className="text-[10px] text-slate-400">Storefront simulation</span>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Service Currently Unavailable</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-100/90">
                {config.closureMessage}
              </p>
              <p className="text-[11px] font-semibold text-amber-300">
                Scheduled service reopening: {liveAvailability.nextOpenTime || `Today at ${formatTime12h(config.openTime)}`}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed">
              Customers can still explore all handset models, compare specs, check wholesale tiers, and assemble baskets while closed.
            </div>
          </div>

          {/* Operational Policy Note */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#B3853E]" />
              <span>Fail-Closed Security Invariant</span>
            </div>
            <p className="leading-relaxed">
              Every order submission is authoritatively checked against the PostgreSQL database on the server. If availability settings cannot be evaluated, new orders are rejected with HTTP 503 rather than accidentally accepting unfulfillable stock.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
