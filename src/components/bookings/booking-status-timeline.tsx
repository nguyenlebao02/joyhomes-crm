"use client";

import { CheckCircle, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  status: string;
  label: string;
  date?: string;
}

const BOOKING_STEPS: TimelineStep[] = [
  { status: "PENDING", label: "Chờ duyệt" },
  { status: "APPROVED", label: "Đã duyệt" },
  { status: "DEPOSITED", label: "Đã cọc" },
  { status: "CONTRACTED", label: "Đã ký HĐ" },
  { status: "COMPLETED", label: "Hoàn thành" },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  APPROVED: 1,
  DEPOSITED: 2,
  CONTRACTED: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

interface BookingStatusTimelineProps {
  currentStatus: string;
  bookingDate?: string;
  depositDate?: string;
  contractDate?: string;
}

export function BookingStatusTimeline({
  currentStatus,
  bookingDate,
  depositDate,
  contractDate,
}: BookingStatusTimelineProps) {
  const currentIndex = STATUS_ORDER[currentStatus] ?? -1;
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "REFUNDED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="font-medium text-red-700">
          {currentStatus === "CANCELLED" ? "Booking đã bị hủy" : "Booking đã hoàn tiền"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {BOOKING_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.status} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div
                  className={cn(
                    "h-1 flex-1",
                    isCompleted || isCurrent ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2",
                  isCompleted && "bg-green-500 border-green-500",
                  isCurrent && "bg-blue-500 border-blue-500",
                  isPending && "bg-white border-gray-300"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <Circle
                    className={cn(
                      "h-4 w-4",
                      isCurrent ? "text-white" : "text-gray-400"
                    )}
                  />
                )}
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium text-center",
                isCompleted && "text-green-600",
                isCurrent && "text-blue-600",
                isPending && "text-gray-400"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
