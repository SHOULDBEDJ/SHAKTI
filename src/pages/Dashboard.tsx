import { useMemo, useState } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { useFieldSettings } from "@/lib/FieldSettingsContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingForm } from "@/components/BookingForm";
import { BookingDetail } from "@/components/BookingDetail";
import { Booking } from "@/lib/db";

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const { data, loading } = useDB();
  const { t } = useApp();
  const { showCalendarMarks } = useFieldSettings();
  const [openForm, setOpenForm] = useState(false);
  const [modal, setModal] = useState<{ title: string; bookings: Booking[] } | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const today = new Date();
    const todayStr = ymd(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = ymd(tomorrow);
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

    const bookings = data.bookings;
    const upcoming = bookings.filter((b) => b.deliveryDate && b.deliveryDate >= todayStr && b.status !== "Completed");
    const todays = bookings.filter((b) => b.deliveryDate === todayStr);
    const tomorrows = bookings.filter((b) => b.deliveryDate === tomorrowStr);
    const thisMonthB = bookings.filter((b) => {
      if (!b.deliveryDate) return false;
      const d = new Date(b.deliveryDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const lastMonthB = bookings.filter((b) => {
      if (!b.deliveryDate) return false;
      const d = new Date(b.deliveryDate);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });
    const sumPaid = (arr: Booking[]) =>
      arr.filter((b) => b.paymentMode === "Paid").reduce((s, b) => s + (b.amount || 0), 0);
    const pendingBalance = bookings
      .filter((b) => b.paymentMode === "Pending")
      .reduce((s, b) => s + (b.amount || 0), 0);

    return {
      upcoming, todays, tomorrows, thisMonthB, lastMonthB,
      thisMonthRev: sumPaid(thisMonthB),
      lastMonthRev: sumPaid(lastMonthB),
      pendingBalance,
    };
  }, [data]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    (data?.bookings || []).forEach((b) => {
      if (!b.deliveryDate) return;
      const arr = map.get(b.deliveryDate) || [];
      arr.push(b);
      map.set(b.deliveryDate, arr);
    });
    return map;
  }, [data?.bookings]);

  if (loading || !data || !stats) return <div className="text-center py-10">{t("loading")}</div>;

  const kpis = [
    { label: t("upcomingBookings"), value: stats.upcoming.length, list: stats.upcoming },
    { label: t("pendingBalance"), value: `₹${stats.pendingBalance}`, list: data.bookings.filter((b) => b.paymentMode === "Pending") },
    { label: t("todaysBookings"), value: stats.todays.length, list: stats.todays },
    { label: t("tomorrowsBookings"), value: stats.tomorrows.length, list: stats.tomorrows },
    { label: t("thisMonthBookings"), value: stats.thisMonthB.length, list: stats.thisMonthB },
    { label: t("thisMonthRevenue"), value: `₹${stats.thisMonthRev}`, list: stats.thisMonthB },
    { label: t("lastMonthRevenue"), value: `₹${stats.lastMonthRev}`, list: stats.lastMonthB },
  ];

  // Calendar
  const firstDay = new Date(calMonth.y, calMonth.m, 1);
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const startDow = firstDay.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const recent = data.bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{t("dashboard")}</h2>
        <Button onClick={() => setOpenForm(true)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> {t("newBooking")}
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={() => setModal({ title: k.label, bookings: k.list })}
            className="text-left"
          >
            <Card className="p-4 hover:shadow-elegant transition cursor-pointer h-full bg-gradient-to-br from-card to-secondary/30">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold mt-1 text-primary">{k.value}</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Calendar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t("calendar")}</h3>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setCalMonth((c) => ({ y: c.m === 0 ? c.y - 1 : c.y, m: c.m === 0 ? 11 : c.m - 1 }))} className="px-2">‹</button>
            <span className="font-medium min-w-[120px] text-center">
              {new Date(calMonth.y, calMonth.m).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setCalMonth((c) => ({ y: c.m === 11 ? c.y + 1 : c.y, m: c.m === 11 ? 0 : c.m + 1 }))} className="px-2">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1 font-semibold">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const dateStr = d ? `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
            const dayBookings = dateStr ? bookingsByDay.get(dateStr) || [] : [];
            const hasBookings = dayBookings.length > 0;
            const showMark = showCalendarMarks && hasBookings;
            return (
              <button
                key={i}
                disabled={!d || !hasBookings}
                onClick={() => hasBookings && setModal({ title: dateStr!, bookings: dayBookings })}
                className={`relative aspect-square rounded text-sm flex flex-col items-center justify-center transition ${
                  !d ? "" :
                  showMark
                    ? "bg-primary text-primary-foreground font-bold hover:scale-105 shadow-elegant"
                    : hasBookings
                      ? "hover:bg-muted font-medium"
                      : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <span>{d}</span>
                {showMark && (
                  <span className="absolute bottom-0.5 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-accent-foreground text-[9px] font-bold leading-none">
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Recent */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">{t("recentBookings")}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRecords")}</p>
        ) : (
          <div className="divide-y">
            {recent.map((b) => (
              <button key={b.id} onClick={() => setViewBooking(b)} className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 px-2 rounded">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{b.id}</p>
                  <p className="font-medium">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">{b.deliveryDate || "—"} · {b.functionType || "—"}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* New booking dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("newBooking")}</DialogTitle></DialogHeader>
          <BookingForm onClose={() => setOpenForm(false)} />
        </DialogContent>
      </Dialog>

      {/* KPI modal */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal?.title}</DialogTitle></DialogHeader>
          {modal && modal.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRecords")}</p>
          ) : (
            <div className="space-y-2">
              {modal?.bookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setModal(null); setViewBooking(b); }}
                  className="w-full text-left p-3 rounded border hover:bg-muted/50 flex justify-between"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{b.id}</p>
                    <p className="font-medium">{b.customerName}</p>
                    <p className="text-xs">{b.deliveryDate || "—"} · {b.status}</p>
                  </div>
                  <span className="text-sm font-semibold">₹{b.amount ?? "—"}</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking detail */}
      <Dialog open={!!viewBooking} onOpenChange={(o) => !o && setViewBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("bookings")}</DialogTitle></DialogHeader>
          {viewBooking && <BookingDetail booking={viewBooking} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
