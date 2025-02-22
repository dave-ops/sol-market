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

kill -9 12345

