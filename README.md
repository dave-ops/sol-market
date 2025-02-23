# sol-market

## folder structure
```
sol-market/
├── src/
│   ├── models/
│   │   └── marketplace_item.rs
│   ├── repositories/
│   │   └── marketplace_item_repository.rs
│   └── lib.rs
├── Cargo.toml
├── .gitignore
├── LICENSE
└── README.md
```

## install
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
LATEST_VERSION=$(curl -s https://api.github.com/repos/anza-xyz/agave/releases/latest | grep -oP '"tag_name": "\K[^"]+' | sed 's/^v//'); FORMATTED_VERSION="v$LATEST_VERSION"; echo "Latest Solana CLI version: $FORMATTED_VERSION"; sh -c "$(curl -sSfL https://release.anza.xyz/$FORMATTED_VERSION/install)"
```

## build
```bash
cargo clean
cargo build-sbf
```

## start validator
```
tmux new-session -d -s solana_session 'solana-test-validator'
```

## deploy
```bash
solana program deploy target/deploy/solana_marketplace.so
```

## attach to local validator
```
solana config set --url http://127.0.0.1:8899
```

## get program id
```
solana program show --programs
```

## fund account
```
solana balance HhV9DkMHyRBUWDh1fSr771jqNEr9qYCB1ZvbBaUpJZ7q --url http://127.0.0.1:8899
solana airdrop 5 9U79odCo6xaTTGD3cNLrxq5qELyfPZhtmJGa1SGE3ZLP --url http://127.0.0.1:8899
solana airdrop 2 22xmAif9t3aLUNU3h1u8iHV7noVeGHqSWToZ29kSmT2U --url http://127.0.0.1:8899
```

## set program id
```
cd test
chmod +x set_program_id.sh
sh set_program_id.sh
cat program_id.env
source program_id.env
echo $SOLANA_PROGRAM_ID
chmod +r program_id.env
source program_id.env
```

## generate key/pairs
```
const { Keypair } = require('@solana/web3.js');

// Generate keypairs
const payer = Keypair.generate();
const itemAccount = Keypair.generate();

console.log("Payer private key:", Buffer.from(payer.secretKey).toString('base58'));
console.log("Payer public key:", payer.publicKey.toBase58());
console.log("Item account private key:", Buffer.from(itemAccount.secretKey).toString('base58'));
console.log("Item account public key:", itemAccount.publicKey.toBase58());

// Construct and output the command to run testg.js
const payerPrivateKey = Buffer.from(payer.secretKey).toString('base58');
const itemAccountPrivateKey = Buffer.from(itemAccount.secretKey).toString('base58');
const command = `node testg.js "${payerPrivateKey}" "${itemAccountPrivateKey}"`;
console.log("\nRun this command to use these keys with testg.js:");
console.log(command);
```

## run test
```
cd test
source program_id.env
```



## tmux
1. **attach to session**
```
tmux attach -t solana_session
```

2. **detach**
```
Ctrl-B
D
```

## why src/lib.rs and Not src/main.rs?
- entrypoint!(process_instruction);: This macro defines the entry point for a Solana program, not a traditional main function. Solana programs are libraries that the Solana runtime calls into via the defined entrypoint (process_instruction in this case).
- No main Function: Unlike a binary project (main.rs), this code doesn’t run as a standalone application on your machine. It’s compiled into a BPF (Berkeley Packet Filter) binary and deployed to the Solana blockchain.
- **Library Nature**: The code defines logic for a Solana program (e.g., listing and buying marketplace items), which is characteristic of a library (lib.rs) rather than an executable.

## transactions

### buy
needs 4 accounts:
- Buyer (signer, writable)
- Seller (writable)
- System program
- Item account (writable)

### process_instruction
- payer (signer, writable)
- item_account (writable)
- seller (not explicitly used in list_item, but still required by process_instruction)
- system_program (for account creation)