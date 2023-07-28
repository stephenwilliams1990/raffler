import { PublicKey } from '@solana/web3.js'
import { Raffle } from './raffle'
import { Program, AnchorProvider, web3 } from '@project-serum/anchor'
import { findTicketAccountKey, findGlobalStateKey } from './pda'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getATAAddressSync } from '@saberhq/token-utils'

interface BuyTicketParams {
  raffleAccountKey: PublicKey
  program: Program<Raffle>
}

export const buyTicketIx = async ({
  raffleAccountKey,
  program,
}: BuyTicketParams) => {
  const raffleAccount = await program.account.raffleAccount.fetch(
    raffleAccountKey
  )
  const [ticketAccount] = await findTicketAccountKey(
    raffleAccountKey,
    raffleAccount.ticketCount,
    program.programId
  )
  const [globalState] = await findGlobalStateKey(program.programId)
  const globalInfo = await program.account.globalState.fetch(globalState)
  let remainingAccounts = []
  if (
    raffleAccount.treasuryMint?.toBase58() !==
    'So11111111111111111111111111111111111111112'
  ) {
    const payerTreasuryAccount = getATAAddressSync({
      mint: raffleAccount.treasuryMint!,
      owner: (program.provider as AnchorProvider).wallet.publicKey,
    })
    const adminTreasuryAccount = getATAAddressSync({
      mint: raffleAccount.treasuryMint!,
      owner: raffleAccount.admin,
    })
    const globalAdminTreasuryAccount = getATAAddressSync({
      mint: raffleAccount.treasuryMint!,
      owner: globalInfo.admin,
    })
    remainingAccounts.push({
      pubkey: payerTreasuryAccount,
      isWritable: true,
      isSigner: false,
    })
    remainingAccounts.push({
      pubkey: adminTreasuryAccount,
      isWritable: true,
      isSigner: false,
    })
    remainingAccounts.push({
      pubkey: globalAdminTreasuryAccount,
      isWritable: true,
      isSigner: false,
    })
  }

  let buyTicketInstructions = []
  try {
    const ix = await program.methods
      .buyTicket()
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
      .remainingAccounts(remainingAccounts.length > 0 ? remainingAccounts : [])
      .instruction()
    buyTicketInstructions.push(ix)
  } catch (e) {
    console.log('Problem buying ticket:', e)
  }

  return {
    buyTicketInstructions,
  }
}
