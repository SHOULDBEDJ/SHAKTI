import { Mic } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function MicButton({ onResult, lang = "en-IN" }: { onResult: (text: string) => void; lang?: string }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const start = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported on this device");
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const txt = e.results[0][0].transcript;
      onResult(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };
  const stop = () => recRef.current?.stop();

  return (
    <Button
      type="button"
      variant={listening ? "destructive" : "secondary"}
      size="icon"
      onClick={listening ? stop : start}
      aria-label="Mic"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
