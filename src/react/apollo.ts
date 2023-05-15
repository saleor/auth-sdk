import { Fetch } from "../types";
import * as Apollo from "@apollo/client";
import { useMemo } from "react";

type Options = {
  url: string;
  fetchWithAuth: Fetch;
}

const { ApolloClient, createHttpLink, InMemoryCache } = Apollo;

// for static geenration of pages, we don't need auth there
export const createServerSideApolloClient = (uri: string) => new ApolloClient({
  link: createHttpLink({ uri }),
  cache: new InMemoryCache({}),
  ssrMode: true,
});

export const useAuthenticatedApolloClient = (opts: Options) => {
  const httpLink = createHttpLink({
    uri: opts.url,
    fetch: opts.fetchWithAuth,
  });

  const apolloClient = useMemo(() =>
    new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache({}),
    }),
    []
  );

  return { apolloClient, resetClient: () => apolloClient.resetStore() };
};
