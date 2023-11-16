import type { StorageRepository } from "./types";

export const getAccessTokenKey = (prefix?: string) =>
  [prefix, "saleor_auth_access_token"].filter(Boolean).join("+");

export class SaleorAccessTokenStorageHandler {
  constructor(
    private storage: StorageRepository,
    private prefix?: string,
  ) {}

  /* Access token */
  getAccessToken = () => {
    const key = getAccessTokenKey(this.prefix);
    return this.storage.getItem(key);
  };

  setAccessToken = (token: string) => {
    const key = getAccessTokenKey(this.prefix);
    return this.storage.setItem(key, token);
  };

  clearAuthStorage = () => {
    const key = getAccessTokenKey(this.prefix);
    return this.storage.removeItem(key);
  };
}
