import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatch = event.key === shortcut.key;
      const ctrlMatch = !!shortcut.ctrl === event.ctrlKey;
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// POS-specific shortcuts
export const POS_SHORTCUTS = {
  CLEAR_CART: 'F1',
  FOCUS_SEARCH: 'F2',
  OPEN_CHECKOUT: 'F4',
  CLOSE_MODAL: 'Escape',
  OPEN_DISCOUNT: 'd',
  REMOVE_ITEM: 'Delete',
};

export function usePOSShortcuts(handlers: {
  onClearCart: () => void;
  onFocusSearch: () => void;
  onOpenCheckout: () => void;
  onCloseModal: () => void;
  onOpenDiscount: () => void;
  onRemoveItem: () => void;
}) {
  useKeyboardShortcuts([
    { key: 'F1', handler: handlers.onClearCart },
    { key: 'F2', handler: handlers.onFocusSearch },
    { key: 'F4', handler: handlers.onOpenCheckout },
    { key: 'Escape', handler: handlers.onCloseModal },
    { key: 'd', ctrl: true, handler: handlers.onOpenDiscount },
    { key: 'Delete', handler: handlers.onRemoveItem },
  ]);
}
