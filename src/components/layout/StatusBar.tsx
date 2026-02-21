import { useTranslation } from 'react-i18next';
import { Keyboard, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export function StatusBar() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <footer className="h-8 bg-maive-noir text-maive-cream flex items-center justify-between px-4 text-xs">
      {/* Left: Shortcuts hint */}
      <div className="flex items-center gap-2">
        <Keyboard className="w-3 h-3" />
        <span className="font-body opacity-80">
          F1: Vider | F2: Rechercher | F4: Finaliser | ESC: Fermer
        </span>
      </div>

      {/* Center: Version */}
      <div className="font-body opacity-60">
        MAIVÉ POS v1.0.0
      </div>

      {/* Right: Connection status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="font-body text-green-400">En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span className="font-body text-amber-400">Hors ligne</span>
          </>
        )}
      </div>
    </footer>
  );
}
