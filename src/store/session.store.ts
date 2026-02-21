import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Cashier {
  id: number;
  name: string;
  role: 'admin' | 'cashier';
}

interface DrawerSession {
  id: number;
  cashierId: number;
  openingFloat: number;
  openedAt: string;
}

interface SessionState {
  // Authentication
  isAuthenticated: boolean;
  cashier: Cashier | null;
  
  // Drawer
  drawerSession: DrawerSession | null;
  
  // Actions
  login: (cashier: Cashier) => void;
  logout: () => void;
  openDrawer: (session: DrawerSession) => void;
  closeDrawer: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      cashier: null,
      drawerSession: null,

      login: (cashier) => {
        set({ isAuthenticated: true, cashier });
      },

      logout: () => {
        set({ isAuthenticated: false, cashier: null, drawerSession: null });
      },

      openDrawer: (session) => {
        set({ drawerSession: session });
      },

      closeDrawer: () => {
        set({ drawerSession: null });
      },
    }),
    {
      name: 'maive-session',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        cashier: state.cashier,
        drawerSession: state.drawerSession,
      }),
    }
  )
);
