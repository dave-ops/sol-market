const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Function to parse command-line arguments (private keys only for now)
function parseCommandLineArgs() {
    const args = process.argv.slice(2); // Get arguments after the script name
    if (args.length !== 2) {
        console.error('Usage: node testg.js <payer_private_key> <item_account_private_key>');
        console.error('Private keys should be Base58-encoded 64-byte strings (e.g., from Keypair.secretKey)');
        process.exit(1);
    }

    const [payerKey, itemKey] = args;

    try {
        // Parse private keys (Base58-encoded 64-byte strings)
        const payer = Keypair.fromSecretKey(Buffer.from(payerKey, 'base58'));
        const itemAccount = Keypair.fromSecretKey(Buffer.from(itemKey, 'base58'));
        return { payer, itemAccount };
    } catch (e) {
        console.error('Error parsing private keys:', e.message);
        console.error('Ensure keys are Base58-encoded 64-byte strings (e.g., from Keypair.secretKey)');
        process.exit(1);
    }
}

async function main() {
    try {
        const { payer, itemAccount } = parseCommandLineArgs();
        const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

        console.log("Payer public key:", payer.publicKey.toBase58());
        console.log("Item account public key:", itemAccount.publicKey.toBase58());

        console.log("Requesting airdrops...");
        const rentExemption = await connection.getMinimumBalanceForRentExemption(73);
        console.log("Rent exemption required:", rentExemption, "lamports");

        // Airdrop funds to payer if needed (assuming new accounts might not have funds)
        const payerBalance = await connection.getBalance(payer.publicKey);
        if (payerBalance < (3 * LAMPORTS_PER_SOL + rentExemption)) {
            const neededLamports = 3 * LAMPORTS_PER_SOL + rentExemption - payerBalance;
            const payerAirdropSig = await connection.requestAirdrop(payer.publicKey, neededLamports);
            await connection.confirmTransaction(payerAirdropSig);
        }
        console.log("Payer balance after airdrop (or initial check):", await connection.getBalance(payer.publicKey), "lamports");

        const programId = new PublicKey("HhV9DkMHyRBUWDh1fSr771jqNEr9qYCB1ZvbBaUpJZ7q");
        console.log("Program ID:", programId.toBase58());

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