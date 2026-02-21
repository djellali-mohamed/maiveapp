import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "../store/session.store";
import { useUIStore } from "../store/ui.store";

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSessionStore();
  const { addToast } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await window.electronAPI.verifyPin(pin);
      if (result) {
        login({
          id: result.id,
          name: result.name,
          role: result.role,
        });
        addToast(`Bienvenue, ${result.name}!`, "success");
        onClose();
      } else {
        setError("Code PIN invalide");
        setPin("");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPad = (key: string) => {
    if (pin.length < 4) {
      setPin(pin + key);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-maive-warm-white border-maive-parchment">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl text-maive-noir">
            MAIVÉ
          </DialogTitle>
          <p className="text-center text-maive-muted text-sm">
            {t("app.tagline")}
          </p>
          <DialogDescription className="sr-only">
            Veuillez saisir votre code PIN pour accéder au système.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? "bg-maive-camel border-maive-camel"
                    : "border-maive-parchment"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-center text-red-600 text-sm">{error}</p>}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPad(num.toString())}
                className="h-14 text-xl font-body font-medium rounded-maive-sm bg-maive-cream hover:bg-maive-parchment transition-colors text-maive-noir"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 text-sm font-body rounded-maive-sm bg-maive-cream hover:bg-maive-parchment transition-colors text-maive-muted"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeyPad("0")}
              className="h-14 text-xl font-body font-medium rounded-maive-sm bg-maive-cream hover:bg-maive-parchment transition-colors text-maive-noir"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 text-sm font-body rounded-maive-sm bg-maive-cream hover:bg-maive-parchment transition-colors text-maive-muted flex items-center justify-center"
            >
              ←
            </button>
          </div>

          <Button
            type="submit"
            disabled={pin.length !== 4 || isLoading}
            className="w-full h-12 bg-maive-camel hover:bg-maive-camel-dark text-white font-body rounded-maive-sm transition-all"
          >
            {isLoading ? "..." : "Connexion"}
          </Button>

          <p className="text-center text-xs text-maive-muted">
            PIN par défaut: 1234 (Admin)
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
