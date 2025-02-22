const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
    try {
        const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
        
        const payer = Keypair.generate();
        const itemAccount = Keypair.generate();

        console.log("Payer public key:", payer.publicKey.toBase58());
        console.log("Item account public key:", itemAccount.publicKey.toBase58());

        console.log("Requesting airdrops...");
        const rentExemption = await connection.getMinimumBalanceForRentExemption(73);
        console.log("Rent exemption required:", rentExemption, "lamports");
        
        const payerAirdropSig = await connection.requestAirdrop(payer.publicKey, 3 * LAMPORTS_PER_SOL + rentExemption);
        await connection.confirmTransaction(payerAirdropSig);
        console.log("Payer balance after airdrop:", await connection.getBalance(payer.publicKey), "lamports");

        // REPLACE THIS WITH YOUR NEW PROGRAM ID FROM DEPLOYMENT
        const programId = new PublicKey("HhV9DkMHyRBUWDh1fSr771jqNEr9qYCB1ZvbBaUpJZ7q");
        console.log("Program ID:", programId.toBase58());

        // Fund itemAccount with rent exemption
        const fundTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: itemAccount.publicKey,
                lamports: rentExemption
            })
        );
        await sendAndConfirmTransaction(connection, fundTx, [payer], { commitment: 'confirmed' });
        console.log("Item account balance after funding:", await connection.getBalance(itemAccount.publicKey), "lamports");

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
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },      // Seller (same as payer)
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // System program
            ],
            data: listInstructionData
        });

        console.log("Listing item...");
        const listSig = await sendAndConfirmTransaction(connection, listTx, [payer, itemAccount], {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
        });
        console.log("List transaction signature:", listSig);
        console.log("Item account balance after listing:", await connection.getBalance(itemAccount.publicKey), "lamports");

        // Buy instruction
        const buyInstructionData = Buffer.from([1]);

        const buyTx = new Transaction().add({
            programId,
            keys: [
                { pubkey: payer.publicKey, isSigner: true, isWritable: true },      // Buyer
                { pubkey: payer.publicKey, isSigner: false, isWritable: true },     // Seller
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: itemAccount.publicKey, isSigner: false, isWritable: true }
            ],
            data: buyInstructionData
        });

        console.log("Buying item...");
        const buySig = await sendAndConfirmTransaction(connection, buyTx, [payer], {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
        });
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