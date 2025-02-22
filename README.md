# sol-market

## install
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl --proto '=https' --tlsv1.2 -sSf https://release.anza.xyz | sh
rustup update
curl https://release.solana.com/stable/install | sh
```

## build
```bash
cargo build-bpf
Deploy to Solana:
```

# deploy
```bash
solana program deploy target/deploy/solana_marketplace.so
```