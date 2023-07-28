/**
 * This command creates a new NFT Raffle
 *
 * TO RUN:
 *      npm run buy-ticket --raffle-key=4D8LLVX9vf9wimZNPkjU1CwHrcDmXPiqHWy5dhqZZmFn --amount=1
 */

import { AnchorProvider, web3 } from '@project-serum/anchor';
import { program } from '../config';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { findGlobalStateKey, findTicketAccountKey } from '../../src/pda';
import * as anchor from '@project-serum/anchor';

if (!process.env.npm_config_raffle_key) {
  throw new Error('Please provide a raffle key');
}
const raffleAccountKey = new PublicKey(process.env.npm_config_raffle_key);
const amount = Number(process.env.npm_config_amount);

const runInstruction = async () => {
  const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
  const [ticketAccount] = await findTicketAccountKey(raffleAccountKey, raffleAccount.ticketCount, program.programId);
  const [globalState] = await findGlobalStateKey(program.programId);
  const globalInfo = await program.account.globalState.fetch(globalState);
  try {
    const txId = await program.methods
      .buyTicket(new anchor.BN(amount))
      .accounts({
        payer: (program.provider as AnchorProvider).wallet.publicKey,
        raffleAccount: raffleAccountKey,
        admin: raffleAccount.admin,
        ticketAccount,
        globalState,
        globalAdmin: globalInfo.admin,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([])
      .transaction();

    await program.provider.sendAndConfirm?.(txId, []);

    return {
      txId,
      raffleAccount,
    };
  } catch (e) {
    console.log('Error creating NFT raffle', e);
  }
};

runInstruction()
  .catch((error) => console.log(`Error: ${error}`))
  .then((result) => {
    if (result) {
      const { raffleAccount, txId } = result;
      console.log('TxId', txId, '\n');
      console.log('Rafffle Account:', raffleAccount, '\n');
      console.log('Ticket purchased successfully');
    } else {
      console.log('\nSeomthing went wrong');
    }
  });
