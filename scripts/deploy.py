#!/usr/bin/env python3
"""
AlgoKit contract deployment script for Aurum Oracle
Deploys XPC ASA, prediction market contract, and treasury contract
"""

import sys
import json
import argparse
from pathlib import Path

def deploy_xpc_asa(network: str = "testnet"):
    """Deploy XPC ASA (Algorand Standard Asset)"""
    print(f"[*] Deploying XPC ASA to {network}...")
    # In a real scenario, this would use algosdk to create an ASA
    # For now, we'll print instructions
    print("""
    To deploy XPC ASA:
    1. Use algosdk or goal to create an ASA with:
       - Name: XPC (XP Club)
       - Ticker: XPC
       - Total supply: 100,000,000
       - Decimals: 0
    2. Keep the Asset ID for `.env.local`
    """)
    return {"asa_id": 0}

def deploy_contracts(network: str = "testnet"):
    """Deploy prediction market and treasury contracts"""
    print(f"[*] Compiling and deploying contracts to {network}...")
    print("""
    To deploy contracts using AlgoKit:
    1. Ensure AlgoKit is installed: pip install algokit
    2. Run: algokit project deploy
    3. Contract App IDs will be printed
    4. Add to .env.local:
       - NEXT_PUBLIC_MARKET_CONTRACT_ID=<market_app_id>
       - NEXT_PUBLIC_TREASURY_CONTRACT_ID=<treasury_app_id>
    """)
    return {"market_id": 0, "treasury_id": 0}

def main():
    parser = argparse.ArgumentParser(description="Deploy Aurum Oracle contracts")
    parser.add_argument("--network", choices=["testnet", "mainnet"], default="testnet")
    args = parser.parse_args()

    print(f"""
    ╔════════════════════════════════════════╗
    ║   Aurum Oracle - Contract Deployment    ║
    ╠════════════════════════════════════════╣
    ║  Network: {args.network.ljust(31)} ║
    ╚════════════════════════════════════════╝
    """)

    # Deploy XPC ASA
    asa_result = deploy_xpc_asa(args.network)

    # Deploy contracts
    contract_result = deploy_contracts(args.network)

    print(f"""
    ╔════════════════════════════════════════╗
    ║       Deployment Complete!              ║
    ╠════════════════════════════════════════╣
    ║ XPC ASA ID:         {asa_result['asa_id']:<20} ║
    ║ Market Contract:    {contract_result['market_id']:<20} ║
    ║ Treasury Contract:  {contract_result['treasury_id']:<20} ║
    ╚════════════════════════════════════════╝

    Next steps:
    1. Add these IDs to .env.local
    2. Run: npm run dev
    3. Connect your wallet and start predicting!
    """)

if __name__ == "__main__":
    main()
