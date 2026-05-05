import { useState } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { Album, MediaItem, fileToDataUrl } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import MediaViewer from "@/components/MediaViewer";

export default function Gallery() {
  const { data, loading, update } = useDB();
  const { t } = useApp();
  const { has } = useAuth();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [renaming, setRenaming] = useState<Album | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);

  if (loading || !data) return <div className="text-center py-10">{t("loading")}</div>;

  const create = async () => {
    if (!name.trim()) return;
    await update((d) => ({
      ...d,
      albums: [{ id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString(), media: [] }, ...d.albums],
    }));
    setName("");
    setCreating(false);
  };

  const upload = async (album: Album, files: FileList | null) => {
    if (!files) return;
    const items: MediaItem[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataUrl(f);
      items.push({
        id: crypto.randomUUID(),
        type: f.type.startsWith("video") ? "video" : "image",
        dataUrl,
        name: f.name,
      });
    }
    await update((d) => ({
      ...d,
      albums: d.albums.map((a) => (a.id === album.id ? { ...a, media: [...a.media, ...items] } : a)),
    }));
    if (openAlbum?.id === album.id) {
      setOpenAlbum({ ...album, media: [...album.media, ...items] });
    }
  };

  const deleteMedia = async (album: Album, idx: number) => {
    await update((d) => ({
      ...d,
      albums: d.albums.map((a) =>
        a.id === album.id ? { ...a, media: a.media.filter((_, i) => i !== idx) } : a
      ),
    }));
    setOpenAlbum({ ...album, media: album.media.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("gallery")}</h2>
        {has("gallery.create") && (
          <Button onClick={() => setCreating(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-1" /> {t("createAlbum")}
          </Button>
        )}
      </div>

      {data.albums.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{t("noRecords")}</Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.albums.map((a) => (
            <Card key={a.id} className="overflow-hidden cursor-pointer hover:shadow-elegant transition">
              <div onClick={() => setOpenAlbum(a)} className="aspect-square bg-muted relative">
                {a.media[0] ? (
                  a.media[0].type === "image" ? (
                    <img src={a.media[0].dataUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <video src={a.media[0].dataUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{t("noRecords")}</div>
                )}
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{a.media.length}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <p className="font-medium truncate">{a.name}</p>
                <div className="flex">
                  {has("gallery.rename") && (
                    <Button size="icon" variant="ghost" onClick={() => { setRenaming(a); setRenameVal(a.name); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {has("gallery.delete") && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        await update((d) => ({ ...d, albums: d.albums.filter((x) => x.id !== a.id) }));
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("createAlbum")}</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("album")} />
          <Button onClick={create} className="bg-gradient-primary">{t("save")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rename")}</DialogTitle></DialogHeader>
          <Input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} />
          <Button
            onClick={async () => {
              if (!renaming) return;
              await update((d) => ({
                ...d,
                albums: d.albums.map((x) => (x.id === renaming.id ? { ...x, name: renameVal } : x)),
              }));
              setRenaming(null);
            }}
            className="bg-gradient-primary"
          >
            {t("save")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Album content */}
      <Dialog open={!!openAlbum} onOpenChange={(o) => { if (!o) { setOpenAlbum(null); setViewerIdx(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{openAlbum?.name}</DialogTitle></DialogHeader>
          {openAlbum && (
            <>
              {has("gallery.upload") && (
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => upload(openAlbum, e.target.files)}
                  />
                  <span className="inline-flex items-center cursor-pointer bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">
                    <Upload className="h-4 w-4 mr-1" /> {t("upload")}
                  </span>
                </label>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-3">
                {openAlbum.media.map((m, i) => (
                  <div key={m.id} className="relative group aspect-square rounded overflow-hidden bg-muted">
                    <button onClick={() => setViewerIdx(i)} className="w-full h-full">
                      {m.type === "image" ? (
                        <img src={m.dataUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <video src={m.dataUrl} className="w-full h-full object-cover" />
                      )}
                    </button>
                    {has("gallery.delete") && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteMedia(openAlbum, i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {openAlbum && viewerIdx !== null && openAlbum.media[viewerIdx] && (
        <MediaViewer
          items={openAlbum.media}
          currentIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
          onNavigate={(idx) => setViewerIdx(idx)}
          title={`Gallery: ${openAlbum.name}`}
          downloadPrefix={`SSS-Gallery-${openAlbum.name.replace(/\s+/g, "-")}`}
          whatsappContext={{
            message: `Shared from Shiva Shakti Shamiyana Gallery: Album "${openAlbum.name}"`,
          }}
        />
      )}
    </div>
  );
}
