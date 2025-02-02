import { Program, web3, workspace, BN } from '@project-serum/anchor'
import idl from '../target/idl/minimal_mint.json'
import { MY_WALLET, parsePrice } from '../utils'
import { PREFIX, SUFIX } from '../constants'
import { MinimalMint } from '../target/types/minimal_mint'
import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
dotenv.config()

const main = async () => {
  const { SystemProgram, PublicKey } = web3

  const eth_signer: ethers.Wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    ethers.getDefaultProvider(),
  )
  const eth_address = ethers.utils.computeAddress(eth_signer.publicKey).slice(2)

  const program = workspace.MinimalMint as Program<MinimalMint>

  const [candyMachine, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(PREFIX), Buffer.from(SUFIX)],
    new PublicKey(idl.metadata.address),
  )

  const tx = await program.rpc.initializeCandyMachine(
    bump,
    {
      ethSigner: ethers.utils.arrayify('0x' + eth_address),
      price: new BN(parsePrice(0.5)),
      symbol: 'SMM',
      sellerFeeBasisPoints: 500, // 500 = 5%
      nftsMinted: new BN(0),
      goLiveDate: new BN(1640889000),
      maxSupply: new BN(48),
      creators: [{ address: MY_WALLET.publicKey, verified: true, share: 100 }],
    } as any,
    {
      accounts: {
        candyMachine,
        wallet: MY_WALLET.publicKey, // who will receive the SOL of each mint
        authority: MY_WALLET.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [MY_WALLET],
    },
  )
  console.log('The transaction tx:\n', tx)
}

export default main
