import logo from "@/assets/logo.jpeg";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";

export default function SplashScreen() {
  const { data } = useDB();
  const { t } = useApp();
  const biz = data?.business;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-splash animate-splash-fade">
      <div className="rounded-full p-2 bg-gradient-gold shadow-gold animate-pulse-glow">
        <img
          src={biz?.logo || logo}
          alt={biz?.name || "Shiva Shakti Shamiyana"}
          className="w-40 h-40 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-background/20"
        />
      </div>
      <h1 className="mt-8 text-2xl sm:text-3xl font-bold text-primary-foreground tracking-wide text-center px-4">
        {biz?.name || "Shiva Shakti Shamiyana"}
      </h1>
      <p className="mt-2 text-sm text-primary-foreground/70">
        {biz?.name === "Shiva Shakti Shamiyana" || !biz?.name ? "ಶಿವ ಶಕ್ತಿ ಶಾಮಿಯಾನ" : ""}
      </p>
    </div>
  );
}
