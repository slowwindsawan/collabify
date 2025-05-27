import { create } from 'zustand';

type Listener = (data: any) => void;

interface EventStore {
  listeners: Map<string, Set<Listener>>;
  publish: (event: string, data: any) => void;
  subscribe: (event: string, callback: Listener) => () => void;
  unsubscribe: (event: string, callback: Listener) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  listeners: new Map(),

  publish: (event, data) => {
    const listeners = get().listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  },

  subscribe: (event, callback) => {
    const { listeners } = get();
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => get().unsubscribe(event, callback);
  },

  unsubscribe: (event, callback) => {
    const listeners = get().listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        get().listeners.delete(event);
      }
    }
  },
}));