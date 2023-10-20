import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>["__apiType"];

  constructor(
    private value: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public __meta__?: Record<string, any>,
  ) {
    super(value);
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
