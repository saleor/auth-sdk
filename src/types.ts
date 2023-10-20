export type Fetch = typeof fetch;
export type FetchRequestInfo = Parameters<Fetch>[0];
export type FetchRequestInit = Parameters<Fetch>[1];
export type FetchWithAdditionalParams = (
  input: FetchRequestInfo,
  init?: FetchRequestInit,
  additionalParams?: {
    allowPassingTokenToThirdPartyDomains?: boolean;
  },
) => Promise<Response>;

export interface TokenCreateVariables {
  email: string;
  password: string;
}

interface GraphQLError {
  message: string;
}

export interface TokenCreateResponse {
  data: {
    tokenCreate: {
      token: string | undefined;
      refreshToken: string | undefined;
      errors: GraphQLError[];
    };
  };
}

export interface TokenRefreshVariables {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  errors?: unknown[];
  data: {
    tokenRefresh: {
      token: string | undefined;
      errors?: GraphQLError[];
    };
  };
}

export interface PasswordResetVariables {
  email: string;
  password: string;
  token: string;
}

export interface PasswordResetResponse {
  data: {
    setPassword: {
      token: string | undefined;
      refreshToken: string | undefined;
      errors: GraphQLError[];
    };
  };
}

export interface ExternalAuthenticationURLResponse {
  externalAuthenticationUrl: {
    authenticationData: string;
    errors: GraphQLError[];
  };
}

export interface ExternalAuthenticationURLVariables {
  pluginId: string;
  input: string;
}

export interface ExternalObtainAccessToken {
  token: string;
  refreshToken: string;
  csrfToken: string;
  user: unknown;
}

export interface ExternalObtainAccessTokenResponse {
  externalObtainAccessTokens: ExternalObtainAccessToken;
}

export interface ExternalObtainAccessTokenVariables {
  pluginId: string;
  input: string;
}

export enum ExternalProvider {
  OpenIDConnect = "mirumee.authentication.openidconnect",
  SaleorCloud = "cloud_auth.CloudAuthorizationPlugin",
}
