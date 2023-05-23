/* auth state when user signs in / out */
export const getStorageAuthEventKey = (prefix?: string) =>
  [prefix, "saleor_storage_auth_change"].filter(Boolean).join("+");
export const getStorageAuthStateKey = (prefix?: string) =>
  [prefix, "saleor_auth_module_auth_state"].filter(Boolean).join("+");
export const getRefreshTokenKey = (prefix?: string) =>
  [prefix, "saleor_auth_module_refresh_token"].filter(Boolean).join("+");

export type AuthState = "signedIn" | "signedOut";

export type SaleorAuthEvent = CustomEvent<{ authState: AuthState }>;

export class SaleorAuthStorageHandler {
  constructor(private storage: Storage, private prefix?: string) {
    window.addEventListener("storage", this.handleStorageChange);
  }

  private handleStorageChange = (event: StorageEvent) => {
    const { oldValue, newValue, type, key } = event;

    if (
      oldValue === newValue ||
      type !== "storage" ||
      key !== getStorageAuthStateKey(this.prefix)
    ) {
      return;
    }

    this.sendAuthStateEvent(newValue as AuthState);
  };

  cleanup = () => {
    window.removeEventListener("storage", this.handleStorageChange);
  };

  /* auth state */
  sendAuthStateEvent = (authState: AuthState) => {
    const event = new CustomEvent(getStorageAuthEventKey(this.prefix), { detail: { authState } });
    window.dispatchEvent(event);
  };

  getAuthState = (): AuthState =>
    (this.storage.getItem(getStorageAuthStateKey(this.prefix)) as AuthState | undefined) ||
    "signedOut";

  setAuthState = (authState: AuthState) => {
    this.storage.setItem(getStorageAuthStateKey(this.prefix), authState);
    this.sendAuthStateEvent(authState);
  };

  /* refresh token */
  getRefreshToken = () => this.storage.getItem(getRefreshTokenKey(this.prefix)) || null;

  setRefreshToken = (token: string) => {
    this.storage.setItem(getRefreshTokenKey(this.prefix), token);
  };

  /* performed on logout */
  clearAuthStorage = () => {
    this.setAuthState("signedOut");
    this.storage.removeItem(getRefreshTokenKey(this.prefix));
  };
}
