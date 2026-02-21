import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useSessionStore } from '../../store/session.store';
import { useUIStore } from '../../store/ui.store';

const navItems = [
  { path: '/pos', icon: ShoppingCart, labelKey: 'nav.pos' },
  { path: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { path: '/sales', icon: Receipt, labelKey: 'nav.sales' },
  { path: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { cashier, logout } = useSessionStore();
  const { addToast } = useUIStore();

  const handleLogout = () => {
    logout();
    addToast('Déconnexion réussie', 'info');
  };

  return (
    <aside
      className={`h-full bg-maive-warm-white border-r border-maive-parchment flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-maive-parchment">
        {collapsed ? (
          <span className="font-display text-xl text-maive-camel">M</span>
        ) : (
          <div className="text-center">
            <span className="font-display text-2xl text-maive-noir tracking-wider">MAIVÉ</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-maive-sm transition-all ${
                isActive
                  ? 'bg-maive-camel text-white'
                  : 'text-maive-charcoal hover:bg-maive-cream'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-body text-sm font-medium">{t(item.labelKey)}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-maive-parchment p-3">
        {!collapsed && cashier && (
          <div className="mb-3 px-2">
            <p className="font-body text-sm font-medium text-maive-noir">{cashier.name}</p>
            <p className="font-body text-xs text-maive-muted capitalize">{cashier.role}</p>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-maive-sm text-maive-muted hover:bg-maive-cream hover:text-maive-danger transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="font-body text-sm">Déconnexion</span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 w-full flex items-center justify-center py-2 rounded-maive-sm text-maive-muted hover:bg-maive-cream transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
