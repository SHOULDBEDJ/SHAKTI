import { X, ChevronLeft, ChevronRight, Download, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface MediaViewerProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  title?: string;
  whatsappContext?: {
    phone?: string;
    message: string;
  };
  downloadPrefix?: string;
}

export default function MediaViewer({
  items,
  currentIndex: initialIndex,
  onClose,
  onNavigate,
  title,
  whatsappContext,
  downloadPrefix = "SSS-Media",
}: MediaViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const currentItem = items[index];
  if (!currentItem) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIdx = (index - 1 + items.length) % items.length;
    setIndex(newIdx);
    onNavigate?.(newIdx);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIdx = (index + 1) % items.length;
    setIndex(newIdx);
    onNavigate?.(newIdx);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ext = currentItem.type === "video" ? "mp4" : "jpg";
    const fileName = `${downloadPrefix}-${index + 1}.${ext}`;

    try {
      // Use fetch to get blob for reliable download across browsers
      const response = await fetch(currentItem.dataUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
      // Fallback for data URLs
      const a = document.createElement("a");
      a.href = currentItem.dataUrl;
      a.download = fileName;
      a.click();
    }
  };

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Try Web Share API first for native sharing on mobile
    if (navigator.share && currentItem.dataUrl.startsWith("data:")) {
      try {
        const response = await fetch(currentItem.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `media.${currentItem.type === "video" ? "mp4" : "jpg"}`, { type: blob.type });
        
        await navigator.share({
          files: [file],
          title: "Shiva Shakti Shamiyana",
          text: whatsappContext?.message || "Shared from Shiva Shakti Shamiyana",
        });
        return;
      } catch (err) {
        console.log("Web Share failed, falling back to link", err);
      }
    }

    // Fallback to wa.me link
    const link = whatsappLink(whatsappContext?.phone || "", whatsappContext?.message || "Shared from Shiva Shakti Shamiyana");
    window.open(link, "_blank");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index]);

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="text-white">
          <p className="text-xs opacity-70 uppercase tracking-widest font-semibold">
            {title || "Media Viewer"}
          </p>
          <p className="text-sm font-medium">
            {index + 1} / {items.length}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20 transition-all hover:rotate-90"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-20 text-white bg-black/20 hover:bg-black/40 h-12 w-12 rounded-full backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-20 text-white bg-black/20 hover:bg-black/40 h-12 w-12 rounded-full backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        <div className="max-w-full max-h-full flex items-center justify-center select-none">
          {currentItem.type === "image" ? (
            <img 
              src={currentItem.dataUrl} 
              alt={title}
              className="max-w-[95vw] max-h-[80vh] object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
            />
          ) : (
            <video 
              src={currentItem.dataUrl} 
              controls 
              autoPlay
              className="max-w-[95vw] max-h-[80vh] shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
            />
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          onClick={handleDownload}
          className={cn(
            "bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-6 h-auto rounded-xl flex flex-col gap-1 shadow-lg transition-all hover:scale-105 active:scale-95 group",
            "animate-pulse-glow"
          )}
        >
          <Download className="h-6 w-6 group-hover:animate-bounce" />
          <span className="text-[10px] uppercase tracking-tighter">Download</span>
        </Button>

        <Button
          onClick={handleWhatsApp}
          className="bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold px-6 py-6 h-auto rounded-xl flex flex-col gap-1 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-[10px] uppercase tracking-tighter">WhatsApp</span>
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px hsl(var(--primary) / 0.4); }
          50% { box-shadow: 0 0 30px hsl(var(--primary) / 0.7); }
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
