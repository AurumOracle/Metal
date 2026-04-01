#!/usr/bin/env python3
"""
Aurum Oracle — Contract Deployment Script
Deploys XPC ASA + prediction market + treasury contracts to Algorand.

Usage:
  python scripts/deploy.py --network testnet --mnemonic "word1 word2 ..."

Requirements:
  pip install algosdk pyteal python-dotenv

The script:
  1. Compiles PyTeal → TEAL
  2. Creates XPC ASA (100M supply, 6 decimals)
  3. Deploys prediction market contract
  4. Deploys treasury contract (funded with XPC for rewards)
  5. Writes all IDs to .env.local
"""

import sys
import os
import ssl
import json
import argparse
import importlib.util
from pathlib import Path

# Fix SSL cert verification on macOS Python installs
try:
    import certifi
    ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())
except ImportError:
    pass

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# ─── Network config ────────────────────────────────────────────────────────────

NETWORKS = {
    "testnet": {
        "algod": "https://testnet-api.algonode.cloud",
        "indexer": "https://testnet-idx.algonode.cloud",
        "port": 443,
        "token": "",
    },
    "mainnet": {
        "algod": "https://mainnet-api.algonode.cloud",
        "indexer": "https://mainnet-idx.algonode.cloud",
        "port": 443,
        "token": "",
    },
}

# XPC token config
XPC_TOTAL_SUPPLY = 100_000_000
XPC_DECIMALS = 6
XPC_UNIT_NAME = "XPC"
XPC_ASSET_NAME = "XP Club Token"
XPC_URL = "https://www.aurumoracle.com"

# Contract state schema
MARKET_GLOBAL_INTS = 5   # deadline, yes_pool, no_pool, resolved
MARKET_GLOBAL_BYTES = 3  # question, oracle, outcome
MARKET_LOCAL_INTS = 1    # stake
MARKET_LOCAL_BYTES = 1   # voted

TREASURY_GLOBAL_INTS = 4  # xpc_asa, total_burned, total_distributed, fee_rate
TREASURY_GLOBAL_BYTES = 1 # admin
TREASURY_LOCAL_INTS = 1   # subscribed_until
TREASURY_LOCAL_BYTES = 1  # tier


def get_algod_client(network: str):
    import algosdk.v2client.algod as algod_client
    cfg = NETWORKS[network]
    return algod_client.AlgodClient(cfg["token"], cfg["algod"], {"X-API-Key": cfg["token"]})


def compile_teal(source: str, algod) -> bytes:
    """Compile TEAL source using algod compile endpoint."""
    result = algod.compile(source)
    import base64
    return base64.b64decode(result["result"])


def load_contract(name: str):
    """Load approval_program + clear_state_program from contracts/name.py"""
    path = ROOT / "contracts" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def compile_contract(name: str, algod):
    """Compile a PyTeal contract, return (approval_bytes, clear_bytes)."""
    from pyteal import compileTeal, Mode

    print(f"  Compiling {name}...")
    mod = load_contract(name)

    approval_teal = compileTeal(mod.approval_program(), mode=Mode.Application, version=10)
    clear_teal = compileTeal(mod.clear_state_program(), mode=Mode.Application, version=10)

    # Save TEAL to build/
    build_dir = ROOT / "build"
    build_dir.mkdir(exist_ok=True)
    (build_dir / f"{name}_approval.teal").write_text(approval_teal)
    (build_dir / f"{name}_clear.teal").write_text(clear_teal)

    approval_bytes = compile_teal(approval_teal, algod)
    clear_bytes = compile_teal(clear_teal, algod)

    print(f"  ✅ {name} compiled ({len(approval_bytes)} / {len(clear_bytes)} bytes)")
    return approval_bytes, clear_bytes


def wait_for_confirmation(algod, txid: str, max_rounds: int = 10):
    last_round = algod.status()["last-round"]
    while True:
        try:
            info = algod.pending_transaction_info(txid)
            if info.get("confirmed-round", 0) > 0:
                return info
        except Exception:
            pass
        last_round += 1
        algod.status_after_block(last_round)
        if last_round > algod.status()["last-round"] + max_rounds:
            raise TimeoutError(f"Transaction {txid} not confirmed after {max_rounds} rounds")


def deploy_xpc_asa(algod, sender: str, private_key: str) -> int:
    """Create XPC ASA and return the asset ID."""
    import algosdk.transaction as txn

    print("\n[1/3] Creating XPC ASA...")

    params = algod.suggested_params()
    total_units = XPC_TOTAL_SUPPLY * (10 ** XPC_DECIMALS)

    create_txn = txn.AssetConfigTxn(
        sender=sender,
        sp=params,
        total=total_units,
        decimals=XPC_DECIMALS,
        unit_name=XPC_UNIT_NAME,
        asset_name=XPC_ASSET_NAME,
        url=XPC_URL,
        default_frozen=False,
        manager=sender,
        reserve=sender,
        freeze=sender,
        clawback=sender,
    )

    signed = create_txn.sign(private_key)
    txid = algod.send_transaction(signed)
    print(f"  TX: {txid}")
    info = wait_for_confirmation(algod, txid)
    asa_id = info["asset-index"]
    print(f"  ✅ XPC ASA created: ID {asa_id}")
    return asa_id


def deploy_app(
    algod,
    sender: str,
    private_key: str,
    approval_bytes: bytes,
    clear_bytes: bytes,
    global_schema,
    local_schema,
    app_args: list | None = None,
    accounts: list | None = None,
    name: str = "contract",
) -> int:
    """Deploy an AVM application and return the app ID."""
    import algosdk.transaction as txn

    params = algod.suggested_params()

    create_txn = txn.ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=txn.OnComplete.NoOpOC,
        approval_program=approval_bytes,
        clear_program=clear_bytes,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args or [],
        accounts=accounts or [],
    )

    signed = create_txn.sign(private_key)
    txid = algod.send_transaction(signed)
    print(f"  TX: {txid}")
    info = wait_for_confirmation(algod, txid)
    app_id = info["application-index"]
    print(f"  ✅ {name} deployed: App ID {app_id}")
    return app_id


def update_env_file(network: str, xpc_asa_id: int, market_id: int, treasury_id: int):
    """Write deployed IDs into .env.local."""
    env_path = ROOT / ".env.local"
    lines = []
    if env_path.exists():
        lines = env_path.read_text().splitlines()

    updates = {
        "NEXT_PUBLIC_ALGORAND_NETWORK": network,
        "NEXT_PUBLIC_XPC_ASA_ID": str(xpc_asa_id),
        "NEXT_PUBLIC_MARKET_CONTRACT_ID": str(market_id),
        "NEXT_PUBLIC_TREASURY_CONTRACT_ID": str(treasury_id),
    }

    # Update existing keys or append new ones
    existing_keys = set()
    new_lines = []
    for line in lines:
        key = line.split("=")[0].strip()
        if key in updates:
            new_lines.append(f"{key}={updates[key]}")
            existing_keys.add(key)
        else:
            new_lines.append(line)

    for key, val in updates.items():
        if key not in existing_keys:
            new_lines.append(f"{key}={val}")

    env_path.write_text("\n".join(new_lines) + "\n")
    print(f"\n  ✅ Written to .env.local")


def main():
    parser = argparse.ArgumentParser(description="Deploy Aurum Oracle contracts")
    parser.add_argument("--network", choices=["testnet", "mainnet"], default="testnet")
    parser.add_argument(
        "--mnemonic",
        help="25-word Algorand mnemonic for the deployer account",
        required=True,
    )
    args = parser.parse_args()

    try:
        from algosdk import mnemonic, account, encoding
    except ImportError:
        print("❌ algosdk not found. Install it: pip install py-algorand-sdk pyteal")
        sys.exit(1)

    print(f"""
╔══════════════════════════════════════════╗
║   Aurum Oracle — Contract Deployment     ║
╠══════════════════════════════════════════╣
║  Network: {args.network:<32} ║
╚══════════════════════════════════════════╝
""")

    private_key = mnemonic.to_private_key(args.mnemonic)
    sender = account.address_from_private_key(private_key)
    print(f"  Deployer: {sender}\n")

    algod = get_algod_client(args.network)

    # Check balance
    acct_info = algod.account_info(sender)
    balance_algo = acct_info["amount"] / 1_000_000
    print(f"  Balance: {balance_algo:.4f} ALGO")
    if balance_algo < 1.0:
        print("  ⚠️  Low balance. Get testnet ALGO from https://testnet.algoexplorer.io/dispenser")

    # 1. Deploy XPC ASA
    xpc_asa_id = deploy_xpc_asa(algod, sender, private_key)

    # 2. Compile contracts
    print("\n[2/3] Compiling contracts...")
    market_approval, market_clear = compile_contract("prediction_market", algod)
    treasury_approval, treasury_clear = compile_contract("xpc_treasury", algod)

    # 3. Deploy market contract
    print("\n[3/3] Deploying contracts...")
    from algosdk.transaction import StateSchema

    oracle_address = sender  # deployer is initial oracle; update via env later

    market_id = deploy_app(
        algod=algod,
        sender=sender,
        private_key=private_key,
        approval_bytes=market_approval,
        clear_bytes=market_clear,
        global_schema=StateSchema(num_uints=MARKET_GLOBAL_INTS, num_byte_slices=MARKET_GLOBAL_BYTES),
        local_schema=StateSchema(num_uints=MARKET_LOCAL_INTS, num_byte_slices=MARKET_LOCAL_BYTES),
        app_args=[
            b"AurumOracle v1",                       # question placeholder (re-set per market)
            (2**63 - 1).to_bytes(8, "big"),          # deadline far future (re-set per market)
            encoding.decode_address(oracle_address),
        ],
        name="prediction_market",
    )

    treasury_id = deploy_app(
        algod=algod,
        sender=sender,
        private_key=private_key,
        approval_bytes=treasury_approval,
        clear_bytes=treasury_clear,
        global_schema=StateSchema(num_uints=TREASURY_GLOBAL_INTS, num_byte_slices=TREASURY_GLOBAL_BYTES),
        local_schema=StateSchema(num_uints=TREASURY_LOCAL_INTS, num_byte_slices=TREASURY_LOCAL_BYTES),
        app_args=[
            xpc_asa_id.to_bytes(8, "big"),
            encoding.decode_address(sender),
        ],
        name="xpc_treasury",
    )

    # 4. Save to .env.local
    update_env_file(args.network, xpc_asa_id, market_id, treasury_id)

    print(f"""
╔══════════════════════════════════════════╗
║          Deployment Complete!            ║
╠══════════════════════════════════════════╣
║  XPC ASA ID:        {xpc_asa_id:<22} ║
║  Market Contract:   {market_id:<22} ║
║  Treasury Contract: {treasury_id:<22} ║
╠══════════════════════════════════════════╣
║  IDs written to .env.local               ║
╚══════════════════════════════════════════╝

Next steps:
  1. npm run dev
  2. Connect your deployer wallet in the app
  3. Use the admin panel to create the first market
  4. Set NEXT_PUBLIC_ORACLE_ADDRESS={sender} in .env.local
""")


if __name__ == "__main__":
    main()
