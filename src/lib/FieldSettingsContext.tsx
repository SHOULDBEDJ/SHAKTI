import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type BookingField =
  | "customerSearch"
  | "customerName"
  | "phone"
  | "place"
  | "deliveryDateTime"
  | "returnDateTime"
  | "functionType"
  | "voiceNotes"
  | "bookingStatus"
  | "paymentMode"
  | "billMedia"
  | "totalAmount"
  | "amountGiven";

export const BOOKING_FIELDS: { key: BookingField; label: string }[] = [
  { key: "customerSearch", label: "Customer Search" },
  { key: "customerName", label: "Customer Name (with mic)" },
  { key: "phone", label: "Phone Number" },
  { key: "place", label: "Place" },
  { key: "deliveryDateTime", label: "Delivery Date & Time" },
  { key: "returnDateTime", label: "Return Date & Time" },
  { key: "functionType", label: "Function Type" },
  { key: "voiceNotes", label: "Voice Record Notes" },
  { key: "bookingStatus", label: "Booking Status" },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "billMedia", label: "Bill Photo / Video Upload" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "amountGiven", label: "Amount Given" },
];

interface FieldSettings {
  fields: Record<BookingField, boolean>;
  setField: (k: BookingField, v: boolean) => void;
  showCalendarMarks: boolean;
  setShowCalendarMarks: (v: boolean) => void;
  resetFields: () => void;
}

const KEY_FIELDS = "booking-form-fields";
const KEY_MARKS = "calendar-show-marks";

const DEFAULT_FIELDS = BOOKING_FIELDS.reduce((acc, f) => {
  acc[f.key] = true;
  return acc;
}, {} as Record<BookingField, boolean>);

const Ctx = createContext<FieldSettings | null>(null);

export function FieldSettingsProvider({ children }: { children: ReactNode }) {
  const [fields, setFields] = useState<Record<BookingField, boolean>>(() => {
    try {
      const raw = localStorage.getItem(KEY_FIELDS);
      if (raw) return { ...DEFAULT_FIELDS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_FIELDS;
  });
  const [showCalendarMarks, setShowCalendarMarksState] = useState<boolean>(() => {
    const raw = localStorage.getItem(KEY_MARKS);
    return raw === null ? true : raw === "true";
  });

  useEffect(() => {
    localStorage.setItem(KEY_FIELDS, JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    localStorage.setItem(KEY_MARKS, String(showCalendarMarks));
  }, [showCalendarMarks]);

  const setField = (k: BookingField, v: boolean) =>
    setFields((prev) => ({ ...prev, [k]: v }));
  const setShowCalendarMarks = (v: boolean) => setShowCalendarMarksState(v);
  const resetFields = () => setFields(DEFAULT_FIELDS);

  return (
    <Ctx.Provider value={{ fields, setField, showCalendarMarks, setShowCalendarMarks, resetFields }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFieldSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFieldSettings must be inside FieldSettingsProvider");
  return ctx;
}
