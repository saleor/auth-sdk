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

## Authentication flow

### SaleorAuthClient

Most of the authentication flow is managed by a vanilla JS class `SaleorAuthClient`. You can create an instance providing a couple of props:

```javascript
interface SaleorAuthClientProps {
  saleorApiUrl: string;
  onAuthRefresh?: (isAuthenticating: boolean) => void;
  storage: Storage;
}
```

`saleorApiUrl` is required so the auth module can refresh the access token.

### How do I tell my GraphQL client to use authentication?

The `SaleorAuthClient` class provides a `fetchWithAuth` method that you should pass to your GraphQL client. That will ensure that every request will be authenticated once the user signs in.

```javascript
const { authFetch } = new SaleorAuthClient(clientProps);

createClient({
  ...clientOptions,
  fetch: authFetch,
});
```

## How do I tell React that the authentication is happening?

#### **`useSaleorAuthClient({ saleorApiUrl, storage, onAuthRefresh }: UseSaleorAuthClientProps) => SaleorAuthClientProps`**

The authentication occurs in the React component lifecycle by setting the event listeners on the window. After the listeners are resolved, we need to make sure we removed them. For that purpose, we are providing an `useSaleorAuthClient` hook. It takes up the same props as `SaleorAuthClient` and returns the instance of `SaleorAuthClient` along with the `isAuthenticating` prop.

```javascript
const { saleorAuthClient, isAuthenticating } = useSaleorAuthClient({
  saleorApiUrl: "https://master.staging.saleor.cloud",
});
```

## How do I use the auth without prop drilling?

#### **`SaleorAuthProvider({ saleorAuthClient, isAuthenticating, children }: PropsWithChildren<UseSaleorAuthClient>) => JSX.Element`**

The hook should be used only at the root of your project. If you would like to access the client methods or the `isAuthenticating` prop down the tree without extensive prop drilling, you can use the `SaleorAuthProvider`. As the value for it, you should use the result of the `useSaleorAuthClient` hook.

```jsx
const saleorAuthClientData = useSaleorAuthClient(authClientProps)

<SaleorAuthProvider {...saleorAuthClientData}>
    {...}
</SaleorAuthProvider>
```

---

#### **`useSaleorAuthContext() => SaleorAuthContextConsumerProps`**

The provider also equips you with the `useSaleorAuthContext` hook:

```javascript
const { isAuthenticating, signIn, signOut, checkoutSignOut } = useSaleorAuthContext();
```

## How do I tell my graphql client to refresh queries on signIn / signOut?

#### **`useAuthChange({ onSignedIn, onSignedOut }: UseAuthChangeProps) => void`**

We provided a `useAuthChange` hook that listens to storage changes and triggers callbacks.

```javascript
  useAuthChange({
    onSignedOut: () => { /* client invalidate some queries */},
    onSignedIn: () => { /* client invalidate some queries  */}
    },
  });
```

## How do I sign in?

#### **`SaleorAuthClient.signIn: ({ email, password }: TokenCreateVariables) => Promise<TokenCreateResponse>`**

`SaleorAuthClient` returns a `signIn` method. You can also access it via the **useSaleorAuthContext** hook.

```javascript
const { signIn } = useSaleorAuthContext();

const response = await signIn({
  email: "example@mail.com",
  passowrd: "password",
});
```

## How do I sign out?

#### **`SaleorAuthClient.signOut: () => void`**

This method will remove access and refresh tokens from the `SaleorAuthClient` state and storage. It will also call the sign-out event, which will trigger [`onSignOut` method of the `useAuthChange` hook](#how-do-i-tell-my-graphql-client-to-refresh-queries-on-signin--signout).

```javascript
const { signOut } = useSaleorAuthContext();

signOut();
```

⚠️ For checkout sign-out, see [signing-out in checkout](#how-do-i-sign-out-in-checkout).

## How do I sign out in checkout?

#### **`SaleorAuthClient.checkoutSignOut: ({ checkoutId }: CustomerDetachVariables) => Promise<CustomerDetachResponse>`**

When dealing with authentication in the checkout, we need to start the signing-out process by detaching the customer from checkout. Since it requires the user to be signed in, it must be executed first. If the mutation succeeds, the tokens from the state/storage will be removed.

```javascript
const { checkoutSignOut } = useSaleorAuthContext();

const response = await checkoutSignOut({ checkoutId: checkout.id });
```

## How do I reset password?

#### **`SaleorAuthClient.resetPassword: ({ email, password, token }: PasswordResetVariables) => Promise<PasswordResetResponse>`**

The `SaleorAuthClient` class provides you with a reset password method. If the reset password mutation is successful, it will log you in automatically, just like after a regular sign-in. The [`onSignIn` method of `useAuthChange` hook](#how-do-i-tell-my-graphql-client-to-refresh-queries-on-signin--signout) will also be triggered.

```javascript
const { resetPassword } = useSaleorAuthContext();

const response = await resetPassword({
  email: "example@mail.com",
  password: "newPassword",
  token: "apiToken",
});
```

## How do I use this with urql?

Once an authentication change happens, you might want to refetch some of your queries. Because urql doesn't provide a direct way to invalidate cache manually, we're following urql's [proposed approach](https://github.com/urql-graphql/urql/issues/297#issuecomment-501646761) of installing a new instance of the client in place of the old one. We have a hook for that called `useUrqlClient` that takes urql `ClientOptions` as the only argument and returns the current `urqlClient` and the `reset` & `refetch` functions:

```javascript
const { urqlClient, reset, refetch } = useUrqlClient({
  url: saleorApiUrl,
  fetch: saleorAuthClient.fetchWithAuth,
  // other client props
});
```

Then, you may want to pass the `reset` & `refetch` functions to the `useAuthChange` hook:

```javascript
useAuthChange({
  onSignedOut: () => reset(),
  onSignedIn: () => refetch(),
});
```

### How to put it all together?

```jsx
export const App = () => {
  const { saleorApiUrl } = getQueryParams();
  const { locale, messages } = useLocale();
  const saleorAuthClientProps = useSaleorAuthClient({ saleorApiUrl });

  const { saleorAuthClient } = saleorAuthClientProps;

  const { urqlClient, reset, refetch } = useUrqlClient({
    suspense: true,
    requestPolicy: "cache-first",
    url: saleorApiUrl,
    fetch: saleorAuthClient.fetchWithAuth,
  });

  useAuthChange({
    onSignedOut: () => reset(),
    onSignedIn: () => refetch(),
  });

  return (
    <SaleorAuthProvider {...saleorAuthClientProps}>
      <UrqlProvider value={urqlClient}>
        <Home />
      </UrqlProvider>
    </SaleorAuthProvider>
  );
};
```

### How do I use it with Apollo?

We provide support for Apollo with a hook called `useApolloClient` that authenticates fetch as its only argument and returns the current client, as well as the `reset` and the `refetch` functions:

```javascript
const { apolloClient, reset, refetch } = useApolloClient(saleorAuthClient.fetchWithAuth);
```

Once you get the client with authenticated fetch, you'll want to pass the `reset` and `refetch` functions to the `useAuthChange` hook:

```javascript
useAuthChange({
  onSignedOut: () => reset(),
  onSignedIn: () => refetch(),
});
```

```jsx
export const App = () => {
  const { saleorApiUrl } = getQueryParams();
  const saleorAuthClientProps = useSaleorAuthClient({ saleorApiUrl });

  const { saleorAuthClient } = saleorAuthClientProps;

  const { apolloClient, reset, refetch } = useApolloClient(saleorAuthClient.fetchWithAuth);

  useAuthChange({
    onSignedOut: () => reset(),
    onSignedIn: () => refetch(),
  });

  return (
    <SaleorAuthProvider {...saleorAuthClientProps}>
      <ApolloProvider value={apolloClient}>
        <Home />
      </ApolloProvider>
    </SaleorAuthProvider>
  );
};
```
