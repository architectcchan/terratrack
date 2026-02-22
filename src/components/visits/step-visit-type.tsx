"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { VISIT_TYPES, type VisitType } from "./visit-log-types";
import { cn } from "@/lib/utils";

interface StepVisitTypeProps {
  selected: VisitType | null;
  onSelect: (type: VisitType) => void;
  onGpsCapture: (lat: string, lng: string) => void;
}

export function StepVisitType({
  selected,
  onSelect,
  onGpsCapture,
}: StepVisitTypeProps) {
  const [gpsStatus, setGpsStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onGpsCapture(
          pos.coords.latitude.toFixed(7),
          pos.coords.longitude.toFixed(7)
        );
        setGpsStatus("success");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onGpsCapture]);

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm text-gray-600 mb-4">
        What type of visit is this?
      </p>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {VISIT_TYPES.map((vt) => (
          <button
            key={vt.value}
            type="button"
            onClick={() => onSelect(vt.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 min-h-[88px] transition-all active:scale-[0.97]",
              selected === vt.value
                ? "border-[#1B4332] bg-[#1B4332]/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span className="text-2xl">{vt.emoji}</span>
            <span
              className={cn(
                "text-sm font-medium text-center leading-tight",
                selected === vt.value ? "text-[#1B4332]" : "text-gray-700"
              )}
            >
              {vt.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs">
        {gpsStatus === "success" && (
          <>
            <MapPin className="h-3 w-3 text-emerald-600" />
            <span className="text-emerald-600">Located</span>
          </>
        )}
        {gpsStatus === "pending" && (
          <>
            <MapPin className="h-3 w-3 text-gray-400 animate-pulse" />
            <span className="text-gray-400">Getting location...</span>
          </>
        )}
        {gpsStatus === "error" && (
          <>
            <MapPin className="h-3 w-3 text-gray-300" />
            <span className="text-gray-300">Location unavailable</span>
          </>
        )}
      </div>
    </div>
  );
}
