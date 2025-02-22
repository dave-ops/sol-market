const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');

async function main() {
    // Connect to local validator
    const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

    // Generate keypairs
    const payer = Keypair.generate(); // Buyer/Signer
    const seller = Keypair.generate(); // Seller
    const itemAccount = Keypair.generate(); // Account to store item data

    // Airdrop SOL to payer and seller for testing
    await connection.requestAirdrop(payer.publicKey, 2e9); // 2 SOL
    await connection.requestAirdrop(seller.publicKey, 2e9); // 2 SOL
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for airdrop confirmation

    // Replace with your deployed Program ID
    const programId = new PublicKey('<YourProgramPubkey>');

    // Instruction 0: List an item (price = 1 SOL = 1e9 lamports)
    const listInstructionData = Buffer.concat([
        Buffer.from([0]), // Instruction identifier (0 = list)
        Buffer.from(new Uint8Array(new BigUint64Array([1e9]).buffer)) // Price in lamports
    ]);

    const listTx = new Transaction().add({
        programId,
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },      // Payer
            { pubkey: itemAccount.publicKey, isSigner: false, isWritable: true }, // Item account
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // System program
        ],
        data: listInstructionData
    });

    console.log("Listing item...");
    await sendAndConfirmTransaction(connection, listTx, [payer]);

    // Instruction 1: Buy the item
    const buyInstructionData = Buffer.from([1]); // Instruction identifier (1 = buy)

    const buyTx = new Transaction().add({
        programId,
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },      // Buyer
            { pubkey: seller.publicKey, isSigner: false, isWritable: true },    // Seller
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // System program
            { pubkey: itemAccount.publicKey, isSigner: false, isWritable: true } // Item account
        ],
        data: buyInstructionData
    });

    console.log("Buying item...");
    await sendAndConfirmTransaction(connection, buyTx, [payer]);

    console.log("Test completed successfully!");
}

main().catch(console.error);