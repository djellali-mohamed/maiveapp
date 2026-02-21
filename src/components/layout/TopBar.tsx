import { useTranslation } from 'react-i18next';
import { Clock, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../store/session.store';

export function TopBar() {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { drawerSession } = useSessionStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-DZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-DZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="h-14 bg-maive-warm-white border-b border-maive-parchment flex items-center justify-between px-6">
      {/* Left: Date & Time */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-maive-muted">
          <Calendar className="w-4 h-4" />
          <span className="font-body text-sm capitalize">
            {formatDate(currentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-maive-noir">
          <Clock className="w-4 h-4" />
          <span className="font-body text-sm font-medium">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Center: Drawer Status */}
      <div className="flex items-center gap-2">
        {drawerSession ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-maive-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-body text-xs font-medium">
              Caisse ouverte
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-maive-sm">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="font-body text-xs font-medium">
              Caisse fermée
            </span>
          </div>
        )}
      </div>

      {/* Right: App Info */}
      <div className="flex items-center gap-4">
        <span className="font-display text-lg text-maive-camel">MAIVÉ</span>
        <span className="font-body text-xs text-maive-muted">
          Caisse
        </span>
      </div>
    </header>
  );
}
