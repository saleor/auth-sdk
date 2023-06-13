<div align="center">
  <img width="150" alt="" src="https://github.com/saleor/auth-sdk/assets/1338731/c90a73d0-5ef1-4d09-9347-c5d02cd7244d">
</div>

<div align="center">
  <h1>Saleor Auth SDK</h1>

  <p>Saleor Auth SDK is the seamless integration of secure and customizable authentication and authorization functionalities into Saleor-powered e-commerce applications.</p>
</div>

<div align="center">
  <a href="https://docs.saleor.io/docs/3.x/api-usage/authentication">Docs</a> 
  | <a href="https://www.npmjs.com/package/@saleor/auth-sdk">npm</a>
</div>

## Usage

### Next.js (Pages Router) with [Apollo Client](https://www.apollographql.com/docs/react/)

<details>
  <summary>Step-by-step video tutorial</summary>

Check the following [step-by-step video](https://www.youtube.com/watch?v=t6nxBk7JHCw) guide on how to set this up.
[![Saleor Auth with Next.js](https://img.youtube.com/vi/t6nxBk7JHCw/0.jpg)](https://www.youtube.com/watch?v=t6nxBk7JHCw)

</details>

When using Next.js (Pages Router) along with [Apollo Client](https://www.apollographql.com/docs/react/), there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<SaleorAuthProvider>` and `<ApolloProvider>`.

`<SaleorAuthProvider>` comes from our React.js-auth package, located at `@saleor/auth-sdk/react`, and it needs to be set up with the output of `useSaleorAuthClient`.

The `<ApolloProvider>` comes from `@apollo/client` and it needs the live GraphQL client instance, which is enhanced with the authenticated `fetch`. This `fetch` is also an output of `useSaleorAuthClient` and available as `fetchWithAuth`.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";

import { SaleorAuthProvider, useAuthChange, useSaleorAuthClient } from "@saleor/auth-sdk/react";
import { useAuthenticatedApolloClient } from "@saleor/auth-sdk/react/apollo";

const SaleorURL = "<your Saleor API URL>";

export default function App({ Component, pageProps }: AppProps) {
  const saleorAuth = useSaleorAuthClient({ saleorApiUrl: SaleorURL });

  const { apolloClient, reset, refetch } = useAuthenticatedApolloClient({
    uri: SaleorURL,
    fetchWithAuth: saleorAuth.saleorAuthClient.fetchWithAuth,
  });

  useAuthChange({
    saleorApiUrl: SaleorURL,
    onSignedOut: () => reset(),
    onSignedIn: () => refetch(),
  });

  return (
    <SaleorAuthProvider {...saleorAuth}>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SaleorAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`, `isAuthenticatin`) provided by the `useSaleorAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```ts
const { signIn, signOut, isAuthenticating } = useSaleorAuthContext();
```

```ts
const response = await signIn({
  email: "example@mail.com",
  passowrd: "password",
});
```

### Next.js (Pages Router) with [urql](https://formidable.com/open-source/urql/)

When using Next.js (Pages Router) along with [urql](https://formidable.com/open-source/urql/) client, there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<SaleorAuthProvider>` and `<Provider>`.

`<SaleorAuthProvider>` comes from our React.js-auth package, located at `@saleor/auth-sdk/react`, and it needs to be set up with the output of `useSaleorAuthClient`.

The `<Provider>` comes from `urql` and it needs the GraphQL client instance, which is enhanced with the authenticated `fetch`. This `fetch` is also an output of `useSaleorAuthClient` and available as `fetchWithAuth`.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events and is meant to refresh the GraphQL store and in-flight active GraphQL queries.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { Provider, cacheExchange, fetchExchange, ssrExchange } from "urql";

import { SaleorAuthProvider, useAuthChange, useSaleorAuthClient } from "@saleor/auth-sdk/react";
import { useUrqlClient } from "@saleor/auth-sdk/react/urql";

const SaleorURL = "<your Saleor API URL>";

export default function App({ Component, pageProps }: AppProps) {
  const useSaleorAuthClientProps = useSaleorAuthClient({
    saleorApiUrl: SaleorURL,
  });

  const { urqlClient, reset, refetch } = useUrqlClient({
    url: SaleorURL,
    fetch: useSaleorAuthClientProps.saleorAuthClient.fetchWithAuth,
    exchanges: [cacheExchange, fetchExchange],
  });

  useAuthChange({
    saleorApiUrl: SaleorURL,
    onSignedOut: () => reset(),
    onSignedIn: () => refetch(),
  });

  return (
    <SaleorAuthProvider {...useSaleorAuthClientProps}>
      <Provider value={urqlClient}>// ... Your Application</Provider>
    </SaleorAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`, `isAuthenticatin`) provided by the `useSaleorAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```ts
const { signIn, signOut, isAuthenticating } = useSaleorAuthContext();
```

```ts
const response = await signIn({
  email: "example@mail.com",
  passowrd: "password",
});
```

### Next.js (Pages Router) with OpenID Connect

Setup `_app.tsx` as described above. In your login component trigger the external auth flow using the following code:

```tsx
import { useSaleorAuthContext, useSaleorExternalAuth } from "@saleor/auth-sdk/react";
import { ExternalProvider } from "@saleor/auth-sdk";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";

export default function Home() {
  const {
    loading: isLoadingCurrentUser,
    error,
    data,
  } = useQuery(
    gql`
      query CurrentUser {
        me {
          id
          email
          firstName
          lastName
        }
      }
    `,
  );
  const { authURL, loading: isLoadingExternalAuth } = useSaleorExternalAuth({
    saleorURL: "<your Saleor instance>",
    provider: ExternalProvider.OpenIDConnect,
    redirectURL: "<your Next.js app>/api/auth/callback",
  });

  const { signOut } = useSaleorAuthContext();

  if (isLoadingExternalAuth || isLoadingCurrentUser) {
    return <div>Loading...</div>;
  }
  if (data?.me) {
    return (
      <div>
        {JSON.stringify(data)}
        <button onClick={() => signOut()}>Logout</button>
      </div>
    );
  }
  if (authURL) {
    return (
      <div>
        <Link href={authURL}>Login</Link>
      </div>
    );
  }
  return <div>Something went wrong</div>;
}
```

You also need to define the auth callback. In `pages/api/auth` create the `callback.ts` with the following content:

```ts
import { ExternalProvider, SaleorExternalAuth } from "@saleor/auth-sdk";
import { createSaleorExternalAuthHandler } from "@saleor/auth-sdk/next";

const externalAuth = new SaleorExternalAuth(
  "<your Saleor instance URL>",
  ExternalProvider.OpenIDConnect,
);

export default createSaleorExternalAuthHandler(externalAuth);
```

## FAQ

## How do I sign out in checkout?

When dealing with authentication in the checkout, we need to start the signing-out process by detaching the customer from checkout. Since it requires the user to be signed in, it must be executed first. If the mutation succeeds, the tokens from the state/storage will be removed.

```javascript
const { checkoutSignOut } = useSaleorAuthContext();

const response = await checkoutSignOut({ checkoutId: checkout.id });
```

## How do I reset password?

The `SaleorAuthClient` class provides you with a reset password method. If the reset password mutation is successful, it will log you in automatically, just like after a regular sign-in. The [`onSignIn` method of `useAuthChange` hook](#how-do-i-tell-my-graphql-client-to-refresh-queries-on-signin--signout) will also be triggered.

```javascript
const { resetPassword } = useSaleorAuthContext();

const response = await resetPassword({
  email: "example@mail.com",
  password: "newPassword",
  token: "apiToken",
});
```
