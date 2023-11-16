import { SaleorRefreshTokenStorageHandler } from "./SaleorRefreshTokenStorageHandler";
import { getRequestData, getTokenIss, isExpiredToken } from "./utils";
import type {
  FetchRequestInfo,
  FetchWithAdditionalParams,
  PasswordResetResponse,
  PasswordResetVariables,
  StorageRepository,
  TokenCreateResponse,
  TokenCreateVariables,
  TokenRefreshResponse,
} from "./types";
import { invariant } from "./utils";
import { PASSWORD_RESET, TOKEN_CREATE, TOKEN_REFRESH } from "./mutations";
import cookie from "cookie";
import { SaleorAccessTokenStorageHandler } from "./SaleorAccessTokenStorageHandler";

export interface SaleorAuthClientProps {
  onAuthRefresh?: (isAuthenticating: boolean) => void;
  saleorApiUrl: string;
  refreshTokenStorage?: StorageRepository;
  accessTokenStorage?: StorageRepository;
  tokenGracePeriod?: number;
}

export class SaleorAuthClient {
  // we'll assume a generous time of 2 seconds for api to
  // process our request
  private tokenGracePeriod = 2000;

  private tokenRefreshPromise: null | Promise<Response> = null;
  private onAuthRefresh?: (isAuthenticating: boolean) => void;
  private saleorApiUrl: string;
  /**
   * Persistent storage (for refresh token)
   */
  private refreshTokenStorage: SaleorRefreshTokenStorageHandler | null;

  /**
   * Non-persistent storage for access token
   */
  private acessTokenStorage: SaleorAccessTokenStorageHandler;
  /**
   * Use ths method to clear event listeners from storageHandler
   *  @example
   *  ```jsx
   *  useEffect(() => {
   *    return () => {
   *      SaleorAuthClient.cleanup();
   *    }
   *  }, [])
   *  ```
   */

  constructor({
    saleorApiUrl,
    refreshTokenStorage,
    accessTokenStorage,
    onAuthRefresh,
    tokenGracePeriod,
  }: SaleorAuthClientProps) {
    if (tokenGracePeriod) {
      this.tokenGracePeriod = tokenGracePeriod;
    }
    this.onAuthRefresh = onAuthRefresh;
    this.saleorApiUrl = saleorApiUrl;

    const refreshTokenRepo =
      refreshTokenStorage || (typeof window !== "undefined" ? window.localStorage : undefined);
    this.refreshTokenStorage = refreshTokenRepo
      ? new SaleorRefreshTokenStorageHandler(refreshTokenRepo, saleorApiUrl)
      : null;

    const accessTokenRepo = accessTokenStorage ?? getInMemoryAccessTokenStorage();
    this.acessTokenStorage = new SaleorAccessTokenStorageHandler(accessTokenRepo, saleorApiUrl);
  }

  cleanup = () => {
    this.refreshTokenStorage?.cleanup();
  };

  private runAuthorizedRequest: FetchWithAdditionalParams = (input, init, additionalParams) => {
    // technically we run this only when token is there
    // but just to make typescript happy
    const token = this.acessTokenStorage.getAccessToken();
    if (!token) {
      return fetch(input, init);
    }

    const headers = init?.headers || {};

    const getURL = (input: FetchRequestInfo) => {
      if (typeof input === "string") {
        return input;
      } else if ("url" in input) {
        return input.url;
      } else {
        return input.href;
      }
    };

    const iss = getTokenIss(token);
    const issuerAndDomainMatch = getURL(input) === iss;
    const shouldAddAuthorizationHeader =
      issuerAndDomainMatch || additionalParams?.allowPassingTokenToThirdPartyDomains;

    if (!issuerAndDomainMatch) {
      if (shouldAddAuthorizationHeader) {
        console.warn(
          "Token's `iss` and request URL do not match but `allowPassingTokenToThirdPartyDomains` was specified.",
        );
      } else {
        console.warn(
          "Token's `iss` and request URL do not match. Not adding `Authorization` header to the request.",
        );
      }
    }

    return fetch(input, {
      ...init,
      headers: shouldAddAuthorizationHeader ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    });
  };

  private handleRequestWithTokenRefresh: FetchWithAdditionalParams = async (
    input,
    init,
    additionalParams,
  ) => {
    const refreshToken = this.refreshTokenStorage?.getRefreshToken();

    invariant(refreshToken, "Missing refresh token in token refresh handler");

    const accessToken = this.acessTokenStorage.getAccessToken();

    // the refresh already finished, proceed as normal
    if (accessToken && !isExpiredToken(accessToken, this.tokenGracePeriod)) {
      console.log("Not expired, proceed");
      return this.fetchWithAuth(input, init, additionalParams);
    }

    this.onAuthRefresh?.(true);

    // if the promise is already there, use it
    if (this.tokenRefreshPromise) {
      console.log("Token refresh promise already exists, wait for it");
      const response = await this.tokenRefreshPromise;

      const res = (await response.clone().json()) as TokenRefreshResponse;
      console.log(res);

      const {
        errors: graphqlErrors,
        data: {
          tokenRefresh: { errors, token },
        },
      } = res;

      this.onAuthRefresh?.(false);

      if (errors?.length || graphqlErrors?.length || !token) {
        this.tokenRefreshPromise = null;
        this.refreshTokenStorage?.clearAuthStorage();
        return fetch(input, init);
      }

      this.refreshTokenStorage?.setAuthState("signedIn");
      const a = this.acessTokenStorage.getAccessToken();
      this.acessTokenStorage.setAccessToken(token);
      const b = this.acessTokenStorage.getAccessToken();
      console.log(a === b);
      console.log(a === token);
      console.log(b === token);
      this.tokenRefreshPromise = null;
      return this.runAuthorizedRequest(input, init, additionalParams);
    }

    // this is the first failed request, initialize refresh
    console.log("Initialize token refresh");
    this.tokenRefreshPromise = fetch(this.saleorApiUrl, getRequestData(TOKEN_REFRESH, { refreshToken }));
    return this.fetchWithAuth(input, init, additionalParams);
  };

  private handleSignIn = async <TOperation extends TokenCreateResponse | PasswordResetResponse>(
    response: Response,
  ): Promise<TOperation> => {
    const readResponse = (await response.json()) as TOperation;

    const responseData =
      "tokenCreate" in readResponse.data ? readResponse.data.tokenCreate : readResponse.data.setPassword;

    if (!responseData) {
      return readResponse;
    }

    const { errors, token, refreshToken } = responseData;

    if (!token || errors.length) {
      this.refreshTokenStorage?.setAuthState("signedOut");
      return readResponse;
    }

    if (token) {
      this.acessTokenStorage.setAccessToken(token);
    }

    if (refreshToken) {
      this.refreshTokenStorage?.setRefreshToken(refreshToken);
    }

    this.refreshTokenStorage?.setAuthState("signedIn");
    return readResponse;
  };

  /**
   * @param additionalParams
   * @param additionalParams.allowPassingTokenToThirdPartyDomains if set to true, the `Authorization` header will be added to the request even if the token's `iss` and request URL do not match
   */
  fetchWithAuth: FetchWithAdditionalParams = async (input, init, additionalParams) => {
    const refreshToken = this.refreshTokenStorage?.getRefreshToken();
    console.log({ refreshToken });

    let accessToken = this.acessTokenStorage.getAccessToken();
    console.log({ accessToken });
    if (!accessToken) {
      if (typeof document !== "undefined") {
        const tokenFromCookie = cookie.parse(document.cookie).token ?? null;
        if (tokenFromCookie) {
          this.acessTokenStorage.setAccessToken(tokenFromCookie);
          accessToken = tokenFromCookie;
        }
        document.cookie = cookie.serialize("token", "", { expires: new Date(0), path: "/" });
      }
    }

    // access token is fine, add it to the request and proceed
    if (accessToken && !isExpiredToken(accessToken, this.tokenGracePeriod)) {
      console.log("Not expired, proceed");
      return this.runAuthorizedRequest(input, init, additionalParams);
    }

    // refresh token exists, try to authenticate if possible
    if (refreshToken) {
      console.log("Refresh token exists, try to authenticate");
      return this.handleRequestWithTokenRefresh(input, init, additionalParams);
    }

    // any regular mutation, no previous sign in, proceed
    console.log("No refresh token, proceed");
    return fetch(input, init);
  };

  resetPassword = async (variables: PasswordResetVariables) => {
    const response = await fetch(this.saleorApiUrl, getRequestData(PASSWORD_RESET, variables));

    return this.handleSignIn<PasswordResetResponse>(response);
  };

  signIn = async (variables: TokenCreateVariables) => {
    const response = await fetch(this.saleorApiUrl, getRequestData(TOKEN_CREATE, variables));

    return this.handleSignIn<TokenCreateResponse>(response);
  };

  signOut = () => {
    this.acessTokenStorage.clearAuthStorage();
    this.refreshTokenStorage?.clearAuthStorage();
    if (typeof document !== "undefined") {
      document.cookie = cookie.serialize("token", "", {
        expires: new Date(0),
        path: "/",
      });
    }
  };
}

export const createSaleorAuthClient = (props: SaleorAuthClientProps) => new SaleorAuthClient(props);

function getInMemoryAccessTokenStorage(): StorageRepository {
  let accessToken: string | null = null;
  return {
    getItem() {
      return accessToken;
    },
    removeItem() {
      return (accessToken = null);
    },
    setItem(_key, value) {
      return (accessToken = value);
    },
  };
}
