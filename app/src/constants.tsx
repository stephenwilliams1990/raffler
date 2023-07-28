import { PublicKey } from '@solana/web3.js'

export const COMMITMENT = 'confirmed'
export const RPC_TIMEOUT = 120 * 1000
// devnet
export const PROGRAM_ID = 'CjyRvuKctQ9yakLp9EQCSis4LzhQgQzXmDHGHb2sQJ7B'
// Placeholder pubkey
export const raffleAccountKey = new PublicKey(
  '9Ef4mZdxGBBEjwWWR25z2dmcctPZ8qQjyRk1ixg5enWT'
)
export const nftRaffleAccountKey = new PublicKey(
  'CKFw11uVBE9cGswdRTJV7Yvhc6XUc7ANHSBRYQgDtKc5'
)
export const RAFFLE = Buffer.from('raffle')
export const TICKET = Buffer.from('ticket')
export const STATE = Buffer.from('state')
export const DEFAULT_PUBKEY_ADDRESS =
  'So11111111111111111111111111111111111111112'
export const MAX_RETRIES = 3
export const externalImg =
  'https://pbs.twimg.com/profile_images/1521363057166852096/XbONrRW5_400x400.jpg'
