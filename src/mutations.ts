import gql from "graphql-tag";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { ExternalAuthenticationURLResponse, ExternalAuthenticationURLVariables, ExternalObtainAccessTokenResponse, ExternalObtainAccessTokenVariables, PasswordResetResponse, PasswordResetVariables, TokenCreateResponse, TokenCreateVariables, TokenRefreshResponse, TokenRefreshVariables } from "./types";

export const accountErrorFragment = gql`
  fragment AccountErrorFragment on AccountError {
    code
    field
    message
  }
` as TypedDocumentNode;

export const TOKEN_REFRESH = gql`
  ${accountErrorFragment}
  mutation refreshToken($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors {
        ...AccountErrorFragment
      }
    }
  }
` as TypedDocumentNode<TokenRefreshResponse, TokenRefreshVariables>;

export const TOKEN_CREATE = gql`
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
` as TypedDocumentNode<TokenCreateResponse, TokenCreateVariables>;

export const PASSWORD_RESET = gql`
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
` as TypedDocumentNode<PasswordResetResponse, PasswordResetVariables>;

export const ExternalAuthenticationURL = gql`
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
` as TypedDocumentNode<ExternalAuthenticationURLResponse, ExternalAuthenticationURLVariables>;

export const ExternalObtainAccessTokens = gql`
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
` as TypedDocumentNode<ExternalObtainAccessTokenResponse, ExternalObtainAccessTokenVariables>;
