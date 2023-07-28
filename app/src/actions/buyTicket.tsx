import { Button } from 'react-bootstrap'
import { useState } from 'react'
import { buyTicketIx } from '../utils/buyTicket'
import { Raffle } from '../utils/raffle'
import { PublicKey } from '@solana/web3.js'
import { Program } from '@project-serum/anchor'
import { SmartInstructionSender } from '@holaplex/solana-web3-tools'
import { useAnchorWallet, AnchorWallet } from '@solana/wallet-adapter-react'
import { COMMITMENT, MAX_RETRIES } from '../constants'
import { callbackify } from 'util'

interface Props {
  raffleAccountKey: PublicKey
  callBack?: () => Promise<void>
  program: Program<Raffle>
}
const BuyTicket = (props: Props) => {
  const { raffleAccountKey, program, callBack } = props

  const wallet = useAnchorWallet() as AnchorWallet

  const [isPurchasing, setIsPurchasing] = useState<boolean>(false)

  const buy = async () => {
    try {
      setIsPurchasing(true)
      console.log('buying ticket...')
      const { buyTicketInstructions } = await buyTicketIx({
        raffleAccountKey,
        program,
      })

      const instructionGroup = [
        {
          instructions: buyTicketInstructions,
          signers: [],
        },
      ]

      const sender = SmartInstructionSender.build(
        wallet,
        program.provider.connection
      )
        .config({
          maxSigningAttempts: MAX_RETRIES,
          abortOnFailure: true,
          commitment: COMMITMENT,
        })
        .withInstructionSets(instructionGroup)
        .onProgress((currentIndex, txId) =>
          console.log('Transaction Id:', txId)
        )
        .onReSign((attempt, i) => {
          const msg = `Resigning: ${i} attempt: ${attempt}`
          console.warn(msg)
        })
      await sender
        .send()
        .then(() => {
          console.log('Transaction success')
          if (callBack) {
            callBack()
          }
        })
        .finally(() => {
          setIsPurchasing(false)
        })
    } catch (error: any) {
      console.log('error', error)
      let message = error.msg || 'Ticket purchase failed! Please try again!'
      console.log('Error purchasing ticket', message)
    } finally {
      setIsPurchasing(false)
    }
  }

  const buttonDisabled = isPurchasing
  const buttonText = isPurchasing ? 'Purchasing ticket...' : 'Buy ticket'

  return (
    <Button variant="primary" onClick={() => buy()} disabled={buttonDisabled}>
      {buttonText}
    </Button>
  )
}

export default BuyTicket
