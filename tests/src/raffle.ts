import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@saberhq/token-utils';
import { LAMPORTS_PER_SOL, ComputeBudgetProgram, AccountMeta, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { findGlobalStateKey, findRaffleProgramAuthority, findTicketAccountKey } from './helpers/pda';
import { getAssociatedTokenAddress } from './helpers/utils';
import { Raffle } from './idl/raffle';
import { generateNft } from './test-utils';
import { TicketAccount } from './helpers/constants';
import { Token } from '@solana/spl-token';

describe('raffle', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.Raffle as Program<Raffle>;
  let treasuryMint: PublicKey;
  const exampleAdmin = anchor.web3.Keypair.generate();

  const createNftRaffle = async (
    price: number,
    instructions: anchor.web3.TransactionInstruction[],
    nft: anchor.web3.Keypair,
    treasury_mint?: anchor.web3.PublicKey,
  ) => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(exampleAdmin.publicKey, LAMPORTS_PER_SOL * 2),
      'confirmed',
    );
    const raffleAccount = anchor.web3.Keypair.generate();

    const tx = new anchor.web3.Transaction();
    instructions.forEach((ix) => tx.add(ix));
    try {
      await provider.sendAndConfirm(tx, [nft, exampleAdmin]);
    } catch (e) {
      console.log('Error:', e);
    }

    const nftTokenAccount = await getAssociatedTokenAddress(exampleAdmin.publicKey, nft.publicKey);
    const [programAuthority] = await findRaffleProgramAuthority(raffleAccount.publicKey, program.programId);
    const escrowAccount = await getAssociatedTokenAddress(programAuthority, nft.publicKey);

    const remainingAccounts = [];
    if (treasury_mint) {
      remainingAccounts.push({
        pubkey: treasury_mint,
        isWritable: false,
        isSigner: false,
      });
    }

    try {
      await program.methods
        .createNftRaffle(new anchor.BN(price))
        .accounts({
          caller: exampleAdmin.publicKey,
          admin: exampleAdmin.publicKey,
          raffleAccount: raffleAccount.publicKey,
          nftTokenAccount,
          nftMint: nft.publicKey,
          escrowAccount,
          programAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([raffleAccount, exampleAdmin])
        .remainingAccounts(remainingAccounts.length > 0 ? remainingAccounts : [])
        .rpc();
    } catch (e) {
      console.log('Problem:', e);
    }

    const account = await program.account.raffleAccount.fetch(raffleAccount.publicKey);

    expect(account.authority.toBase58()).to.equal(exampleAdmin.publicKey.toBase58());
    expect(account.rafflePrice.toNumber()).to.equal(price);
    expect(account.ticketCount.toNumber()).to.equal(0);
    expect(account.programAuthority.toBase58()).to.equal(programAuthority.toBase58());

    const raffleNft = await provider.connection.getParsedTokenAccountsByOwner(account.programAuthority, {
      mint: nft.publicKey,
    });
    expect(raffleNft.value[0]!.account.data.parsed.info.tokenAmount.uiAmount).to.equal(1);
    if (treasuryMint) {
      expect(account.treasuryMint!.toBase58()).to.equal(treasuryMint.toBase58());
    }
    return raffleAccount.publicKey;
  };

  const createRaffle = async (price: number, no_winners: number, treasury_mint?: anchor.web3.PublicKey) => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(exampleAdmin.publicKey, LAMPORTS_PER_SOL * 2),
      'confirmed',
    );
    const raffleAccount = anchor.web3.Keypair.generate();

    const remainingAccounts = [];
    if (treasury_mint) {
      remainingAccounts.push({
        pubkey: treasury_mint,
        isWritable: false,
        isSigner: false,
      });
    }

    try {
      await program.methods
        .createRaffle(new anchor.BN(price), no_winners)
        .accounts({
          caller: exampleAdmin.publicKey,
          admin: exampleAdmin.publicKey,
          raffleAccount: raffleAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([raffleAccount, exampleAdmin])
        .remainingAccounts(remainingAccounts.length > 0 ? remainingAccounts : [])
        .rpc();
    } catch (e) {
      console.log('Problem:', e);
    }

    const account = await program.account.raffleAccount.fetch(raffleAccount.publicKey);
    console.log('Check:', account.noWinners);

    expect(account.authority.toBase58()).to.equal(exampleAdmin.publicKey.toBase58());
    expect(account.rafflePrice.toNumber()).to.equal(price);
    expect(account.ticketCount.toNumber()).to.equal(0);
    expect(account.winnerIndexes.length).to.equal(0);
    expect(account.noWinners).to.equal(no_winners);
    if (treasuryMint) {
      expect(account.treasuryMint!.toBase58()).to.equal(treasuryMint.toBase58());
    }
    return raffleAccount.publicKey;
  };

  const buyTicket = async (
    payer: anchor.web3.Keypair,
    raffleAccountKey: anchor.web3.PublicKey,
    amount: number,
    treasuryMint?: anchor.web3.PublicKey,
    payerTreasuryAccount?: anchor.web3.PublicKey,
    adminTreasuryAccount?: anchor.web3.PublicKey,
    globalAdminTreasuryAccount?: anchor.web3.PublicKey,
  ) => {
    const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    const [ticketAccount] = await findTicketAccountKey(raffleAccountKey, raffleAccount.ticketCount, program.programId);
    const [globalState] = await findGlobalStateKey(program.programId);

    let payerInfo = await provider.connection.getAccountInfo(payer.publicKey);
    let startBalancePayer = payerInfo!.lamports;
    let adminInfo = await provider.connection.getAccountInfo(exampleAdmin.publicKey);
    let startBalanceAdmin = adminInfo!.lamports;
    let globalAdminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    let startBalanceGlobalAdmin = globalAdminInfo!.lamports;

    // add in remaining accounts logic
    const remainingAccounts: AccountMeta[] = [];
    if (treasuryMint && payerTreasuryAccount && adminTreasuryAccount && globalAdminTreasuryAccount) {
      remainingAccounts.push({
        pubkey: payerTreasuryAccount,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: adminTreasuryAccount,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: globalAdminTreasuryAccount,
        isWritable: true,
        isSigner: false,
      });
      startBalancePayer = Number((await provider.connection.getTokenAccountBalance(payerTreasuryAccount)).value.amount);
      // // @ts-ignore
      // (await provider.connection.getParsedAccountInfo(payerTreasuryAccount))
      //   .value.data.parsed.info.tokenAmount.uiAmount * LAMPORTS_PER_SOL;

      startBalanceAdmin = Number((await provider.connection.getTokenAccountBalance(adminTreasuryAccount)).value.amount);
      //   // @ts-ignore
      //   (await provider.connection.getParsedAccountInfo(adminTreasuryAccount))
      //     .value.data.parsed.info.tokenAmount.uiAmount * LAMPORTS_PER_SOL;
      startBalanceGlobalAdmin = Number(
        (await provider.connection.getTokenAccountBalance(globalAdminTreasuryAccount)).value.amount,
      );
      // // @ts-ignore
      // (
      //   await provider.connection.getParsedAccountInfo(
      //     globalAdminTreasuryAccount
      //   )
      // ).value.data.parsed.info.tokenAmount.uiAmount * LAMPORTS_PER_SOL;
    }

    try {
      await program.methods
        .buyTicket(new anchor.BN(amount))
        .accounts({
          payer: payer.publicKey,
          raffleAccount: raffleAccountKey,
          admin: raffleAccount.admin,
          ticketAccount,
          globalState,
          globalAdmin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([payer])
        .remainingAccounts(treasuryMint ? remainingAccounts : [])
        .rpc();
    } catch (e) {
      console.log('Error with buying ticket:', e);
    }

    // check balances pre and post
    payerInfo = await provider.connection.getAccountInfo(payer.publicKey);
    let endBalancePayer = payerInfo!.lamports;
    adminInfo = await provider.connection.getAccountInfo(exampleAdmin.publicKey);
    let endBalanceAdmin = adminInfo!.lamports;
    globalAdminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    let endBalanceGlobalAdmin = globalAdminInfo!.lamports;
    if (treasuryMint && payerTreasuryAccount && adminTreasuryAccount && globalAdminTreasuryAccount) {
      endBalancePayer = Number((await provider.connection.getTokenAccountBalance(payerTreasuryAccount)).value.amount);

      endBalanceAdmin = Number((await provider.connection.getTokenAccountBalance(adminTreasuryAccount)).value.amount);

      endBalanceGlobalAdmin = Number(
        (await provider.connection.getTokenAccountBalance(globalAdminTreasuryAccount)).value.amount,
      );
    }
    console.log('Cost to initializer:', (startBalancePayer - endBalancePayer) / LAMPORTS_PER_SOL);
    console.log('Amount to admin:', (endBalanceAdmin - startBalanceAdmin) / LAMPORTS_PER_SOL);
    console.log('Amount to global admin:', (endBalanceGlobalAdmin - startBalanceGlobalAdmin) / LAMPORTS_PER_SOL);
  };

  const decideRaffle = async (raffleAccountKey: anchor.web3.PublicKey) => {
    const additionalComputeBudgetInstruction = ComputeBudgetProgram.requestUnits({
      units: 600000,
      additionalFee: 0,
    });
    try {
      await program.methods
        .decideRaffle()
        .accounts({
          authority: exampleAdmin.publicKey,
          raffleAccount: raffleAccountKey,
          recentSlothashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
        })
        .preInstructions([additionalComputeBudgetInstruction])
        .signers([exampleAdmin])
        .rpc();
    } catch (e) {
      console.log('Error deciding raffle:', e);
    }
    const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    if (raffleAccount.noWinners === 0) {
      console.log('Winning index:', raffleAccount.winnerIndex.toNumber());
    } else {
      console.log('Winning indices:', raffleAccount.winnerIndexes);
    }
  };

  const processRaffle = async (
    raffleAccountKey: anchor.web3.PublicKey,
    winner: anchor.web3.PublicKey,
    winningTicketAccount: anchor.web3.PublicKey,
  ) => {
    const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    const nftMint = raffleAccount.nftMint;
    const winnerTokenAccount = await getAssociatedTokenAddress(winner, nftMint);
    const [programAuthority] = await findRaffleProgramAuthority(raffleAccountKey, program.programId);
    const escrowAccount = await getAssociatedTokenAddress(programAuthority, nftMint);

    try {
      await program.methods
        .processRaffle()
        .accounts({
          authority: exampleAdmin.publicKey,
          raffleAccount: raffleAccountKey,
          winner,
          winnerTokenAccount,
          nftMint,
          winningTicketAccount,
          escrowAccount,
          programAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([exampleAdmin])
        .rpc();
    } catch (e) {
      console.log('Error processing raffle:', e);
    }

    const raffleNft = await provider.connection.getParsedTokenAccountsByOwner(winner, {
      mint: nftMint,
    });
    expect(raffleNft.value[0]!.account.data.parsed.info.tokenAmount.uiAmount).to.equal(1);

    const account = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(account.winner.toBase58()).to.equal(winner.toBase58());
  };

  const closeTicketAccount = async (raffleAccountKey: anchor.web3.PublicKey, index: number) => {
    try {
      const [ticketAccountKey] = await findTicketAccountKey(raffleAccountKey, new anchor.BN(index), program.programId);
      // const [globalState] = await findGlobalStateKey(program.programId)
      const ticketAccountInfo = await provider.connection.getAccountInfo(ticketAccountKey);
      if (ticketAccountInfo === null) {
        return;
      }
      const ticketAccount = await program.account.ticketAccount.fetch(ticketAccountKey);

      await program.methods
        .closeTicket(new anchor.BN(index))
        .accounts({
          authority: exampleAdmin.publicKey,
          raffleAccount: raffleAccountKey,
          ticketAccount: ticketAccountKey,
          ticketHolder: ticketAccount.holder,
        })
        .signers([exampleAdmin])
        .rpc();

      console.log('Closed ticket account ', index);
    } catch (e) {
      console.log('Issue closing ticket account:', e);
    }
  };

  it('Can create global state!', async () => {
    // Add your test here.
    const [globalState] = await findGlobalStateKey(program.programId);
    await program.methods
      .initState()
      .accounts({
        payer: provider.wallet.publicKey,
        admin: provider.wallet.publicKey,
        globalState,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([])
      .rpc();
  });

  it('Can create a raffle', async () => {
    const [instructions, signers] = await generateNft(exampleAdmin.publicKey, provider);
    await createNftRaffle(LAMPORTS_PER_SOL, instructions, signers);
  });

  // next buy ticket
  it('Can buy a ticket in the raffle', async () => {
    const [instructions, signers] = await generateNft(exampleAdmin.publicKey, provider);
    const raffleAccountKey = await createNftRaffle(LAMPORTS_PER_SOL, instructions, signers);
    const payer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL * 2),
      'confirmed',
    );
    await buyTicket(payer, raffleAccountKey, 1);
    const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(raffleAccount.ticketCount.toNumber()).to.equal(1);
  });

  it('Can distribute multiple tickets and decide raffle', async () => {
    const [instructions, signers] = await generateNft(exampleAdmin.publicKey, provider);
    const raffleAccountKey = await createNftRaffle(LAMPORTS_PER_SOL, instructions, signers);
    let adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const startBalanceAdmin = adminInfo!.lamports;
    let i = 0;
    const tickets = 5;
    while (i < tickets) {
      const payer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL * 2),
        'confirmed',
      );
      await buyTicket(payer, raffleAccountKey, 1);
      i++;
    }
    let raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(raffleAccount.ticketCount.toNumber()).to.equal(tickets);

    adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const endBalanceAdmin = adminInfo!.lamports;
    console.log('Amount to admin:', (endBalanceAdmin - startBalanceAdmin) / LAMPORTS_PER_SOL);
    await decideRaffle(raffleAccountKey);
    raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    const [winningTicketKey] = await findTicketAccountKey(
      raffleAccountKey,
      raffleAccount.winnerIndex,
      program.programId,
    );
    const winningTicket = await program.account.ticketAccount.fetch(winningTicketKey);
    const winner = winningTicket.holder;
    await processRaffle(raffleAccountKey, winner, winningTicketKey);
    let ticketAccounts = raffleAccount.ticketCount.toNumber();
    while (ticketAccounts > 0) {
      await closeTicketAccount(raffleAccountKey, ticketAccounts - 1);
      ticketAccounts--;
    }
  });

  it('Allows for a raffle with an SPL token', async () => {
    const [instructions, signers] = await generateNft(exampleAdmin.publicKey, provider);
    const mintAuthority = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(mintAuthority.publicKey, LAMPORTS_PER_SOL * 2),
      'confirmed',
    );
    // create treasury mint
    const treasuryMint = await Token.createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID,
    );
    const raffleAccountKey = await createNftRaffle(LAMPORTS_PER_SOL, instructions, signers, treasuryMint.publicKey);

    const globalAdminTreasuryAccount = await treasuryMint.createAssociatedTokenAccount(provider.wallet.publicKey);

    const adminTreasuryAccount = await treasuryMint.createAssociatedTokenAccount(exampleAdmin.publicKey);

    let i = 0;
    const tickets = 5;
    while (i < tickets) {
      const payer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL),
        'confirmed',
      );
      const payerTreasuryAccount = await treasuryMint.createAssociatedTokenAccount(payer.publicKey);
      await treasuryMint.mintTo(payerTreasuryAccount, mintAuthority.publicKey, [mintAuthority], 100 * LAMPORTS_PER_SOL);
      await buyTicket(
        payer,
        raffleAccountKey,
        1,
        treasuryMint.publicKey,
        payerTreasuryAccount,
        adminTreasuryAccount,
        globalAdminTreasuryAccount,
      );
      i++;
    }
    let raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(raffleAccount.ticketCount.toNumber()).to.equal(tickets);
    const endBalanceAdmin = Number(
      (await provider.connection.getTokenAccountBalance(adminTreasuryAccount)).value.amount,
    );

    console.log('Amount to admin:', endBalanceAdmin / LAMPORTS_PER_SOL);
    await decideRaffle(raffleAccountKey);
    raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    const [winningTicketKey] = await findTicketAccountKey(
      raffleAccountKey,
      raffleAccount.winnerIndex,
      program.programId,
    );
    const winningTicket = await program.account.ticketAccount.fetch(winningTicketKey);
    const winner = winningTicket.holder;
    await processRaffle(raffleAccountKey, winner, winningTicketKey);
    let ticketAccounts = raffleAccount.ticketCount.toNumber();
    while (ticketAccounts > 0) {
      if (ticketAccounts - 1 === raffleAccount.winnerIndex.toNumber()) {
        console.log('Skipping winning ticket');
      } else {
        await closeTicketAccount(raffleAccountKey, ticketAccounts - 1);
      }
      ticketAccounts--;
    }
  });

  it('Can create a regular raffle', async () => {
    const raffleAccountKey = await createRaffle(LAMPORTS_PER_SOL, 3);

    let adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const startBalanceAdmin = adminInfo!.lamports;
    const tickets = 15;

    const payer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL * 20),
      'confirmed',
    );
    await buyTicket(payer, raffleAccountKey, tickets);
    const raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(raffleAccount.ticketCount.toNumber()).to.equal(tickets);

    adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const endBalanceAdmin = adminInfo!.lamports;
    console.log('Amount to admin:', (endBalanceAdmin - startBalanceAdmin) / LAMPORTS_PER_SOL);

    await decideRaffle(raffleAccountKey);
    const account = await program.account.raffleAccount.fetch(raffleAccountKey);
    const actualWinnersIndex: number[] = [];
    for (let i = 0; i < account.noWinners; i++) {
      let winningIndex = raffleAccount.winnerIndex;
      let winningTicketKey: anchor.web3.PublicKey = PublicKey.default;
      let winningTicket: TicketAccount;
      while (winningTicketKey === PublicKey.default) {
        const possiblyWinningKey = (await findTicketAccountKey(raffleAccountKey, winningIndex, program.programId))[0];
        try {
          const accountData = await program.account.ticketAccount.fetch(possiblyWinningKey);
          if (accountData) {
            winningTicketKey = possiblyWinningKey;
            winningTicket = accountData;
            if (!actualWinnersIndex.includes(winningIndex.toNumber())) {
              actualWinnersIndex.push(winningIndex.toNumber());
            }
            console.log(`Winner ${i + 1}: ${accountData.holder.toBase58()}`);
          }
        } catch (e) {
          console.log('skipping to next ticket number');
          winningIndex = winningIndex.sub(new anchor.BN(1));
        }
      }
    }
    let ticketAccounts = raffleAccount.ticketCount.toNumber();
    console.log('Indexes', account.winnerIndexes);
    const indexes = account.winnerIndexes.map((x) => x.toNumber());
    console.log(indexes);
    while (ticketAccounts > 0) {
      if (actualWinnersIndex.includes(ticketAccounts - 1)) {
        console.log('Skipping winning account');
      } else {
        try {
          await closeTicketAccount(raffleAccountKey, ticketAccounts - 1);
        } catch (e) {
          console.log('No account to close, skipping');
        }
      }
      ticketAccounts--;
    }
    for (let i = 0; i < actualWinnersIndex.length; i++) {
      const possiblyWinningKey = (await findTicketAccountKey(raffleAccountKey, new anchor.BN(i), program.programId))[0];
      await program.account.ticketAccount.fetch(possiblyWinningKey);
      console.log('Winner', i, 'exists');
    }
  });

  it('Can handle bulk ticket purchases', async () => {
    const [instructions, signers] = await generateNft(exampleAdmin.publicKey, provider);
    const raffleAccountKey = await createNftRaffle(LAMPORTS_PER_SOL * 0.1, instructions, signers);

    let adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const startBalanceAdmin = adminInfo!.lamports;
    const player1 = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player1.publicKey, LAMPORTS_PER_SOL * 20),
      'confirmed',
    );
    await buyTicket(player1, raffleAccountKey, 100);

    const player2 = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(player2.publicKey, LAMPORTS_PER_SOL * 20),
      'confirmed',
    );
    await buyTicket(player2, raffleAccountKey, 100);
    let raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    expect(raffleAccount.ticketCount.toNumber()).to.equal(200);

    adminInfo = await provider.connection.getAccountInfo(provider.wallet.publicKey);
    const endBalanceAdmin = adminInfo!.lamports;
    console.log('Amount to admin:', (endBalanceAdmin - startBalanceAdmin) / LAMPORTS_PER_SOL);
    await decideRaffle(raffleAccountKey);
    raffleAccount = await program.account.raffleAccount.fetch(raffleAccountKey);
    console.log(
      ` winner index ${raffleAccount.winnerIndex.toNumber()}, ticket count: ${raffleAccount.ticketCount.toNumber()}`,
    );
    let winningIndex = raffleAccount.winnerIndex;
    let winningTicketKey: anchor.web3.PublicKey = PublicKey.default;
    let winningTicket: TicketAccount;
    while (winningTicketKey === PublicKey.default) {
      const possiblyWinningKey = (await findTicketAccountKey(raffleAccountKey, winningIndex, program.programId))[0];
      try {
        const accountData = await program.account.ticketAccount.fetch(possiblyWinningKey);
        if (accountData) {
          winningTicketKey = possiblyWinningKey;
          winningTicket = accountData;
        }
      } catch (e) {
        winningIndex = winningIndex.sub(new anchor.BN(1));
      }
    }

    const winner = winningTicket!.holder;
    await processRaffle(raffleAccountKey, winner, winningTicketKey);
    let ticketAccounts = raffleAccount.ticketCount.toNumber();
    while (ticketAccounts > 0) {
      await closeTicketAccount(raffleAccountKey, ticketAccounts - 1);
      ticketAccounts--;
    }
  });
});
