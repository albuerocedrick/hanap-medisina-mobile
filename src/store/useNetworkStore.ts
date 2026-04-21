/**
 * store/useNetworkStore.ts
 *
 * Global network status tracker for HanapMedisina.
 *
 * Phase 3: Exposes `isOnline` and monitoring lifecycle so every screen
 *          can gate its UI on connectivity.
 *
 * Phase 4: The `_onReconnect` callback slot and `hasPendingSync` flag are
 *          pre-wired here. Phase 4 will call `setReconnectCallback()` from
 *          the sync engine — no store restructuring needed.
 */

import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from "@react-native-community/netinfo";
import { create } from "zustand";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ConnectionType =
  | "wifi"
  | "cellular"
  | "ethernet"
  | "none"
  | "unknown";

/**
 * Discriminated error for network monitoring failures.
 * Separate from FirebaseLibraryError — network errors are infrastructure-level.
 */
export type NetworkErrorCode =
  | "MONITORING_START_FAILED" // NetInfo.addEventListener threw
  | "MONITORING_STOP_FAILED" // Unsubscribe threw
  | "STATUS_CHECK_FAILED"; // NetInfo.fetch() threw on initial check

export class NetworkStoreError extends Error {
  constructor(
    public readonly code: NetworkErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "NetworkStoreError";
  }
}

// ─────────────────────────────────────────────
// PHASE 4 PRE-WIRE: Sync callback type
// ─────────────────────────────────────────────

/**
 * Phase 4 will register a callback here that fires when connectivity is
 * restored. The sync engine listens for this and prompts the user to upload
 * queued offline scans.
 *
 * Phase 3: Slot is defined but never called — `_onReconnect` stays null.
 */
type ReconnectCallback = () => void;

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface NetworkState {
  /** True when NetInfo reports an active internet connection. */
  isOnline: boolean;

  /** Granular connection type for diagnostic display (e.g. in Profile tab). */
  connectionType: ConnectionType;

  /** True once startMonitoring() has been called and the listener is active. */
  isMonitoring: boolean;

  /**
   * Phase 4 pre-wire: becomes true when the sync queue has pending items
   * AND the device comes back online. Drives the sync prompt banner.
   * Phase 3: Always false — set by useLibraryStore in Phase 4.
   */
  hasPendingSync: boolean;

  /** Last monitoring error, if any. Surfaced in dev/debug screens. */
  error: NetworkStoreError | null;

  // ── Internal (not for direct UI consumption) ──────────────────────────────

  /** Holds the NetInfo unsubscribe handle so stopMonitoring() can clean up. */
  _subscription: NetInfoSubscription | null;

  /**
   * Phase 4 pre-wire: callback registered by the sync engine.
   * Fires once on every transition from offline → online.
   */
  _onReconnect: ReconnectCallback | null;
}

interface NetworkActions {
  /**
   * Performs an immediate connectivity check and starts the NetInfo listener.
   * Call once from the root layout (_layout.tsx) on app mount.
   */
  startMonitoring: () => Promise<void>;

  /**
   * Removes the NetInfo listener. Call from the root layout on unmount.
   * Prevents memory leaks during development hot-reloads.
   */
  stopMonitoring: () => void;

  /**
   * Phase 4 pre-wire: registers the callback that fires on reconnection.
   * Called by the sync engine (useSyncStore) during its initialization.
   * Phase 3: exists but is never called.
   */
  setReconnectCallback: (callback: ReconnectCallback | null) => void;

  /**
   * Phase 4 pre-wire: lets useLibraryStore signal that queued scans exist.
   * Phase 3: exists but is never called with `true`.
   */
  setHasPendingSync: (hasPending: boolean) => void;

  /** Clears the last stored error. */
  clearError: () => void;
}

type NetworkStore = NetworkState & NetworkActions;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function resolveConnectionType(state: NetInfoState): ConnectionType {
  switch (state.type) {
    case "wifi":
      return "wifi";
    case "cellular":
      return "cellular";
    case "ethernet":
      return "ethernet";
    case "none":
    case "unknown":
    default:
      return state.isConnected ? "unknown" : "none";
  }
}

/**
 * Determines true online status. `isConnected` alone can be true on
 * captive-portal networks that have no real internet access.
 * `isInternetReachable` is the more reliable signal, but can be null
 * while NetInfo is still probing — fall back to `isConnected` in that case.
 */
function resolveIsOnline(state: NetInfoState): boolean {
  if (state.isInternetReachable === true) return true;
  if (state.isInternetReachable === false) return false;
  // null = still probing; treat as whatever isConnected says
  return state.isConnected ?? false;
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  isOnline: true, // Optimistic default; corrected immediately by startMonitoring
  connectionType: "unknown",
  isMonitoring: false,
  hasPendingSync: false,
  error: null,
  _subscription: null,
  _onReconnect: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  startMonitoring: async () => {
    // Guard: don't attach a second listener if already monitoring
    if (get().isMonitoring) return;

    try {
      // 1. Immediate check — populates state before the listener fires
      const initialState = await NetInfo.fetch();
      const initialOnline = resolveIsOnline(initialState);

      set({
        isOnline: initialOnline,
        connectionType: resolveConnectionType(initialState),
        error: null,
      });

      // 2. Attach continuous listener
      const subscription = NetInfo.addEventListener(
        (netState: NetInfoState) => {
          const wasOnline = get().isOnline;
          const nowOnline = resolveIsOnline(netState);

          set({
            isOnline: nowOnline,
            connectionType: resolveConnectionType(netState),
          });

          // Phase 4 pre-wire: fire the reconnect callback on offline → online transition
          if (!wasOnline && nowOnline) {
            const callback = get()._onReconnect;
            if (callback) {
              try {
                callback();
              } catch (callbackErr) {
                console.warn(
                  "[useNetworkStore] _onReconnect callback threw:",
                  callbackErr,
                );
              }
            }
          }
        },
      );

      set({ isMonitoring: true, _subscription: subscription });
    } catch (err) {
      const storeError = new NetworkStoreError(
        "MONITORING_START_FAILED",
        "Failed to start network monitoring. Defaulting to optimistic online state.",
        err,
      );
      console.error("[useNetworkStore]", storeError.message, err);
      set({ error: storeError, isMonitoring: false });
    }
  },

  stopMonitoring: () => {
    const { _subscription } = get();
    if (!_subscription) return;

    try {
      _subscription(); // NetInfo unsubscribe is a plain function call
      set({ isMonitoring: false, _subscription: null });
    } catch (err) {
      const storeError = new NetworkStoreError(
        "MONITORING_STOP_FAILED",
        "Failed to cleanly stop network monitoring.",
        err,
      );
      console.warn("[useNetworkStore]", storeError.message, err);
      set({ error: storeError });
    }
  },

  // Phase 4 pre-wire ──────────────────────────────────────────────────────────

  setReconnectCallback: (callback) => {
    set({ _onReconnect: callback });
  },

  setHasPendingSync: (hasPending) => {
    set({ hasPendingSync: hasPending });
  },

  // Utility ──────────────────────────────────────────────────────────────────

  clearError: () => set({ error: null }),
}));

// ─────────────────────────────────────────────
// SELECTOR HOOKS
// Fine-grained selectors prevent unnecessary re-renders.
// Import these in components instead of the full store where possible.
// ─────────────────────────────────────────────

/** True when the device has an active internet connection. */
export const selectIsOnline = (s: NetworkStore) => s.isOnline;

/** Phase 4: true when there are queued scans and the user is back online. */
export const selectHasPendingSync = (s: NetworkStore) => s.hasPendingSync;

/** Full connection type string for diagnostic UI. */
export const selectConnectionType = (s: NetworkStore) => s.connectionType;
