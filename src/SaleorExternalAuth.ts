import { TypedDocumentString } from "./graphql";
import { ExternalAuthenticationURL, ExternalObtainAccessTokens } from "./mutations";
import { ExternalProvider } from "./types";
import { getRequestData } from "./utils";

interface RedirectData {
  code: string;
  state: string;
}

interface GraphQLErrorResponse {
  errors: readonly {
    message: string;
  }[];
}

type GraphQLResponse<T> = { data: T } | GraphQLErrorResponse;

export class GraphQLError extends Error {
  constructor(public errorResponse: GraphQLErrorResponse) {
    const message = errorResponse.errors.map((error) => error.message).join("\n");
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SaleorExternalAuth {
  constructor(
    private saleorURL: string,
    private provider: ExternalProvider,
  ) {}

  async makePOSTRequest<TResult, TVariables>(
    query: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
  ) {
    const response = await fetch(this.saleorURL, getRequestData(query, variables));

    const result = (await response.json()) as GraphQLResponse<TResult>;

    if ("errors" in result) {
      console.error(result.errors);
      throw new GraphQLError(result);
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
      console.error({ errors });
      throw new GraphQLError({ errors });
    }

    const { authorizationUrl } = JSON.parse(data) as {
      authorizationUrl: string;
    };

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
