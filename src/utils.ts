import { TypedDocumentString } from "./graphql";

const MILLI_MULTIPLYER = 1000;

interface TokenData {
  iat: number;
  owner: string;
  iss: string;
  exp: number;
  token: string;
  email: string;
  type: "access" | "refresh";
  user_id: string;
  is_staff: boolean;
}

const decodeToken = (token: string): { exp: number; iss: string } => {
  const tokenParts = token.split(".");
  const decodedTokenData = Buffer.from(tokenParts[1] || "", "base64").toString();
  const parsedTokenData = JSON.parse(decodedTokenData) as TokenData;
  return parsedTokenData;
};

// returns timestamp
const getTokenExpiry = (token: string): number => {
  const parsedTokenData = decodeToken(token);
  // because api returns seconds, but Date.now() works in millis
  return parsedTokenData.exp * MILLI_MULTIPLYER || 0;
};

export const getTokenIss = (token: string): string => {
  const parsedTokenData = decodeToken(token);
  return parsedTokenData.iss;
};

export const isExpiredToken = (token: string, tokenGracePeriod: number) => {
  return getTokenExpiry(token) - tokenGracePeriod <= Date.now();
};

// query here is document node but because of graphql-tag using
// a different version of graphql and pnpm overrides not working
// https://github.com/pnpm/pnpm/issues/4097
// we're gonna do this instead
export const getRequestData = <TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
  requestInit?: Partial<RequestInit>,
) => ({
  ...requestInit,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    query,
    variables,
  }),
});

export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new InvariantError(`Invariant Violation: ${message || ""}`);
  }
}
