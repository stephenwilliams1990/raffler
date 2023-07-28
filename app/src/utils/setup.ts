import { AnchorProvider, Idl, Program, Wallet } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { PROGRAM_ID } from '../constants'
import { Raffle } from './raffle'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import { AnchorTypes } from '@saberhq/anchor-contrib'

export type RaffleTypes = AnchorTypes<Raffle>
type Accounts = RaffleTypes['Accounts']

export type RaffleAccount = Accounts['raffleAccount']

export const loadProgram = async (
  connection: Connection,
  anchorWallet: typeof Wallet
) => {
  const provider = new AnchorProvider(connection, anchorWallet as any, {
    preflightCommitment: 'confirmed',
  })
  const idl: Idl | null = await Program.fetchIdl<Raffle>(PROGRAM_ID, provider)

  if (idl) {
    return new Program<Raffle>(idl as any, PROGRAM_ID, provider)
  } else {
    throw new Error('Could not load IDL')
  }
}

interface Params {
  connection: Connection
  raffleAccountKey: PublicKey
  nftRaffleAccountKey: PublicKey
  program: Program<Raffle>
}

const getImage = async (
  raffleAccount: RaffleAccount,
  connection: Connection
) => {
  if (raffleAccount.nftMint.toBase58() !== '11111111111111111111111111111111') {
    const metadataPda = await Metadata.getPDA(raffleAccount.nftMint)
    const metadata = await Metadata.load(connection, metadataPda)
    let image: string | null = null
    await fetch(metadata.data.data.uri)
      .then((response) => response.json())
      .then((data) => {
        image = data.image
      })
      .catch((error) => {
        console.log(error)
      })
    return image
  } else {
    return ''
  }
}

export const loadRaffle = async ({
  connection,
  raffleAccountKey,
  nftRaffleAccountKey,
  program,
}: Params) => {
  const raffleAccount = await program.account.raffleAccount.fetch(
    raffleAccountKey
  )
  const imgSrc: string | null = await getImage(raffleAccount, connection)
  const nftRaffleAccount = await program.account.raffleAccount.fetch(
    nftRaffleAccountKey
  )
  const nftImgSrc: string | null = await getImage(nftRaffleAccount, connection)
  return {
    raffleAccount,
    imgSrc,
    nftRaffleAccount,
    nftImgSrc,
  }
}
