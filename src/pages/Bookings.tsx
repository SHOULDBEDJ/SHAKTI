import { useState } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { Booking } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BookingForm } from "@/components/BookingForm";
import { BookingDetail } from "@/components/BookingDetail";
import { toast } from "sonner";

export default function Bookings() {
  const { data, loading, update } = useDB();
  const { t } = useApp();
  const { has } = useAuth();
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading || !data) return <div className="text-center py-10">{t("loading")}</div>;

  const bookings = data.bookings.filter((b) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return b.customerName.toLowerCase().includes(s) || b.customerPhone.includes(s) || b.id.toLowerCase().includes(s);
  });

  const onDelete = async () => {
    if (!deleteId) return;
    await update((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== deleteId) }));
    toast.success(t("deleted"));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{t("bookings")}</h2>
        {has("bookings.create") && (
          <Button onClick={() => setOpenNew(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-1" /> {t("newBooking")}
          </Button>
        )}
      </div>
      <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />

      {bookings.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t("noRecords")}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-4 hover:shadow-elegant transition flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-muted-foreground">{b.id}</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px]">{b.status}</Badge>
                  <Badge variant={b.paymentMode === "Paid" ? "default" : "destructive"} className="text-[10px]">{b.paymentMode}</Badge>
                </div>
              </div>
              <p className="font-semibold">{b.customerName}</p>
              <p className="text-xs text-muted-foreground">{b.customerPhone}</p>
              <p className="text-xs mt-1">{b.deliveryDate || "—"} · {b.functionType || "—"}</p>
              <p className="text-sm font-semibold mt-1 text-primary">₹{b.amount ?? "—"}</p>
              <div className="flex gap-1 mt-3 pt-3 border-t">
                <Button size="sm" variant="ghost" onClick={() => setViewing(b)} className="flex-1">
                  <Eye className="h-4 w-4" />
                </Button>
                {has("bookings.edit") && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(b)} className="flex-1">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {has("bookings.delete") && (
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(b.id)} className="flex-1 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("newBooking")}</DialogTitle></DialogHeader>
          <BookingForm onClose={() => setOpenNew(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("edit")}</DialogTitle></DialogHeader>
          {editing && <BookingForm booking={editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("view")}</DialogTitle></DialogHeader>
          {viewing && <BookingDetail booking={viewing} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
