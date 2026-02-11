import { WalletClient, AuthFetch } from '@bsv/sdk'

const wallet = new WalletClient('auto')
export const authFetch = new AuthFetch(wallet)
