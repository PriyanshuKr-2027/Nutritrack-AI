// lib/useNetInfo.ts
// Thin wrapper around @react-native-community/netinfo.
// Returns { isConnected: boolean } — defaults to true until first check resolves
// so screens don't flash "offline" on initial render.

import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetInfo(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Subscribe to future changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return unsubscribe;
  }, []);

  return { isConnected };
}
