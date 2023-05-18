import { Fetch } from "../types";
import * as Apollo from "@apollo/client";
import { useMemo } from "react";

type Options = {
  uri: string;
  fetchWithAuth: Fetch;
  typePolicies?: Apollo.TypePolicies;
}

const { ApolloClient, createHttpLink, InMemoryCache } = Apollo;

// for static geenration of pages, we don't need auth there
export const createServerSideApolloClient = ({ uri, typePolicies }: Omit<Options, 'fetchWithAuth'>) => new ApolloClient({
  link: createHttpLink({ uri }),
  cache: new InMemoryCache({ typePolicies }),
  ssrMode: true,
});

export const useAuthenticatedApolloClient = ({ uri, fetchWithAuth: fetch, typePolicies }: Options) => {
  const httpLink = createHttpLink({ uri, fetch });

  const apolloClient = useMemo(() =>
    new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache({ typePolicies }),
    }),
    []
  );

  return {
    apolloClient,
    reset: () => apolloClient.resetStore(),
    refetch: () => apolloClient.refetchQueries({ include: "active" }),
  };
};
