import {
  Program,
  web3,
  workspace,
  Provider,
  setProvider,
} from '@project-serum/anchor'
import { MinimalMint } from '../target/types/minimal_mint'
import { MintLayout, TOKEN_PROGRAM_ID, Token } from '@solana/spl-token'
import { TOKEN_METADATA_PROGRAM_ID, candyMachine } from '../constants'
import {
  createAssociatedTokenAccountInstruction,
  getMetadata,
  getTokenWallet,
  MY_WALLET,
} from '../utils'
import { createSignature } from '../scripts/EthSignature'
import initializeCandyMachine from '../scripts/initializeCandyMachine'
import * as assert from 'assert'

const { Keypair, SystemProgram, PublicKey, SYSVAR_RENT_PUBKEY } = web3

describe('tests', () => {
  setProvider(Provider.env())

  const program = workspace.MinimalMint as Program<MinimalMint>

  // it('can initialize candy machine', async () => {
  //   initializeCandyMachine()
  // })

  /* after initializing, comment the above and uncomment the below */

  it('can mint an NFT', async () => {
    /* the transaction payer will almost always be yourself */
    const payer = MY_WALLET.publicKey

    try {
      /* this is just a configuration file with variables for each NFT */
      const candyMachineState = await program.account.candyMachine.fetch(
        candyMachine,
      )

      const mint = Keypair.generate()
      const token = await getTokenWallet(payer, mint.publicKey)
      const metadata = await getMetadata(mint.publicKey)

      const rent = await Provider.env().connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      )

      const nftName = 'Shrek #55'
      const nftImage = 'https://api.amoebits.io/get/amoebits_1'

      const {
        actual_message,
        signature,
        recoveryId,
        eth_address,
      } = await createSignature(nftName, nftImage)

      const trueRandomPair = Keypair.generate()
      const tx = await program.rpc.mintNft(
        Buffer.from(actual_message),
        Buffer.from(signature),
        recoveryId,
        nftName,
        nftImage,
        {
          accounts: {
            candyMachine,
            wallet: candyMachineState.wallet,
            mint: mint.publicKey,
            metadata,
            mintAuthority: MY_WALLET.publicKey,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            ixSysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          },
          signers: [mint, MY_WALLET],
          instructions: [
            /* Create the Secp256k1Program instruction on-chain*/
            web3.Secp256k1Program.createInstructionWithEthAddress({
              ethAddress: eth_address,
              message: actual_message,
              signature: signature,
              recoveryId: recoveryId,
            }),
            /* create a token/mint account and pay the rent */
            SystemProgram.createAccount({
              fromPubkey: MY_WALLET.publicKey,
              newAccountPubkey: mint.publicKey,
              space: MintLayout.span,
              lamports: rent,
              programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              mint.publicKey,
              0, // decimals
              MY_WALLET.publicKey, // mint authority
              trueRandomPair.publicKey, // freeze authority
            ),
            /* create an account that will hold your NFT */
            createAssociatedTokenAccountInstruction(
              token, // associated account
              MY_WALLET.publicKey, // payer
              MY_WALLET.publicKey, // wallet address (to)
              mint.publicKey, // mint/token address
            ),
            /* mint 1 (and only) NFT to the mint account */
            Token.createMintToInstruction(
              TOKEN_PROGRAM_ID,
              mint.publicKey, // from
              token, // account that will receive the metadata
              MY_WALLET.publicKey, // authority
              [],
              1, // amount
            ),
          ],
        },
      )
      console.log('Transaction signature:', tx)
    } catch (e) {
      throw e
    }
  })
})
