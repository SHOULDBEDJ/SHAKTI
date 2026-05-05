import { Camera, FolderOpen, Trash2, Eye } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaItem, fileToDataUrl } from "@/lib/db";
import { useApp } from "@/lib/AppContext";
import MediaViewer from "./MediaViewer";

export function MediaUploader({
  items,
  onChange,
  accept = "image/*,video/*",
  whatsappContext,
  downloadPrefix,
}: {
  items: MediaItem[];
  onChange: (m: MediaItem[]) => void;
  accept?: string;
  whatsappContext?: { phone?: string; message: string };
  downloadPrefix?: string;
}) {
  const { t } = useApp();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newItems: MediaItem[] = [];
    for (const f of Array.from(files)) {
      const type: MediaItem["type"] = f.type.startsWith("video") ? "video" : "image";
      const dataUrl = await fileToDataUrl(f);
      newItems.push({ id: crypto.randomUUID(), type, dataUrl, name: f.name });
    }
    onChange([...items, ...newItems]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => cameraRef.current?.click()}>
          <Camera className="h-4 w-4 mr-1" /> {t("captureCamera")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <FolderOpen className="h-4 w-4 mr-1" /> {t("selectDevice")}
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {items.map((m, i) => (
            <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              {m.type === "image" ? (
                <img src={m.dataUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={m.dataUrl} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <Button type="button" size="icon" variant="secondary" onClick={() => setViewerIdx(i)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerIdx !== null && (
        <MediaViewer
          items={items}
          currentIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
          title={downloadPrefix || "Media Uploads"}
          downloadPrefix={downloadPrefix}
          whatsappContext={whatsappContext}
        />
      )}
    </div>
  );
}
