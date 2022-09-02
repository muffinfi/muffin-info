import OPTIMISM_LOGO_URL from '../assets/images/optimism.svg'
import ARBITRUM_LOGO_URL from '../assets/images/arbitrum.svg'
import ETHEREUM_LOGO_URL from '../assets/images/ethereum-logo.png'
import POLYGON_LOGO_URL from '../assets/images/polygon-logo.png'

export enum SupportedNetwork {
  ETHEREUM,
  ARBITRUM,
  OPTIMISM,
  POLYGON,
  RINKEBY,
  GOERLI,
}

export type NetworkInfo = {
  id: SupportedNetwork
  route: string
  name: string
  imageURL: string
  bgColor: string
  primaryColor: string
  secondaryColor: string
  blurb?: string
  testnet?: boolean
}

export const EthereumNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.ETHEREUM,
  route: '',
  name: 'Ethereum',
  bgColor: '#F94903',
  primaryColor: '#F94903',
  secondaryColor: '#2172E5',
  imageURL: ETHEREUM_LOGO_URL,
}

export const ArbitrumNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.ARBITRUM,
  route: 'arbitrum',
  name: 'Arbitrum',
  imageURL: ARBITRUM_LOGO_URL,
  bgColor: '#0A294B',
  primaryColor: '#0490ED',
  secondaryColor: '#96BEDC',
  blurb: 'Beta',
}

export const OptimismNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.OPTIMISM,
  route: 'optimism',
  name: 'Optimism',
  bgColor: '#F01B36',
  primaryColor: '#F01B36',
  secondaryColor: '#FB7876',
  imageURL: OPTIMISM_LOGO_URL,
  blurb: 'Beta',
}

export const PolygonNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.POLYGON,
  route: 'polygon',
  name: 'Polygon',
  bgColor: '#8247e5',
  primaryColor: '#8247e5',
  secondaryColor: '#FB7876',
  imageURL: POLYGON_LOGO_URL,
  blurb: '',
}

export const RinkebyNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.RINKEBY,
  route: 'rinkeby',
  name: 'Rinkeby',
  bgColor: '#F94903',
  primaryColor: '#F94903',
  secondaryColor: '#2172E5',
  imageURL: ETHEREUM_LOGO_URL,
  blurb: 'Testnet',
  testnet: true,
}

export const GoerliNetworkInfo: NetworkInfo = {
  id: SupportedNetwork.GOERLI,
  route: 'goerli',
  name: 'Goerli',
  bgColor: '#F94903',
  primaryColor: '#F94903',
  secondaryColor: '#2172E5',
  imageURL: ETHEREUM_LOGO_URL,
  blurb: 'Testnet',
  testnet: true,
}

const getUrlSubdomain = () => {
  const parts = window.location.hostname.split('.')
  return parts.length > 2 ? parts[0] : ''
}

const isTestnet = () => {
  if (process.env.REACT_APP_IS_TESTNET == 'true' || process.env.REACT_APP_IS_TESTNET == '1') return true
  if (getUrlSubdomain().includes('testnet')) return true
  return false
}

export const SUPPORTED_NETWORK_VERSIONS: NetworkInfo[] = isTestnet()
  ? [RinkebyNetworkInfo, GoerliNetworkInfo]
  : [
      EthereumNetworkInfo,
      // PolygonNetworkInfo,
      // OptimismNetworkInfo,
      // ArbitrumNetworkInfo,
    ]
