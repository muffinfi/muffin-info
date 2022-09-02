import { ApolloClient, ErrorPolicy, FetchPolicy, InMemoryCache, WatchQueryFetchPolicy } from '@apollo/client'

const clientSettings = (policy: FetchPolicy) => {
  return {
    queryDeduplication: true,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: policy as WatchQueryFetchPolicy,
      },
      query: {
        fetchPolicy: policy,
        errorPolicy: 'all' as ErrorPolicy,
      },
    },
  }
}

const createMuffinSubgraphCache = () => {
  return new InMemoryCache({
    typePolicies: {
      Token: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
      Pool: {
        // Singleton types that have no identifying field can use an empty
        // array for their keyFields.
        keyFields: false,
      },
    },
  })
}

export const healthClient = new ApolloClient({
  uri: 'https://api.thegraph.com/index-node/graphql',
  cache: new InMemoryCache(),
})

export const blockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache(),
  ...clientSettings('no-cache'),
})

export const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/muffinfi/muffin-mainnet',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('no-cache'),
})

export const arbitrumClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-dev',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('cache-first'),
})

export const arbitrumBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks',
  cache: new InMemoryCache(),
  ...clientSettings('cache-first'),
})

export const optimismClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('no-cache'),
})

export const optimismBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uni-testing-subgraph',
  cache: new InMemoryCache(),
  ...clientSettings('cache-first'),
})

export const polygonClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('no-cache'),
})

export const polygonBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/polygon-blocks',
  cache: new InMemoryCache(),
  ...clientSettings('cache-first'),
})

export const rinkebyClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/virtues-milkier/muffin-rinkeby',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('no-cache'),
})

export const rinkebyBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/rinkeby-blocks',
  cache: new InMemoryCache(),
  ...clientSettings('no-cache'),
})

export const goerliClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dkenw/muffin-goerli',
  cache: createMuffinSubgraphCache(),
  ...clientSettings('no-cache'),
})

export const goerliBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/goerli-blocks',
  cache: new InMemoryCache(),
  ...clientSettings('no-cache'),
})
