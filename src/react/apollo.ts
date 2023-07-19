import { Fetch } from "../types";
import * as Apollo from "@apollo/client";
import { useMemo } from "react";

interface Options {
  uri: string;
  fetchWithAuth: Fetch;
  typePolicies?: Apollo.TypePolicies;
}

const { ApolloClient, createHttpLink, InMemoryCache } = Apollo;

export const useAuthenticatedApolloClient = ({ uri, fetchWithAuth: fetch, typePolicies }: Options) => {
  const httpLink = createHttpLink({ uri, fetch });

  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache({ typePolicies }),
      }),
    [],
  );

  return {
    apolloClient,
    reset: () => apolloClient.resetStore(),
    refetch: () => apolloClient.refetchQueries({ include: "active" }),
  };
};
