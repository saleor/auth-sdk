import gql from "graphql-tag";
import { ExternalAuthenticationURL, ExternalObtainAccessTokens } from "./mutations";
import { ExternalProvider } from "./types";
import { getRequestData } from "./utils";

type RedirectData = {
  code: string;
  state: string;
};

export type ExternalObtainAccessToken = {
  token: string;
  refreshToken: string;
  csrfToken: string;
  user: unknown;
};

export type ExternalObtainAccessTokenResponse = { data: ExternalObtainAccessToken } | { errors: any[] };

export class SaleorExternalAuth {
  constructor(
    private saleorURL: string,
    private provider: ExternalProvider,
  ) {}

  async makePOSTRequest(query: ReturnType<typeof gql>, variables: object) {
    const response = await fetch(this.saleorURL, getRequestData(query, variables));

    const result = await response.json();

    if ("errors" in result) {
      console.error(result.errors[0].message);
      return null;
    }

    return result.data;
  }

  async initiate({ redirectURL }: { redirectURL: string }) {
    const {
      externalAuthenticationUrl: { authenticationData: data, errors },
    } = await this.makePOSTRequest(ExternalAuthenticationURL, {
      pluginId: this.provider,
      input: JSON.stringify({ redirectUri: redirectURL }),
    });

    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    const { authorizationUrl } = JSON.parse(data);

    return authorizationUrl;
  }

  async obtainAccessToken({ code, state }: RedirectData) {
    const { externalObtainAccessTokens: data } = await this.makePOSTRequest(ExternalObtainAccessTokens, {
      pluginId: this.provider,
      input: JSON.stringify({ code, state }),
    });

    return data;
  }
}
