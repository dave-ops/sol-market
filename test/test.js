const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Function to parse command-line arguments
function parseCommandLineArgs() {
    const args = process.argv.slice(2); // Get arguments after the script name
    if (args.length !== 2) {
        console.error('Usage: node testg.js <payer_private_key> <item_account_private_key>');
        console.error('OR: node testg.js <payer_public_key> <item_account_public_key>');
        process.exit(1);
    }

    const [payerKey, itemKey] = args;

    try {
        // Try to parse as private keys (Base58-encoded 64-byte strings)
        const payer = Keypair.fromSecretKey(Buffer.from(payerKey, 'base58'));
        const itemAccount = Keypair.fromSecretKey(Buffer.from(itemKey, 'base58'));
        return { payer, itemAccount, fromPrivateKeys: true };
    } catch (e) {
        // If that fails, try to parse as public keys (Base58-encoded strings)
        try {
            const payerPublicKey = new PublicKey(payerKey);
            const itemAccountPublicKey = new PublicKey(itemKey);
            // Create new keypairs for signing (since we only have public keys, we'll generate new secret keys)
            const payer = Keypair.generate();
            const itemAccount = Keypair.generate();
            return { payer, itemAccount, publicKeys: { payerPublicKey, itemAccountPublicKey }, fromPrivateKeys: false };
        } catch (e2) {
            console.error('Error parsing keys:', e2.message);
            process.exit(1);
        }
    }
}

async function main() {
    try {
        const { payer, itemAccount, publicKeys, fromPrivateKeys } = parseCommandLineArgs();
        const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

        console.log("Payer public key:", payer.publicKey.toBase58());
        console.log("Item account public key:", itemAccount.publicKey.toBase58());

        console.log("Requesting airdrops...");
        const rentExemption = await connection.getMinimumBalanceForRentExemption(73);
        console.log("Rent exemption required:", rentExemption, "lamports");

        // Airdrop only if using private keys (new accounts might not have funds)
        if (fromPrivateKeys) {
            const payerAirdropSig = await connection.requestAirdrop(payer.publicKey, 3 * LAMPORTS_PER_SOL + rentExemption);
            await connection.confirmTransaction(payerAirdropSig);
        }
        console.log("Payer balance after airdrop (or initial check):", await connection.getBalance(payer.publicKey), "lamports");

        // Use provided public keys if only public keys were passed
        const effectivePayerPublicKey = publicKeys?.payerPublicKey || payer.publicKey;
        const effectiveItemAccountPublicKey = publicKeys?.itemAccountPublicKey || itemAccount.publicKey;

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
                { pubkey: effectivePayerPublicKey, isSigner: true, isWritable: true },      // Payer
                { pubkey: effectiveItemAccountPublicKey, isSigner: true, isWritable: true }, // Item account
                { pubkey: effectivePayerPublicKey, isSigner: false, isWritable: true },      // Seller (same as payer)
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }     // System program
            ],
            data: listInstructionData
        });

        console.log("Listing item...");
        const listSig = await sendAndConfirmTransaction(connection, listTx, [payer, itemAccount], {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
        });
        console.log("List transaction signature:", listSig);
        console.log("Item account balance after listing:", await connection.getBalance(effectiveItemAccountPublicKey), "lamports");

        // Buy instruction
        const buyInstructionData = Buffer.from([1]);

        const buyTx = new Transaction().add({
            programId,
            keys: [
                { pubkey: effectivePayerPublicKey, isSigner: true, isWritable: true },      // Buyer
                { pubkey: effectivePayerPublicKey, isSigner: false, isWritable: true },     // Seller
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: effectiveItemAccountPublicKey, isSigner: false, isWritable: true }
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