export type Fetch = typeof fetch;

export interface TokenCreateVariables {
  email: string;
  password: string;
}

export interface TokenCreateResponse {
  data: {
    tokenCreate: {
      token: string | undefined;
      refreshToken: string | undefined;
      errors: any[];
    };
  };
}

export interface TokenRefreshVariables {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  errors?: any[];
  data: {
    tokenRefresh: {
      token: string | undefined;
      errors?: any[];
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
      errors: any[];
    };
  };
}

export enum ExternalProvider {
  OpenIDConnect = "mirumee.authentication.openidconnect",
  SaleorCloud = "cloud_auth.CloudAuthorizationPlugin",
}
