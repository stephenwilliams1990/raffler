import * as anchor from '@project-serum/anchor';
import { PROGRAM_ID, TICKET, STATE, RAFFLE } from '../tests/src/helpers/constants';
import { PublicKey } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const findGlobalStateKey = async (programId: PublicKey = PROGRAM_ID): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([STATE], programId);
};

export const findRaffleProgramAuthority = async (
  raffleConfigKey: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([RAFFLE, raffleConfigKey.toBuffer()], programId);
};

export const findTicketAccountKey = async (
  raffleConfigKey: PublicKey,
  ticketNumber: anchor.BN,
  programId: PublicKey = PROGRAM_ID,
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [TICKET, raffleConfigKey.toBuffer(), ticketNumber.toArrayLike(Buffer, 'le', 8)],
    programId,
  );
};

export async function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}
