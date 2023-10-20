import type { PropsWithChildren } from "react";
import { Provider } from "./context";
import { SaleorAuthClient } from "../SaleorAuthClient";

export const SaleorAuthProvider = ({ children, client }: PropsWithChildren<{ client: SaleorAuthClient }>) => {
  return <Provider value={client}>{children}</Provider>;
};
