import { Card, Col, Row, ListGroup, ListGroupItem } from 'react-bootstrap'
import { RaffleAccount } from '../utils/setup'
import { externalImg } from '../constants'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BuyTicket from '../actions/buyTicket'
import { Raffle } from '../utils/raffle'
import { Program } from '@project-serum/anchor'

interface Props {
  nftRaffleAccount: RaffleAccount
  nftRaffleAccountKey: PublicKey
  nftImgSrc: string
  raffleAccount: RaffleAccount
  raffleAccountKey: PublicKey
  imgSrc: string
  callBack?: () => Promise<void>
  program: Program<Raffle>
}

const RaffleAsset = (props: Props) => {
  const {
    raffleAccount,
    imgSrc,
    raffleAccountKey,
    nftRaffleAccount,
    nftImgSrc,
    nftRaffleAccountKey,
    callBack,
    program,
  } = props

  let img
  if (imgSrc === '') {
    img = externalImg
  }

  return (
    <div className="m-5">
      <Row>
        <Col>
          <Card style={{ width: '24rem' }} className="text-center">
            <Card.Img variant="top" src={nftImgSrc} />
            <Card.Header>Particles NFT Raffle</Card.Header>

            <ListGroup className="list-group-flush">
              <ListGroupItem>{`Tickets sold: ${nftRaffleAccount.ticketCount}`}</ListGroupItem>
              <ListGroupItem>
                Number of winners:{' '}
                {nftRaffleAccount.noWinners === 0
                  ? 1
                  : nftRaffleAccount.noWinners}
              </ListGroupItem>
              <ListGroupItem>{`Price: ${
                nftRaffleAccount.rafflePrice.toNumber() / LAMPORTS_PER_SOL
              } SOL`}</ListGroupItem>
            </ListGroup>
            <Card.Footer className="text-muted">
              <BuyTicket
                raffleAccountKey={nftRaffleAccountKey}
                callBack={callBack}
                program={program}
              />
            </Card.Footer>
          </Card>
        </Col>

        <Col>
          <Card style={{ width: '24rem' }} className="text-center">
            <Card.Img variant="top" src={img} />
            <Card.Header>Particles WL Raffle</Card.Header>

            <ListGroup className="list-group-flush">
              <ListGroupItem>{`Tickets sold: ${raffleAccount.ticketCount}`}</ListGroupItem>
              <ListGroupItem>
                Number of winners:{' '}
                {raffleAccount.noWinners === 0 ? 1 : raffleAccount.noWinners}
              </ListGroupItem>
              <ListGroupItem>{`Price: ${
                raffleAccount.rafflePrice.toNumber() / LAMPORTS_PER_SOL
              } $OOO`}</ListGroupItem>
            </ListGroup>
            <Card.Footer className="text-muted">
              <BuyTicket
                raffleAccountKey={raffleAccountKey}
                callBack={callBack}
                program={program}
              />
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RaffleAsset
