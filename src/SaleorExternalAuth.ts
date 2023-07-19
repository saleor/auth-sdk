import { ExternalAuthenticationURL, ExternalObtainAccessTokens } from "./mutations";
import { ExternalProvider } from "./types";
import { getRequestData } from "./utils";
import { TypedDocumentNode } from "urql";

interface RedirectData {
  code: string;
  state: string;
}

type GraphQLResponse<TResult> = { data: TResult } | { errors: { message: string }[] };

export class SaleorExternalAuth {
  constructor(
    private saleorURL: string,
    private provider: ExternalProvider,
  ) {}

  async makePOSTRequest<TResult, TVariables>(
    query: TypedDocumentNode<TResult, TVariables>,
    variables: TVariables,
  ) {
    const response = await fetch(this.saleorURL, getRequestData(query, variables));

    const result = (await response.json()) as GraphQLResponse<TResult>;

    if ("errors" in result) {
      console.error(result.errors[0].message);
      throw new Error(result.errors[0].message);
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

    const { authorizationUrl } = JSON.parse(data) as { authorizationUrl: string };

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
