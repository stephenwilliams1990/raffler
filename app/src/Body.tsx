import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from '@solana/wallet-adapter-react'
import { Raffle } from './utils/raffle'
import * as anchor from '@project-serum/anchor'
import { Program } from '@project-serum/anchor'
import React, { useState, useMemo, useCallback } from 'react'
import { Cluster, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { loadProgram, loadRaffle } from './utils/setup'
import { useEffect } from 'react'
import { raffleAccountKey, nftRaffleAccountKey } from './constants'
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { Loader } from './components/loading'
import RaffleAsset from './components/raffle'

const Body: React.FC = () => {
  const wallet = useAnchorWallet() as AnchorWallet
  const { connection } = useConnection()

  const [anchorProgram, setAnchorProgram] = useState<Program<Raffle> | null>(
    null
  )
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [raffleData, setRaffleData] = useState<any>(null)

  // @ts-ignore
  const endpoint = connection._rpcEndpoint

  let network: Cluster
  if (endpoint.includes('mainnet')) {
    network = 'mainnet-beta'
  } else {
    network = 'devnet'
  }

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return
    }
    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as unknown as typeof anchor.Wallet
  }, [wallet])

  const refetchRaffle = useCallback(async () => {
    if (wallet && anchorWallet) {
      console.log('Refreshing Raffle info')
      const program = await loadProgram(connection, anchorWallet)
      setAnchorProgram(program)
      setBalance(await program.provider.connection.getBalance(wallet.publicKey))

      const possiblyData = await loadRaffle({
        connection,
        raffleAccountKey,
        nftRaffleAccountKey,
        program,
      })
      if (possiblyData) {
        setRaffleData(possiblyData)
      }
      setLoading(false)
    }
  }, [anchorWallet, wallet])

  useEffect(() => {
    void refetchRaffle()
  }, [refetchRaffle])

  return (
    <div>
      {wallet ? <WalletDisconnectButton /> : <WalletMultiButton />}
      {wallet ? (
        <div>
          <div>
            <ul>
              <li>Wallet address: {wallet?.publicKey?.toString()}</li>
              <li>Balance: {balance && balance / LAMPORTS_PER_SOL} SOL</li>
            </ul>
          </div>
          {loading ? (
            <Loader />
          ) : (
            <div>
              {raffleData && anchorProgram && (
                <RaffleAsset
                  raffleAccount={raffleData.raffleAccount}
                  imgSrc={raffleData.imgSrc}
                  raffleAccountKey={raffleAccountKey}
                  nftRaffleAccount={raffleData.nftRaffleAccount}
                  nftImgSrc={raffleData.nftImgSrc}
                  nftRaffleAccountKey={nftRaffleAccountKey}
                  callBack={refetchRaffle}
                  program={anchorProgram}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div>Not connected..</div>
      )}
    </div>
  )
}

export default Body
