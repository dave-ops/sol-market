const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
    try {
        const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
        
        const payer = Keypair.generate(); // This will be both payer and seller
        const itemAccount = Keypair.generate();

        console.log("Requesting airdrops...");
        const rentExemption = await connection.getMinimumBalanceForRentExemption(73); // MarketplaceItem::LEN
        const payerAirdropSig = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL + rentExemption);
        await connection.confirmTransaction(payerAirdropSig);

        const programId = new PublicKey("HhV9DkMHyRBUWDh1fSr771jqNEr9qYCB1ZvbBaUpJZ7q"); // Replace with your actual program ID if different

        // List instruction
        const priceInLamports = BigInt(LAMPORTS_PER_SOL);
        const listInstructionData = Buffer.alloc(9);
        listInstructionData.writeUInt8(0, 0);
        listInstructionData.writeBigUInt64LE(priceInLamports, 1);

        const listTx = new Transaction().add({
            programId,
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },      // Payer
                { pubkey: itemAccount.publicKey, isSigner: true, isWritable: true }, // Item account
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },      // Seller (same as payer in this test)
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // System program
            ],
            data: listInstructionData
        });

        console.log("Listing item...");
        const listSig = await sendAndConfirmTransaction(connection, listTx, [payer, itemAccount]);
        console.log("List transaction signature:", listSig);

        // Buy instruction
        const buyInstructionData = Buffer.from([1]);

        const buyTx = new Transaction().add({
            programId,
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },      // Buyer (payer in this test)
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },     // Seller
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: itemAccount.publicKey, isSigner: false, isWritable: true }
            ],
            data: buyInstructionData
        });

        console.log("Buying item...");
        const buySig = await sendAndConfirmTransaction(connection, buyTx, [payer]);
        console.log("Buy transaction signature:", buySig);

        console.log("Test completed successfully!");
    } catch (error) {
        console.error("Error:", error);
        if (error.logs) {
            console.error("Transaction logs:", error.logs);
        }
        throw error;
    }
}

main().catch(console.error);