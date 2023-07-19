import { SaleorAuthStorageHandler } from "./SaleorAuthStorageHandler";
import { getRequestData, getTokenIss, isExpiredToken } from "./utils";
import {
  Fetch,
  PasswordResetResponse,
  PasswordResetVariables,
  TokenCreateResponse,
  TokenCreateVariables,
  TokenRefreshResponse,
} from "./types";
import { invariant } from "./utils";
import { PASSWORD_RESET, TOKEN_CREATE, TOKEN_REFRESH } from "./mutations";
import cookie from "cookie";

export interface SaleorAuthClientProps {
  onAuthRefresh?: (isAuthenticating: boolean) => void;
  saleorApiUrl: string;
  storage?: Storage;
}

export class SaleorAuthClient {
  private accessToken: string | null = null;
  private tokenRefreshPromise: null | Promise<Response> = null;
  private onAuthRefresh?: (isAuthenticating: boolean) => void;
  private saleorApiUrl: string;
  private storageHandler: SaleorAuthStorageHandler | null;
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

  constructor({ saleorApiUrl, storage, onAuthRefresh }: SaleorAuthClientProps) {
    this.storageHandler = storage ? new SaleorAuthStorageHandler(storage, saleorApiUrl) : null;
    this.onAuthRefresh = onAuthRefresh;
    this.saleorApiUrl = saleorApiUrl;
  }

  cleanup = () => {
    this.storageHandler?.cleanup();
  };

  private runAuthorizedRequest: Fetch = (input, init) => {
    // technically we run this only when token is there
    // but just to make typescript happy
    if (!this.accessToken) {
      return fetch(input, init);
    }

    const headers = init?.headers || {};

    const iss = getTokenIss(this.accessToken);
    const shouldAddAuthHeader = input.toString() === iss;

    return fetch(input, {
      ...init,
      headers: shouldAddAuthHeader
        ? { ...headers, Authorization: `Bearer ${this.accessToken}` }
        : headers,
    });
  };

  private handleRequestWithTokenRefresh: Fetch = async (input, init) => {
    const refreshToken = this.storageHandler?.getRefreshToken();

    invariant(refreshToken, "Missing refresh token in token refresh handler");

    // the refresh already finished, proceed as normal
    if (this.accessToken) {
      return this.fetchWithAuth(input, init);
    }

    this.onAuthRefresh?.(true);

    // if the promise is already there, use it
    if (this.tokenRefreshPromise) {
      const response = await this.tokenRefreshPromise;

      const res: TokenRefreshResponse = await response.clone().json();

      const {
        errors: graphqlErrors,
        data: {
          tokenRefresh: { errors, token },
        },
      } = res;

      this.onAuthRefresh?.(false);

      if (errors?.length || graphqlErrors?.length || !token) {
        this.tokenRefreshPromise = null;
        this.storageHandler?.clearAuthStorage();
        return fetch(input, init);
      }

      this.storageHandler?.setAuthState("signedIn");
      this.accessToken = token;
      this.tokenRefreshPromise = null;
      return this.runAuthorizedRequest(input, init);
    }

    // this is the first failed request, initialize refresh
    this.tokenRefreshPromise = fetch(
      this.saleorApiUrl,
      getRequestData(TOKEN_REFRESH, { refreshToken }),
    );
    return this.fetchWithAuth(input, init);
  };

  private handleSignIn = async <TOperation extends TokenCreateResponse | PasswordResetResponse>(
    response: Response,
  ): Promise<TOperation> => {
    const readResponse: TOperation = await response.json();

    const responseData =
      "tokenCreate" in readResponse.data
        ? readResponse.data.tokenCreate
        : readResponse.data.setPassword;

    if (!responseData) {
      return readResponse;
    }

    const { errors, token, refreshToken } = responseData;

    if (!token || errors.length) {
      this.storageHandler?.setAuthState("signedOut");
      return readResponse;
    }

    if (token) {
      this.accessToken = token;
    }

    if (refreshToken) {
      this.storageHandler?.setRefreshToken(refreshToken);
    }

    this.storageHandler?.setAuthState("signedIn");
    return readResponse;
  };

  fetchWithAuth: Fetch = async (input, init) => {
    const refreshToken = this.storageHandler?.getRefreshToken();

    if (!this.accessToken) {
      this.accessToken = cookie.parse(document.cookie).token;
      document.cookie = cookie.serialize("token", "", { expires: new Date(0), path: "/" });
    }

    // access token is fine, add it to the request and proceed
    if (this.accessToken && !isExpiredToken(this.accessToken)) {
      return this.runAuthorizedRequest(input, init);
    }

    // refresh token exists, try to authenticate if possible
    if (refreshToken) {
      return this.handleRequestWithTokenRefresh(input, init);
    }

    // any regular mutation, no previous sign in, proceed
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
    this.accessToken = null;
    this.storageHandler?.clearAuthStorage();
    document.cookie = cookie.serialize("token", "", { expires: new Date(0), path: "/" });
  };
}
