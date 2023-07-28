/**
 * This command initialises Global State for the Raffle program
 *
 * TO RUN:
 *      npm run init-state --admin=HnCynU8U2ZuyJCf61HsVuMvBehckSnvhUhkmtZKE5HnG
 */

import { AnchorProvider, web3 } from '@project-serum/anchor'
import { findGlobalStateKey } from '../../src/pda'
import { program } from '../config'

const admin = new web3.PublicKey(process.env.npm_config_admin)

const runInstruction = async () => {
  const [globalState] = await findGlobalStateKey(program.programId)

  const txId = await program.methods
    .initState()
    .accounts({
      payer: (program.provider as AnchorProvider).wallet.publicKey,
      admin,
      globalState,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc()

  return {
    txId,
    globalState,
  }
}

runInstruction()
  .catch((error) => console.log(`Error: ${error}`))
  .then((result) => {
    if (result) {
      const { txId, globalState } = result
      console.log(
        '[SUCCESS]' +
          JSON.stringify({
            txId,
            global_state_address: globalState.toString(),
          })
      )
    }
  })
