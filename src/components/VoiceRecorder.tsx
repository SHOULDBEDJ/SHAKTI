import { Mic, Square, Play, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaItem, blobToDataUrl } from "@/lib/db";
import { useApp } from "@/lib/AppContext";

export function VoiceRecorder({
  notes,
  onChange,
}: {
  notes: MediaItem[];
  onChange: (n: MediaItem[]) => void;
}) {
  const { t } = useApp();
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        onChange([...notes, { id: crypto.randomUUID(), type: "audio", dataUrl }]);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e) {
      alert("Microphone access denied");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!recording ? (
          <Button type="button" variant="secondary" size="sm" onClick={start}>
            <Mic className="h-4 w-4 mr-1" /> {t("record")}
          </Button>
        ) : (
          <Button type="button" variant="destructive" size="sm" onClick={stop}>
            <Square className="h-4 w-4 mr-1" /> {t("stop")}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{notes.length} {t("voiceNotes")}</span>
      </div>
      <div className="space-y-2">
        {notes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <Play className="h-4 w-4 text-primary" />
            <audio controls src={n.dataUrl} className="h-8 flex-1 max-w-full" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(notes.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
