import type { StorageRepository } from "../types";
import { cookies } from "next/headers";

export const getNextServerCookiesStorage = (options: { secure?: boolean } = {}): StorageRepository => {
  const secure = options.secure ?? true;

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
        const expires = tryGetExpFromJwt(value);
        cookies().set(key, value, { httpOnly: true, sameSite: "lax", secure, expires });
      } catch {
        // noop
      }
    },
  };
};

/**
 * This function assumes that the token is a JWT and gets the expiration date from it.
 * It silences all errors and returns undefined instead.
 */
const tryGetExpFromJwt = (token: string) => {
  try {
    const exp = (JSON.parse(atob(token.split(".")[1] ?? "")) as { exp?: unknown }).exp;
    const nowInSeconds = Date.now() / 1000;
    if (exp && typeof exp === "number" && exp > nowInSeconds) {
      return new Date(exp * 1000);
    }
  } catch {
    // silence is golden
  }
  return undefined;
};
