import { useEffect, useMemo, useState } from "react";
import { Booking, BookingStatus, MediaItem, PaymentMode, genBookingId, nextCustomerId } from "@/lib/db";
import { useFieldSettings } from "@/lib/FieldSettingsContext";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "./VoiceRecorder";
import { MediaUploader } from "./MediaUploader";
import { MicButton } from "./MicButton";
import { toast } from "sonner";

interface Props {
  booking?: Booking;
  onClose: () => void;
}

const STATUSES: BookingStatus[] = ["Pending", "Confirmed", "Delivered", "Returned", "Completed"];
const PAYMENTS: PaymentMode[] = ["Pending", "Paid"];

export function BookingForm({ booking, onClose }: Props) {
  const { data, update } = useDB();
  const { t, lang } = useApp();
  const { fields: f } = useFieldSettings();

  const [now] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState(booking?.customerId || "");
  const [name, setName] = useState(booking?.customerName || "");
  const [phone, setPhone] = useState(booking?.customerPhone || "");
  const [place, setPlace] = useState(booking?.place || "");
  const [deliveryDate, setDeliveryDate] = useState(booking?.deliveryDate || "");
  const [deliveryTime, setDeliveryTime] = useState(booking?.deliveryTime || "");
  const [returnDate, setReturnDate] = useState(booking?.returnDate || "");
  const [returnTime, setReturnTime] = useState(booking?.returnTime || "");
  const [functionType, setFunctionType] = useState(booking?.functionType || "");
  const [status, setStatus] = useState<BookingStatus>(booking?.status || "Pending");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(booking?.paymentMode || "Pending");
  const [amount, setAmount] = useState<string>(booking?.amount != null ? String(booking.amount) : "");
  const [paidAmount, setPaidAmount] = useState<string>(booking?.paidAmount != null ? String(booking.paidAmount) : "");
  const [voiceNotes, setVoiceNotes] = useState<MediaItem[]>(booking?.voiceNotes || []);
  const [billMedia, setBillMedia] = useState<MediaItem[]>(booking?.billMedia || []);

  const customers = data?.customers || [];
  const matches = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5);
  }, [search, customers]);

  const noMatch = search.trim().length > 1 && matches.length === 0 && !customerId;

  // Auto-fetch typed phone (10 digits) into phone field when no customer found
  useEffect(() => {
    if (noMatch && /^\d{10}$/.test(search.trim()) && !phone) {
      setPhone(search.trim());
    }
  }, [noMatch, search, phone]);

  const pickCustomer = (c: typeof customers[0]) => {
    setCustomerId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setPlace(c.place || "");
    setSearch("");
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name & phone required");
      return;
    }
    if (phone.trim().length !== 10) {
      toast.error("Phone must be 10 digits");
      return;
    }
    if (amount === "" || isNaN(Number(amount))) {
      toast.error("Total amount required");
      return;
    }
    await update((d) => {
      let cid = customerId;
      let customers = d.customers;
      let customerCounter = d.customerCounter;
      if (!cid) {
        const existing = customers.find((c) => c.phone === phone.trim());
        if (existing) {
          cid = existing.id;
        } else {
          cid = nextCustomerId(customerCounter);
          customerCounter += 1;
          customers = [
            ...customers,
            { id: cid, name: name.trim(), phone: phone.trim(), place, createdAt: new Date().toISOString() },
          ];
        }
      } else {
        customers = customers.map((c) =>
          c.id === cid ? { ...c, name: name.trim(), phone: phone.trim(), place } : c
        );
      }

      const newBooking: Booking = {
        id: booking?.id || genBookingId(),
        customerId: cid,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        place,
        createdAt: booking?.createdAt || now.toISOString(),
        deliveryDate: deliveryDate || undefined,
        deliveryTime: deliveryTime || undefined,
        returnDate: returnDate || undefined,
        returnTime: returnTime || undefined,
        functionType: functionType || undefined,
        status,
        paymentMode,
        amount: amount === "" ? null : Number(amount),
        paidAmount: paidAmount === "" ? null : Number(paidAmount),
        voiceNotes,
        billMedia,
      };

      const bookings = booking
        ? d.bookings.map((b) => (b.id === booking.id ? newBooking : b))
        : [newBooking, ...d.bookings];

      return { ...d, customers, customerCounter, bookings };
    });
    toast.success(t("saved"));
    onClose();
  };

  return (
    <div className="space-y-5">
      {/* Auto Date */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <span className="text-muted-foreground">{t("current")}: </span>
        <span className="font-medium">{now.toLocaleString("en-IN")}</span>
      </div>

      {/* Customer Search */}
      {!booking && f.customerSearch && (
        <div className="space-y-2">
          <Label>{t("searchCustomer")}</Label>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={search}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 10);
              setSearch(v);
              if (customerId) setCustomerId("");
            }}
            placeholder="Enter 10-digit phone or name"
          />
          {matches.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              {matches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCustomer(c)}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                >
                  <span>{c.name} — {c.phone}</span>
                  <span className="text-xs text-muted-foreground">{c.id}</span>
                </button>
              ))}
            </div>
          )}
          {noMatch && (
            <p className="text-sm text-accent-foreground bg-accent/30 rounded p-2">{t("noCustomerFound")}</p>
          )}
        </div>
      )}

      {/* Customer Name + mic */}
      {f.customerName && (
        <div className="space-y-2">
          <Label>{t("customerName")}</Label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <MicButton onResult={(txt) => setName((n) => (n ? n + " " + txt : txt))} lang={lang === "kn" ? "kn-IN" : "en-IN"} />
          </div>
        </div>
      )}

      {(f.phone || f.place) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {f.phone && (
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit phone"
              />
            </div>
          )}
          {f.place && (
            <div className="space-y-2">
              <Label>{t("place")}</Label>
              <Input value={place} onChange={(e) => setPlace(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {/* Delivery */}
      {f.deliveryDateTime && (
        <div className="space-y-2">
          <Label>{t("deliveryDateTime")} ({t("optional")})</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            <Input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          </div>
        </div>
      )}

      {/* Return */}
      {f.returnDateTime && (
        <div className="space-y-2">
          <Label>{t("returnDateTime")} ({t("optional")})</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
          </div>
        </div>
      )}

      {(f.functionType || f.totalAmount) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {f.functionType && (
            <div className="space-y-2">
              <Label>{t("functionType")}</Label>
              <Select value={functionType} onValueChange={setFunctionType}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {data?.functionTypes.map((ft) => (
                    <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {f.totalAmount && (
            <div className="space-y-2">
              <Label>Total Amount *</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter total amount"
              />
            </div>
          )}
        </div>
      )}

      {f.amountGiven && (
        <div className="space-y-2">
          <Label>Amount Given</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="Enter amount given (optional)"
          />
        </div>
      )}

      {(f.bookingStatus || f.paymentMode) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {f.bookingStatus && (
            <div className="space-y-2">
              <Label>{t("bookingStatus")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(s.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {f.paymentMode && (
            <div className="space-y-2">
              <Label>{t("paymentMode")}</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENTS.map((p) => (
                    <SelectItem key={p} value={p}>{t(p.toLowerCase() as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {f.voiceNotes && (
        <div className="space-y-2">
          <Label>{t("voiceNotes")}</Label>
          <VoiceRecorder notes={voiceNotes} onChange={setVoiceNotes} />
        </div>
      )}

      {f.billMedia && (
        <div className="space-y-2">
          <Label>{t("billPhotos")}</Label>
          <MediaUploader items={billMedia} onChange={setBillMedia} />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-background pb-2">
        <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={handleSave} className="bg-gradient-primary">{t("save")}</Button>
      </div>
    </div>
  );
}
