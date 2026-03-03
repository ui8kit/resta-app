export type GraphqlRequestOptions = {
  endpoint: string;
  query: string;
  operationName?: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
};

type GraphqlError = {
  message: string;
};

type GraphqlPayload<TData> = {
  data?: TData;
  errors?: GraphqlError[];
};

export async function requestGraphql<TData>(options: GraphqlRequestOptions): Promise<TData> {
  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify({
      query: options.query,
      operationName: options.operationName,
      variables: options.variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as GraphqlPayload<TData>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  if (payload.data === undefined) {
    throw new Error('GraphQL response does not contain data.');
  }

  return payload.data;
}
