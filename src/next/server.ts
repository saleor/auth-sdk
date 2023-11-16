import type { StorageRepository } from "../types";
import { cookies } from "next/headers";

export const getNextServerCookiesStorage = (): StorageRepository => {
  const cache = new Map<string, string>();
  return {
    getItem(key) {
      // We need to cache the value because cookies() returns stale data
      // if cookies().set(…) is called in the same request.
      return cache.get(key) ?? cookies().get(key)?.value ?? null;
    },
    removeItem(key) {
      cache.delete(key);
      cookies().delete(key);
    },
    setItem(key, value) {
      try {
        cache.set(key, value);
        cookies().set(key, value, { httpOnly: true, sameSite: "lax" });
      } catch {
        // noop
      }
    },
  };
};
