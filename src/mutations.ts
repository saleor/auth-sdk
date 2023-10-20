import { TypedDocumentString } from "./graphql";
import type {
  ExternalAuthenticationURLResponse,
  ExternalAuthenticationURLVariables,
  ExternalObtainAccessTokenResponse,
  ExternalObtainAccessTokenVariables,
  PasswordResetResponse,
  PasswordResetVariables,
  TokenCreateResponse,
  TokenCreateVariables,
  TokenRefreshResponse,
  TokenRefreshVariables,
} from "./types";

export const accountErrorFragment = /* graphql */ `
  fragment AccountErrorFragment on AccountError {
    code
    field
    message
  }
`;

export const TOKEN_REFRESH = new TypedDocumentString<
  TokenRefreshResponse,
  TokenRefreshVariables
>(/* graphql */ `
  ${accountErrorFragment}
  mutation refreshToken($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors {
        ...AccountErrorFragment
      }
    }
  }
`);

export const TOKEN_CREATE = new TypedDocumentString<TokenCreateResponse, TokenCreateVariables>(/* graphql */ `
  mutation tokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      errors {
        message
        field
        code
      }
    }
  }
`);

export const PASSWORD_RESET = new TypedDocumentString<
  PasswordResetResponse,
  PasswordResetVariables
>(/* graphql */ `
  mutation passwordReset($email: String!, $password: String!, $token: String!) {
    setPassword(email: $email, password: $password, token: $token) {
      token
      refreshToken
      errors {
        message
        field
        code
      }
    }
  }
`);

export const ExternalAuthenticationURL = new TypedDocumentString<
  ExternalAuthenticationURLResponse,
  ExternalAuthenticationURLVariables
>(/* graphql */ `
  mutation externalAuthenticationUrl($pluginId: String!, $input: JSONString!) {
    externalAuthenticationUrl(pluginId: $pluginId, input: $input) {
      authenticationData
      errors {
        code
        field
        message
      }
    }
  }
`);

export const ExternalObtainAccessTokens = new TypedDocumentString<
  ExternalObtainAccessTokenResponse,
  ExternalObtainAccessTokenVariables
>(/* graphql */ `
  mutation AuthObtainAccessToken($pluginId: String!, $input: JSONString!) {
    externalObtainAccessTokens(pluginId: $pluginId, input: $input) {
      token
      refreshToken
      user {
        id
        email
      }
      errors {
        field
        code
        message
      }
    }
  }
`);
