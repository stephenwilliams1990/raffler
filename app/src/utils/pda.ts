import * as anchor from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID, STATE, RAFFLE, TICKET } from '../constants'

export const findGlobalStateKey = async (
  programId: PublicKey = new PublicKey(PROGRAM_ID)
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([STATE], programId)
}

export const findRaffleProgramAuthority = async (
  raffleConfigKey: PublicKey,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [RAFFLE, raffleConfigKey.toBuffer()],
    programId
  )
}

export const findTicketAccountKey = async (
  raffleConfigKey: PublicKey,
  ticketNumber: anchor.BN,
  programId: PublicKey = new PublicKey(PROGRAM_ID)
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      TICKET,
      raffleConfigKey.toBuffer(),
      ticketNumber.toArrayLike(Buffer, 'le', 8),
    ],
    programId
  )
}
