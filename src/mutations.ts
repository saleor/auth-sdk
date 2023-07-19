import gql from "graphql-tag";

export const accountErrorFragment = gql`
  fragment AccountErrorFragment on AccountError {
    code
    field
    message
  }
`;

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
`;

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
`;

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
`;

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
`;

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
`;
