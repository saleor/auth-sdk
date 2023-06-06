import { useState, useEffect } from "react";
import { SaleorExternalAuth } from "../SaleorExternalAuth";
import { ExternalProvider } from "../types";

export type SaleorExternalAuthState =
  | { loading: true; authURL?: undefined; error?: undefined }
  | { loading: false; authURL: string; error?: undefined }
  | { loading: false; authURL?: undefined; error: unknown };

export const useSaleorExternalAuth = ({
  saleorURL,
  provider,
  redirectURL,
}: {
  saleorURL: string;
  provider: ExternalProvider;
  redirectURL: string;
}) => {
  const [state, setState] = useState<SaleorExternalAuthState>({
    authURL: undefined,
    error: undefined,
    loading: true,
  });

  useEffect(() => {
    const triggerExternalAuth = async () => {
      try {
        const auth = new SaleorExternalAuth(saleorURL, provider);
        const result = await auth.initiate({ redirectURL });

        setState({ authURL: result, loading: false });
      } catch (error) {
        if (error instanceof Error) {
          setState({ loading: false, error: error.message });
        } else {
          setState({ loading: false, error: "Unknown error" });
        }
      }
    };

    triggerExternalAuth();
  }, [saleorURL]);

  return state;
};
