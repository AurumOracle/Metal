#!/usr/bin/env python3
"""
Compile PyTeal contracts to TEAL bytecode.
Usage: python scripts/compile_teal.py

Requires: pip install pyteal
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def compile_contract(module_path: str, name: str):
    """Compile a PyTeal contract module to TEAL files."""
    import importlib.util

    spec = importlib.util.spec_from_file_location(name, module_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    from pyteal import compileTeal, Mode

    os.makedirs("build", exist_ok=True)

    approval = compileTeal(
        mod.approval_program(),
        mode=Mode.Application,
        version=10,
    )
    clear = compileTeal(
        mod.clear_state_program(),
        mode=Mode.Application,
        version=10,
    )

    approval_path = f"build/{name}_approval.teal"
    clear_path = f"build/{name}_clear.teal"

    with open(approval_path, "w") as f:
        f.write(approval)
    with open(clear_path, "w") as f:
        f.write(clear)

    print(f"  ✅ {name}")
    print(f"     Approval: {approval_path} ({len(approval)} bytes)")
    print(f"     Clear:    {clear_path} ({len(clear)} bytes)")


def main():
    contracts_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "contracts",
    )

    contracts = [
        ("prediction_market.py", "prediction_market"),
        ("xpc_treasury.py", "xpc_treasury"),
    ]

    print("🔨 Compiling PyTeal contracts...\n")

    for filename, name in contracts:
        path = os.path.join(contracts_dir, filename)
        if os.path.exists(path):
            try:
                compile_contract(path, name)
            except Exception as e:
                print(f"  ❌ {name}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")

    print("\n✨ Done! TEAL files in build/")


if __name__ == "__main__":
    main()
