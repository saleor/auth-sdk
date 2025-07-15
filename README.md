<div align="center">
  <img width="150" alt="" src="https://github.com/saleor/auth-sdk/assets/1338731/c90a73d0-5ef1-4d09-9347-c5d02cd7244d">
</div>

<div align="center">
  
# Saleor Auth SDK

Saleor Auth SDK integrates secure and customizable authentication and authorization into storefronts using Saleor.

**Below 3kB bundle size (gzipped).**

</div>

<div align="center">
  <a href="https://www.npmjs.com/package/@saleor/auth-sdk">npm</a>
  <span> • </span>
  <a href="https://docs.saleor.io/docs/3.x/api-usage/authentication">Docs</a>
  <span> • </span>
  <a href="https://twitter.com/getsaleor">Twitter</a>
  <span> • </span>
  <a href="https://saleor.io/discord">Discord</a>
</div>

<br/>



## Usage

### Next.js App Router

The Saleor Auth SDK supports both **Next.js 13/14** and **Next.js 15**, but due to changes in how cookies are handled, different storage methods are required for each version.

---

## **Using Saleor Auth SDK in Next.js 13/14**
Next.js 13 and 14 support **synchronous cookies**, which means you can use the `getNextServerCookiesStorage` function without issues.

## **Setting Up the Auth Client (Next.js 13/14)**

```ts
import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { getNextServerCookiesStorage } from "@saleor/auth-sdk/next/server";

const getServerAuthClient = () => {
  const nextServerCookiesStorage = getNextServerCookiesStorage();
  return createSaleorAuthClient({
    saleorApiUrl: "…",
    refreshTokenStorage: nextServerCookiesStorage,
    accessTokenStorage: nextServerCookiesStorage,
  });
};
```

Logging in can be implemented via Server Actions:

```tsx
<form
  className="bg-white shadow-md rounded p-8"
  action={async (formData) => {
    "use server";

    await getServerAuthClient().signIn(
      {
        email: formData.get("email").toString(),
        password: formData.get("password").toString(),
      },
      { cache: "no-store" },
    );
  }}
>
  {/* … rest of the form … */}
</form>
```

## **Using Saleor Auth SDK in Next.js 15**

Next.js 15 introduces asynchronous cookies, requiring the use of getNextServerCookiesStorageAsync instead.

## **Setting Up the Auth Client (Next.js 15)**

```ts
import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { getNextServerCookiesStorageAsync } from "@saleor/auth-sdk/next/server";

const getServerAuthClient = async () => {
  const nextServerCookiesStorage = await getNextServerCookiesStorageAsync();
  return createSaleorAuthClient({
    saleorApiUrl: "…",
    refreshTokenStorage: nextServerCookiesStorage,
    accessTokenStorage: nextServerCookiesStorage,
  });
};
```

Logging in can be implemented via Server Actions:

```tsx
<form
  className="bg-white shadow-md rounded p-8"
  action={async (formData) => {
    "use server";

    await (await getServerAuthClient()).signIn(
      {
        email: formData.get("email").toString(),
        password: formData.get("password").toString(),
      },
      { cache: "no-store" },
    );
  }}
>
  {/* … rest of the form … */}
</form>
```

Then, you can use `saleorAuthClient.fetchWithAuth` directly for any queries and mutations.

For a full working example, see the [Saleor Auth SDK example](https://github.com/saleor/example-auth-sdk/tree/app/ssr/page.tsx).

### Next.js Pages Router with [Apollo Client](https://www.apollographql.com/docs/react/)

<details>
  <summary>Step-by-step video tutorial</summary>

Check the following [step-by-step video](https://www.youtube.com/watch?v=XY1t8JiPwk0) guide on how to set this up.
[![Saleor Auth with Next.js](https://img.youtube.com/vi/t6nxBk7JHCw/0.jpg)](https://www.youtube.com/watch?v=XY1t8JiPwk0)

</details>

When using Next.js (Pages Router) along with [Apollo Client](https://www.apollographql.com/docs/react/), there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<SaleorAuthProvider>` and `<ApolloProvider>`.

`<SaleorAuthProvider>` comes from our React.js-auth package, located at `@saleor/auth-sdk/react`, and it needs to be set up with the Saleor auth client instance.

The `<ApolloProvider>` comes from `@apollo/client` and it needs the live GraphQL client instance, which is enhanced with the authenticated `fetch` that comes from the Saleor auth client.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { createSaleorAuthClient } from "@saleor/auth-sdk";
import { SaleorAuthProvider, useAuthChange } from "@saleor/auth-sdk/react";

const saleorApiUrl = "<your Saleor API URL>";

// Saleor Client
const saleorAuthClient = createSaleorAuthClient({ saleorApiUrl });

// Apollo Client
const httpLink = createHttpLink({
  uri: saleorApiUrl,
  fetch: saleorAuthClient.fetchWithAuth,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  useAuthChange({
    saleorApiUrl,
    onSignedOut: () => apolloClient.resetStore(),
    onSignedIn: () => {
      apolloClient.refetchQueries({ include: "all" });
    },
  });

  return (
    <SaleorAuthProvider client={saleorAuthClient}>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SaleorAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`, `isAuthenticating`) provided by the `useSaleorAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```tsx
import React, { FormEvent } from "react";
import { useSaleorAuthContext } from "@saleor/auth-sdk/react";
import { gql, useQuery } from "@apollo/client";

const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      id
      email
      firstName
      lastName
      avatar {
        url
        alt
      }
    }
  }
`;

export default function LoginPage() {
  const { signIn, signOut } = useSaleorAuthContext();

  const { data: currentUser, loading } = useQuery(CurrentUserDocument);

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await signIn({
      email: "admin@example.com",
      password: "admin",
    });

    if (result.data.tokenCreate.errors.length) {
      // handle errors
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {currentUser?.me ? (
        <>
          <div>Display user {JSON.stringify(currentUser)}</div>
          <button className="button" onClick={() => signOut()}>
            Log Out
          </button>
        </>
      ) : (
        <div>
          <form onSubmit={submitHandler}>
            {/* You must connect your inputs to state or use a form library such as react-hook-form */}
            <input type="email" name="email" placeholder="Email" />
            <input type="password" name="password" placeholder="Password" />
            <button className="button" type="submit">
              Log In
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
```

### Next.js (Pages Router) with [urql](https://formidable.com/open-source/urql/)

When using Next.js (Pages Router) along with [urql](https://formidable.com/open-source/urql/) client, there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<SaleorAuthProvider>` and `<Provider>`.

`<SaleorAuthProvider>` comes from our React.js-auth package, located at `@saleor/auth-sdk/react`, and it needs to be set up with the Saleor auth client.

The `<Provider>` comes from `urql` and it needs the GraphQL client instance, which is enhanced with the authenticated `fetch` that comes from the Saleor auth client.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events and is meant to refresh the GraphQL store and in-flight active GraphQL queries.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { Provider, cacheExchange, fetchExchange, ssrExchange } from "urql";
import { SaleorAuthProvider, useAuthChange } from "@saleor/auth-sdk/react";

const saleorApiUrl = "<your Saleor API URL>";

const saleorAuthClient = createSaleorAuthClient({ saleorApiUrl });

const makeUrqlClient = () =>
  createClient({
    url: saleorApiUrl,
    fetch: saleorAuthClient.fetchWithAuth,
    exchanges: [cacheExchange, fetchExchange],
  });

export default function App({ Component, pageProps }: AppProps) {
  // https://github.com/urql-graphql/urql/issues/297#issuecomment-504782794
  const [urqlClient, setUrqlClient] = useState<Client>(makeUrqlClient());

  useAuthChange({
    saleorApiUrl,
    onSignedOut: () => setUrqlClient(makeUrqlClient()),
    onSignedIn: () => setUrqlClient(makeUrqlClient()),
  });

  return (
    <SaleorAuthProvider client={saleorAuthClient}>
      <Provider value={urqlClient}>
        <Component {...pageProps} />
      </Provider>
    </SaleorAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`) provided by the `useSaleorAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```tsx
import React, { FormEvent } from "react";
import { useSaleorAuthContext } from "@saleor/auth-sdk/react";
import { gql, useQuery } from "urql";

const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      id
      email
      firstName
      lastName
      avatar {
        url
        alt
      }
    }
  }
`;

export default function LoginPage() {
  const { signIn, signOut } = useSaleorAuthContext();

  const [{ data: currentUser, fetching: loading }] = useQuery({
    query: CurrentUserDocument,
    pause: isAuthenticating,
  });

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await signIn({
      email: "admin@example.com",
      password: "admin",
    });

    if (result.data.tokenCreate.errors) {
      // handle errors
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {currentUser?.me ? (
        <>
          <div>Display user {JSON.stringify(currentUser)}</div>
          <button className="button" onClick={() => signOut()}>
            Log Out
          </button>
        </>
      ) : (
        <div>
          <form onSubmit={submitHandler}>
            {/* You must connect your inputs to state or use a form library such as react-hook-form */}
            <input type="email" name="email" placeholder="Email" />
            <input type="password" name="password" placeholder="Password" />
            <button className="button" type="submit">
              Log In
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
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
  } = useQuery(gql`
    query CurrentUser {
      me {
        id
        email
        firstName
        lastName
      }
    }
  `);
  const { authURL, loading: isLoadingExternalAuth } = useSaleorExternalAuth({
    saleorApiUrl,
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

const externalAuth = new SaleorExternalAuth("<your Saleor instance URL>", ExternalProvider.OpenIDConnect);

export default createSaleorExternalAuthHandler(externalAuth);
```

## FAQ

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
