import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl, Commitment } from '@solana/web3.js'
import { FC, useMemo } from 'react'
import Body from './Body'
import { COMMITMENT, RPC_TIMEOUT } from './constants'
import 'bootstrap/dist/css/bootstrap.min.css'
require('@solana/wallet-adapter-react-ui/styles.css')

const App: FC = () => {
  // The network can be set to 'Devnet', 'Testnet', or 'Mainnet'.
  // mainnet
  // const network = WalletAdapterNetwork.Mainnet;
  // const endpoint = "https://ssc-dao.genesysgo.net/"

  // devnet
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      // new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  )

  const connectionConfig = {
    commitment: COMMITMENT as Commitment,
    confirmTransactionInitialTimeout: RPC_TIMEOUT,
  }

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Body />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
