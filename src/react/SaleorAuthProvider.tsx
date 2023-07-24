import { PropsWithChildren } from "react";
import { Provider } from "./context";
import { SaleorAuthClient } from "../SaleorAuthClient";

export const SaleorAuthProvider = ({ children, client }: PropsWithChildren<{ client: SaleorAuthClient }>) => {
  const { signIn, signOut, resetPassword } = client;

  return <Provider value={{ signIn, signOut, resetPassword }}>{children}</Provider>;
};
