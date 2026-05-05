import { get, set, del, keys, clear } from "idb-keyval";

export interface Customer {
  id: string; // CUS001
  name: string;
  phone: string;
  place?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  type: "image" | "video" | "audio";
  dataUrl: string;
  name?: string;
}

export type BookingStatus = "Pending" | "Confirmed" | "Delivered" | "Returned" | "Completed";
export type PaymentMode = "Pending" | "Paid";

export interface Booking {
  id: string; // 6-char alphanumeric
  customerId: string;
  customerName: string;
  customerPhone: string;
  place?: string;
  createdAt: string;
  deliveryDate?: string; // yyyy-mm-dd
  deliveryTime?: string; // HH:mm
  returnDate?: string;
  returnTime?: string;
  functionType?: string;
  status: BookingStatus;
  paymentMode: PaymentMode;
  amount?: number | null;
  paidAmount?: number | null;
  voiceNotes: MediaItem[];
  billMedia: MediaItem[];
}

export interface Expense {
  id: string;
  date: string; // ISO
  type: string;
  bookingId?: string;
  amount?: number | null;
  description?: string;
  voiceNotes: MediaItem[];
  media: MediaItem[];
}

export interface BusinessInfo {
  name: string;
  logo?: string;
  contact: string;
  altContact?: string;
  address?: string;
}

export interface WATemplate {
  id: string;
  name: string;
  body: string;
}

export interface AppData {
  customers: Customer[];
  bookings: Booking[];
  expenses: Expense[];
  albums: Album[];
  functionTypes: string[];
  expenseTypes: string[];
  customerCounter: number;
  business: BusinessInfo;
  waTemplates: WATemplate[];
}

const KEY = "shiva-shakti-data";

const DEFAULT: AppData = {
  customers: [],
  bookings: [],
  expenses: [],
  albums: [],
  functionTypes: ["Wedding", "Birthday", "Corporate", "Engagement", "Housewarming"],
  expenseTypes: ["Transport", "Labour", "Food", "Maintenance"],
  customerCounter: 0,
  business: {
    name: "Shiva Shakti Shamiyana",
    contact: "",
  },
  waTemplates: [
    { id: "def-1", name: "Booking Confirmation", body: "Dear {customerName}, your booking {bookingId} is confirmed for {deliveryDate}. Thank you!" },
    { id: "def-2", name: "Payment Reminder", body: "Dear {customerName}, a payment for booking {bookingId} is pending. Amount: {amount}. Please clear it soon." }
  ],
};

export async function loadData(): Promise<AppData> {
  // Try to load from API first
  try {
    const res = await fetch("/api");
    if (res.ok) {
      const apiData = await res.json();
      if (apiData) {
        // Sync API data to local storage
        await set(KEY, apiData);
        return { ...DEFAULT, ...apiData };
      }
    }
  } catch (error) {
    console.error("Failed to load from API, falling back to local:", error);
  }

  // Fallback to local storage
  const data = (await get<AppData>(KEY)) || DEFAULT;
  return { ...DEFAULT, ...data };
}

export async function saveData(data: AppData): Promise<void> {
  // Save to local storage first (optimistic)
  await set(KEY, data);

  // Then try to save to API
  try {
    await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Failed to save to API:", error);
    // Note: We don't throw here so the UI continues to work locally
  }
}

export function genBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function nextCustomerId(counter: number): string {
  return `CUS${String(counter + 1).padStart(3, "0")}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function exportAll(): Promise<string> {
  const data = await loadData();
  return JSON.stringify(data, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  await saveData({ ...DEFAULT, ...parsed });
}

export async function deleteAll(): Promise<void> {
  const ks = await keys();
  await Promise.all(ks.map((k) => del(k)));
}

// Auto status update logic
export function applyAutoStatus(b: Booking): Booking {
  const now = new Date();
  let status = b.status;
  const order: BookingStatus[] = ["Pending", "Confirmed", "Delivered", "Returned", "Completed"];
  const idx = (s: BookingStatus) => order.indexOf(s);

  if (b.deliveryDate) {
    const dt = new Date(`${b.deliveryDate}T${b.deliveryTime || "00:00"}`);
    if (dt < now && idx(status) < idx("Delivered")) status = "Delivered";
  }
  if (b.returnDate) {
    const dt = new Date(`${b.returnDate}T${b.returnTime || "23:59"}`);
    if (dt < now && idx(status) < idx("Returned")) status = "Returned";
  }
  return status === b.status ? b : { ...b, status };
}
