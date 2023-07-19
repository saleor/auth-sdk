import { UseSaleorAuthClient } from "./useSaleorAuthClient";
import { PropsWithChildren } from "react";
import { invariant } from "../utils";
import { Provider } from "./context";

export const SaleorAuthProvider = ({
  children,
  saleorAuthClient,
  isAuthenticating,
}: PropsWithChildren<UseSaleorAuthClient>) => {
  invariant(
    saleorAuthClient,
    "Missing Saleor Auth Client - are you sure you created it using useSaleorAuthClient?",
  );

  const { signIn, signOut, resetPassword } = saleorAuthClient;

  return <Provider value={{ isAuthenticating, signIn, signOut, resetPassword }}>{children}</Provider>;
};
