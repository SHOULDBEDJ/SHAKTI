import { useMemo, useState } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { Booking, Customer } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookingDetail } from "@/components/BookingDetail";

export default function Customers() {
  const { data, loading } = useDB();
  const { t } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Customer | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [bookingView, setBookingView] = useState<Booking | null>(null);

  const results = useMemo(() => {
    if (!data) return [];
    const s = q.toLowerCase().trim();
    if (!s) return data.customers;
    // Search by name/phone/place/customerId/bookingId/booking date
    const matchedByBooking = new Set(
      data.bookings
        .filter((b) => b.id.toLowerCase().includes(s) || (b.deliveryDate || "").includes(s))
        .map((b) => b.customerId)
    );
    return data.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.place || "").toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s) ||
        matchedByBooking.has(c.id)
    );
  }, [q, data]);

  if (loading || !data) return <div className="text-center py-10">{t("loading")}</div>;

  const customerBookings = open ? data.bookings.filter((b) => b.customerId === open.id) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t("customerHistory")}</h2>
      <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />

      {results.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t("noRecords")}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((c) => {
            const count = data.bookings.filter((b) => b.customerId === c.id).length;
            return (
              <Card key={c.id} className="p-4 flex justify-between items-center hover:shadow-elegant transition">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{c.id}</p>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm">{c.phone}</p>
                  {c.place && <p className="text-xs text-muted-foreground">{c.place}</p>}
                  <p className="text-xs mt-1">{count} {t("totalBookings")}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setOpen(c)}>
                  <Eye className="h-5 w-5" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{open?.name}</DialogTitle></DialogHeader>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm">
              <span className="text-muted-foreground">{t("totalBookings")}: </span>
              <span className="font-bold">{customerBookings.length}</span>
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>
                <LayoutGrid className="h-4 w-4 mr-1" />{t("gridView")}
              </Button>
              <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
                <TableIcon className="h-4 w-4 mr-1" />{t("tableView")}
              </Button>
            </div>
          </div>
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {customerBookings.map((b) => (
                <button key={b.id} onClick={() => setBookingView(b)} className="text-left">
                  <Card className="p-3 hover:shadow-elegant">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs">{b.id}</span>
                      <Badge variant="secondary" className="text-[10px]">{b.status}</Badge>
                    </div>
                    <p className="text-sm mt-1">{b.deliveryDate || "—"}</p>
                    <p className="text-sm">{b.functionType || "—"}</p>
                    <p className="text-sm font-semibold mt-1">₹{b.amount ?? "—"}</p>
                  </Card>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">{t("bookingId")}</th>
                    <th className="p-2">{t("date")}</th>
                    <th className="p-2">{t("functionType")}</th>
                    <th className="p-2">{t("status")}</th>
                    <th className="p-2">{t("payment")}</th>
                    <th className="p-2">{t("amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBookings.map((b) => (
                    <tr key={b.id} className="border-b cursor-pointer hover:bg-muted/40" onClick={() => setBookingView(b)}>
                      <td className="p-2 font-mono">{b.id}</td>
                      <td className="p-2">{b.deliveryDate || "—"}</td>
                      <td className="p-2">{b.functionType || "—"}</td>
                      <td className="p-2">{b.status}</td>
                      <td className="p-2">{b.paymentMode}</td>
                      <td className="p-2">₹{b.amount ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!bookingView} onOpenChange={(o) => !o && setBookingView(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("view")}</DialogTitle></DialogHeader>
          {bookingView && <BookingDetail booking={bookingView} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
