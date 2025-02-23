const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Generate keypairs
const payer = Keypair.generate();
const itemAccount = Keypair.generate();

// Function to encode secret key to Base58, ensuring compatibility with bs58@4.0.1
function encodeToBase58(buffer) {
    try {
        return bs58.encode(buffer); // Use bs58.encode() from bs58@4.0.1
    } catch (e) {
        console.warn('Warning: bs58.encode failed. Ensure bs58 version is compatible.');
        return Buffer.from(buffer).toString('hex'); // Fallback to hex for debugging (not Base58)
    }
}

console.log("Payer private key:", encodeToBase58(payer.secretKey));
console.log("Payer public key:", payer.publicKey.toBase58());
console.log("Item account private key:", encodeToBase58(itemAccount.secretKey));
console.log("Item account public key:", itemAccount.publicKey.toBase58());

// Construct and output the command to run testg.js
const payerPrivateKey = encodeToBase58(payer.secretKey);
const itemAccountPrivateKey = encodeToBase58(itemAccount.secretKey);
const command = `node testg.js "${payerPrivateKey}" "${itemAccountPrivateKey}"`;
console.log("\nRun this command to use these keys with testg.js:");
console.log(command);