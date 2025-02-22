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

## run test
```
cd test
nvm install 20
nvm use 20
npm install
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