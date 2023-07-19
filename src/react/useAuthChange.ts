import { useEffect } from "react";
import { SaleorAuthEvent, getStorageAuthEventKey } from "../SaleorAuthStorageHandler";

interface UseAuthChangeProps {
  saleorApiUrl: string;
  onSignedIn?: () => void;
  onSignedOut?: () => void;
}

// used to handle client cache invalidation on login / logout and when
// token refreshin fails
export const useAuthChange = ({ saleorApiUrl, onSignedOut, onSignedIn }: UseAuthChangeProps) => {
  const handleAuthChange = (event: SaleorAuthEvent) => {
    const isCustomAuthEvent = event?.type === getStorageAuthEventKey(saleorApiUrl);

    if (!isCustomAuthEvent) {
      return;
    }

    const { authState } = event.detail;

    if (authState === "signedIn") {
      onSignedIn?.();
    } else if (authState === "signedOut") {
      onSignedOut?.();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // for current window
    window.addEventListener(getStorageAuthEventKey(saleorApiUrl), handleAuthChange as EventListener);

    return () => {
      window.removeEventListener(getStorageAuthEventKey(saleorApiUrl), handleAuthChange as EventListener);
    };
  }, []);
};
