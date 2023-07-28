import { Provider, web3 } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAssociatedTokenAddress } from './helpers/utils';

export const generateNft = async (
  payer: web3.PublicKey,
  provider: Provider,
): Promise<[web3.TransactionInstruction[], web3.Keypair]> => {
  const address = web3.Keypair.generate();
  const tokenAccount = await getAssociatedTokenAddress(payer, address.publicKey);
  const createMintInstructionsIx: web3.TransactionInstruction[] = await createMintInstructions(
    1,
    0,
    payer,
    payer,
    tokenAccount,
    address.publicKey,
    payer,
    provider,
  );
  return [createMintInstructionsIx, address];
};

export const createMintInstructions = async (
  numTokens: number,
  decimals: number,
  payer: web3.PublicKey,
  owner: web3.PublicKey,
  token: web3.PublicKey,
  mint: web3.PublicKey,
  mintAuthority: web3.PublicKey,
  provider: Provider,
): Promise<web3.TransactionInstruction[]> => {
  return [
    web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: 82,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mint, decimals, mintAuthority, null),
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      token,
      owner,
      payer,
    ),
    Token.createMintToInstruction(TOKEN_PROGRAM_ID, mint, token, mintAuthority, [], numTokens),
  ];
};
