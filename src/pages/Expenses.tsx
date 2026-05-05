import { useState } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { Expense, MediaItem } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { MediaUploader } from "@/components/MediaUploader";
import { toast } from "sonner";

export default function Expenses() {
  const { data, loading, update } = useDB();
  const { t } = useApp();
  const { has } = useAuth();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [manageTypes, setManageTypes] = useState(false);
  const [newType, setNewType] = useState("");

  if (loading || !data) return <div className="text-center py-10">{t("loading")}</div>;

  const addType = async () => {
    const v = newType.trim();
    if (!v || data.expenseTypes.includes(v)) return;
    await update((d) => ({ ...d, expenseTypes: [...d.expenseTypes, v] }));
    setNewType("");
  };
  const removeType = async (n: string) => {
    await update((d) => ({ ...d, expenseTypes: d.expenseTypes.filter((x) => x !== n) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-2xl font-bold">{t("expenses")}</h2>
        <div className="flex gap-2">
          {has("settings.manageTypes") && (
            <Button variant="outline" onClick={() => setManageTypes(true)}>{t("manageTypes")}</Button>
          )}
          {has("expenses.create") && (
            <Button onClick={() => setOpenForm(true)} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-1" /> {t("add")}
            </Button>
          )}
        </div>
      </div>

      {data.expenses.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t("noRecords")}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.expenses.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString("en-IN")}</p>
                  <p className="font-semibold">{e.type}</p>
                  <p className="text-lg font-bold text-primary">₹{e.amount ?? "—"}</p>
                  {e.description && <p className="text-xs mt-1">{e.description}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  {has("expenses.edit") && (
                    <Button size="icon" variant="ghost" onClick={() => setEditing(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {has("expenses.delete") && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        await update((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== e.id) }));
                        toast.success(t("deleted"));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openForm || !!editing} onOpenChange={(o) => { if (!o) { setOpenForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t("edit") : t("add")}</DialogTitle></DialogHeader>
          <ExpenseForm
            expense={editing || undefined}
            onClose={() => { setOpenForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={manageTypes} onOpenChange={setManageTypes}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("expenseTypes")}</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder={t("add")} />
            <Button onClick={addType}>{t("add")}</Button>
          </div>
          <div className="space-y-1 mt-2">
            {data.expenseTypes.map((tp) => (
              <div key={tp} className="flex justify-between items-center p-2 border rounded">
                <span>{tp}</span>
                <Button size="icon" variant="ghost" onClick={() => removeType(tp)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExpenseForm({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { data, update } = useDB();
  const { t } = useApp();
  const [date, setDate] = useState(expense?.date.slice(0, 16) || new Date().toISOString().slice(0, 16));
  const [type, setType] = useState(expense?.type || "");
  const [bookingId, setBookingId] = useState(expense?.bookingId || "");
  const [amount, setAmount] = useState(expense?.amount != null ? String(expense.amount) : "");
  const [description, setDescription] = useState(expense?.description || "");
  const [voiceNotes, setVoiceNotes] = useState<MediaItem[]>(expense?.voiceNotes || []);
  const [media, setMedia] = useState<MediaItem[]>(expense?.media || []);

  const save = async () => {
    if (!type) { toast.error("Type required"); return; }
    const exp: Expense = {
      id: expense?.id || crypto.randomUUID(),
      date: new Date(date).toISOString(),
      type,
      bookingId: bookingId || undefined,
      amount: amount === "" ? null : Number(amount),
      description,
      voiceNotes,
      media,
    };
    await update((d) => ({
      ...d,
      expenses: expense ? d.expenses.map((e) => (e.id === expense.id ? exp : e)) : [exp, ...d.expenses],
    }));
    toast.success(t("saved"));
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("current")}</Label>
        <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("expenseType")}</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {data?.expenseTypes.map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("linkBooking")}</Label>
        <Select value={bookingId || "none"} onValueChange={(v) => setBookingId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {data?.bookings.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.id} — {b.customerName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("amount")}</Label>
        <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("description")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("voiceNotes")}</Label>
        <VoiceRecorder notes={voiceNotes} onChange={setVoiceNotes} />
      </div>
      <div className="space-y-2">
        <Label>{t("billPhotos")}</Label>
        <MediaUploader 
          items={media} 
          onChange={setMedia} 
          downloadPrefix={`SSS-Expense-${expense?.id || "New"}`}
          whatsappContext={{
            message: `Expense record ${expense?.id || "New"} dated ${expense?.date || new Date().toLocaleString()} — Shiva Shakti Shamiyana`
          }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={save} className="bg-gradient-primary">{t("save")}</Button>
      </div>
    </div>
  );
}
