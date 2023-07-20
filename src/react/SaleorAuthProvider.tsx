import { PropsWithChildren } from "react";
import { invariant } from "../utils";
import { Provider } from "./context";
import { SaleorAuthClient } from "../SaleorAuthClient";

export const SaleorAuthProvider = ({
  children,
  client,
}: PropsWithChildren<{ client: SaleorAuthClient }>) => {
  invariant(
    client,
    "Missing Saleor Auth Client - are you sure you created it using useSaleorAuthClient?",
  );

  const { signIn, signOut, resetPassword } = client;

  return <Provider value={{ signIn, signOut, resetPassword }}>{children}</Provider>;
};
