import { Booking } from "@/lib/db";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaViewer from "./MediaViewer";
import { useDB } from "@/lib/useDB";

export function BookingDetail({ booking }: { booking: Booking }) {
  const { t } = useApp();
  const { has } = useAuth();
  const [picker, setPicker] = useState(false);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { data } = useDB();
  const canWA = has("bookings.whatsapp");

  const formatTemplate = (body: string) => {
    return body
      .replace(/{customerName}/g, booking.customerName)
      .replace(/{bookingId}/g, booking.id)
      .replace(/{deliveryDate}/g, booking.deliveryDate || "N/A")
      .replace(/{amount}/g, String(booking.amount || "0"))
      .replace(/{place}/g, booking.place || "N/A");
  };

  const sendTpl = (body: string) => {
    window.open(whatsappLink(booking.customerPhone, formatTemplate(body)), "_blank");
    setShowTemplates(false);
  };

  const sendBill = (dataUrl: string) => {
    window.open(whatsappLink(booking.customerPhone, `Bill for booking ${booking.id}`), "_blank");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `SSS-Booking-${booking.id}-photo.jpg`;
    a.click();
    setPicker(false);
  };

  const showWA = canWA;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{t("bookingId")}</p>
          <p className="font-mono text-lg font-bold">{booking.id}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{booking.status}</Badge>
          <Badge variant={booking.paymentMode === "Paid" ? "default" : "destructive"}>
            {booking.paymentMode}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label={t("customerName")} value={booking.customerName} />
        <Field label={t("phone")} value={booking.customerPhone} />
        <Field label={t("customerId")} value={booking.customerId} />
        <Field label={t("place")} value={booking.place || "—"} />
        <Field label={t("functionType")} value={booking.functionType || "—"} />
        <Field label={t("amount")} value={booking.amount != null ? String(booking.amount) : "—"} />
        <Field
          label={t("deliveryDateTime")}
          value={booking.deliveryDate ? `${booking.deliveryDate} ${booking.deliveryTime || ""}` : "—"}
        />
        <Field
          label={t("returnDateTime")}
          value={booking.returnDate ? `${booking.returnDate} ${booking.returnTime || ""}` : "—"}
        />
      </div>

      {booking.voiceNotes.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">{t("voiceNotes")}</p>
          <div className="space-y-2">
            {booking.voiceNotes.map((v) => (
              <audio key={v.id} controls src={v.dataUrl} className="w-full h-8" />
            ))}
          </div>
        </div>
      )}

      {booking.billMedia.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">{t("billPhotos")}</p>
          <div className="grid grid-cols-3 gap-2">
            {booking.billMedia.map((m, i) => (
              <div 
                key={m.id} 
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewerIdx(i)}
              >
                {m.type === "image" ? (
                  <img src={m.dataUrl} className="rounded aspect-square object-cover w-full h-full" alt="" />
                ) : (
                  <div className="relative rounded aspect-square overflow-hidden">
                    <video src={m.dataUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewerIdx !== null && (
        <MediaViewer
          items={booking.billMedia}
          currentIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
          title={`Booking: ${booking.id}`}
          downloadPrefix={`SSS-Booking-${booking.id}`}
          whatsappContext={{
            phone: booking.customerPhone,
            message: `Dear ${booking.customerName}, please find your bill for booking ${booking.id} dated ${booking.deliveryDate || "N/A"}. — Shiva Shakti Shamiyana`,
          }}
        />
      )}

      {showWA && (
        <div className="space-y-2 pt-4 border-t">
          <Button onClick={() => setShowTemplates(true)} className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white">
            <MessageCircle className="h-4 w-4 mr-2" /> Send Message (Templates)
          </Button>
          {booking.billMedia.some((m) => m.type === "image") && (
            <Button onClick={() => setPicker(true)} className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white">
              <ImageIcon className="h-4 w-4 mr-2" /> {t("sendBillPhoto")}
            </Button>
          )}
        </div>
      )}

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select WhatsApp Template</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {data?.waTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => sendTpl(t.body)}
                className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-sm text-primary">{t.name}</p>
                  <MessageCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{formatTemplate(t.body)}</p>
              </button>
            ))}
            {(!data?.waTemplates || data.waTemplates.length === 0) && (
              <p className="text-center py-4 text-muted-foreground">No templates found. Add them in Settings.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("sendBillPhoto")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {booking.billMedia.filter((m) => m.type === "image").map((m) => (
              <button key={m.id} onClick={() => sendBill(m.dataUrl)} className="aspect-square rounded overflow-hidden border-2 hover:border-primary">
                <img src={m.dataUrl} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
