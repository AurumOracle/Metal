"""
Aurum Oracle — XPC Treasury Smart Contract (PyTeal)
Manages XPC token distribution, premium subscriptions, and burn mechanics.

State Schema:
  - Global: xpc_asa_id, admin, total_burned, total_distributed, fee_rate
  - Local: subscribed_until, tier

Methods:
  - create(xpc_asa_id, admin_address)
  - subscribe(tier)  [Silver=500 XPC/mo, Gold=2000 XPC/mo]
  - distribute_reward(recipient, amount)  [admin only]
  - burn(amount)
  - update_fee_rate(new_rate)  [admin only]
"""

from pyteal import *


def approval_program():
    # Global state
    XPC_ASA = Bytes("xpc_asa")
    ADMIN = Bytes("admin")
    TOTAL_BURNED = Bytes("total_burned")
    TOTAL_DISTRIBUTED = Bytes("total_distributed")
    FEE_RATE = Bytes("fee_rate")  # in basis points (70 = 0.7%)

    # Local state
    SUB_UNTIL = Bytes("subscribed_until")
    TIER = Bytes("tier")

    # Subscription costs (in XPC microunits)
    SILVER_COST = Int(500_000_000)  # 500 XPC (6 decimals)
    GOLD_COST = Int(2_000_000_000)  # 2000 XPC (6 decimals)
    MONTH_SECONDS = Int(30 * 24 * 60 * 60)

    # --- Create ---
    on_create = Seq(
        App.globalPut(XPC_ASA, Btoi(Txn.application_args[0])),
        App.globalPut(ADMIN, Txn.application_args[1]),
        App.globalPut(TOTAL_BURNED, Int(0)),
        App.globalPut(TOTAL_DISTRIBUTED, Int(0)),
        App.globalPut(FEE_RATE, Int(70)),  # 0.7%
        Approve(),
    )

    on_opt_in = Approve()

    is_admin = Txn.sender() == App.globalGet(ADMIN)

    # --- Subscribe ---
    sub_tier = Txn.application_args[1]
    cost = If(sub_tier == Bytes("gold"), GOLD_COST, SILVER_COST)

    on_subscribe = Seq(
        Assert(
            Or(sub_tier == Bytes("silver"), sub_tier == Bytes("gold"))
        ),
        # Verify XPC ASA transfer in group
        Assert(Gtxn[0].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[0].xfer_asset() == App.globalGet(XPC_ASA)),
        Assert(Gtxn[0].asset_amount() >= cost),
        Assert(Gtxn[0].asset_receiver() == Global.current_application_address()),
        # Set subscription
        App.localPut(
            Txn.sender(),
            SUB_UNTIL,
            Global.latest_timestamp() + MONTH_SECONDS,
        ),
        App.localPut(Txn.sender(), TIER, sub_tier),
        # Burn 50% of subscription
        Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.xfer_asset: App.globalGet(XPC_ASA),
                    TxnField.asset_amount: cost / Int(2),
                    TxnField.asset_receiver: Global.zero_address(),
                    TxnField.fee: Int(0),
                }
            ),
            InnerTxnBuilder.Submit(),
        ),
        App.globalPut(
            TOTAL_BURNED,
            App.globalGet(TOTAL_BURNED) + cost / Int(2),
        ),
        Approve(),
    )

    # --- Distribute Reward ---
    reward_recipient = Txn.application_args[1]
    reward_amount = Btoi(Txn.application_args[2])

    on_distribute = Seq(
        Assert(is_admin),
        Assert(reward_amount > Int(0)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: App.globalGet(XPC_ASA),
                TxnField.asset_amount: reward_amount,
                TxnField.asset_receiver: Txn.accounts[1],
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        App.globalPut(
            TOTAL_DISTRIBUTED,
            App.globalGet(TOTAL_DISTRIBUTED) + reward_amount,
        ),
        Approve(),
    )

    # --- Burn ---
    burn_amount = Btoi(Txn.application_args[1])

    on_burn = Seq(
        Assert(burn_amount > Int(0)),
        # Verify ASA transfer to contract
        Assert(Gtxn[0].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[0].xfer_asset() == App.globalGet(XPC_ASA)),
        Assert(Gtxn[0].asset_amount() >= burn_amount),
        # Send to zero address (burn)
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: App.globalGet(XPC_ASA),
                TxnField.asset_amount: burn_amount,
                TxnField.asset_receiver: Global.zero_address(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        App.globalPut(
            TOTAL_BURNED,
            App.globalGet(TOTAL_BURNED) + burn_amount,
        ),
        Approve(),
    )

    # --- Update Fee Rate ---
    new_rate = Btoi(Txn.application_args[1])

    on_update_fee = Seq(
        Assert(is_admin),
        Assert(new_rate <= Int(1000)),  # Max 10%
        App.globalPut(FEE_RATE, new_rate),
        Approve(),
    )

    # --- Router ---
    method = Txn.application_args[0]

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Assert(is_admin)],
        [method == Bytes("subscribe"), on_subscribe],
        [method == Bytes("distribute"), on_distribute],
        [method == Bytes("burn"), on_burn],
        [method == Bytes("update_fee"), on_update_fee],
    )

    return program


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    import os

    os.makedirs("build", exist_ok=True)

    with open("build/xpc_treasury_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=10)
        f.write(compiled)

    with open("build/xpc_treasury_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=10)
        f.write(compiled)

    print("✅ Compiled xpc_treasury to build/")
