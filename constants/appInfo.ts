import Constants from "expo-constants";

/**
 * Octop server release this client is pinned and smoke-verified against
 * (docs/api-contract.md). Bump together with the contract, not separately.
 */
export const OCTOP_SERVER_VERSION = "0.9.32";

/** App version from app.json, rendered in Settings / About (designs 19/21). */
export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
