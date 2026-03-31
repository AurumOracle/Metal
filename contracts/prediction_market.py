"""
Aurum Oracle — Prediction Market Smart Contract (PyTeal)
Algorand AVM bytecode for YES/NO binary prediction markets.

State Schema:
  - Global: question, deadline, oracle, yes_pool, no_pool, resolved, outcome
  - Local: voted (YES/NO), stake

Methods:
  - create(question, deadline, oracle_address)
  - vote_yes(stake)
  - vote_no(stake)
  - resolve(outcome)  [oracle only]
  - claim()  [winners withdraw]
"""

from pyteal import *


def approval_program():
    # Global state keys
    QUESTION = Bytes("question")
    DEADLINE = Bytes("deadline")
    ORACLE = Bytes("oracle")
    YES_POOL = Bytes("yes_pool")
    NO_POOL = Bytes("no_pool")
    RESOLVED = Bytes("resolved")
    OUTCOME = Bytes("outcome")  # "YES", "NO", or "VOID"

    # Local state keys
    VOTED = Bytes("voted")
    STAKE = Bytes("stake")

    # --- Create ---
    on_create = Seq(
        App.globalPut(QUESTION, Txn.application_args[0]),
        App.globalPut(DEADLINE, Btoi(Txn.application_args[1])),
        App.globalPut(ORACLE, Txn.application_args[2]),
        App.globalPut(YES_POOL, Int(0)),
        App.globalPut(NO_POOL, Int(0)),
        App.globalPut(RESOLVED, Int(0)),
        App.globalPut(OUTCOME, Bytes("")),
        Approve(),
    )

    # --- Opt In ---
    on_opt_in = Approve()

    # --- Vote ---
    vote_side = Txn.application_args[1]
    vote_stake = Btoi(Txn.application_args[2])

    is_valid_vote = And(
        # Market not resolved
        App.globalGet(RESOLVED) == Int(0),
        # Before deadline
        Global.latest_timestamp() < App.globalGet(DEADLINE),
        # Haven't voted yet
        App.localGet(Txn.sender(), VOTED) == Bytes(""),
        # Valid side
        Or(vote_side == Bytes("YES"), vote_side == Bytes("NO")),
        # Stake > 0
        vote_stake > Int(0),
        # Payment attached (group txn index 0 is payment)
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].amount() >= vote_stake,
        Gtxn[0].receiver() == Global.current_application_address(),
    )

    on_vote = Seq(
        Assert(is_valid_vote),
        App.localPut(Txn.sender(), VOTED, vote_side),
        App.localPut(Txn.sender(), STAKE, vote_stake),
        If(
            vote_side == Bytes("YES"),
            App.globalPut(YES_POOL, App.globalGet(YES_POOL) + vote_stake),
            App.globalPut(NO_POOL, App.globalGet(NO_POOL) + vote_stake),
        ),
        Approve(),
    )

    # --- Resolve ---
    is_oracle = Txn.sender() == App.globalGet(ORACLE)
    resolve_outcome = Txn.application_args[1]

    on_resolve = Seq(
        Assert(is_oracle),
        Assert(App.globalGet(RESOLVED) == Int(0)),
        Assert(
            Or(
                resolve_outcome == Bytes("YES"),
                resolve_outcome == Bytes("NO"),
                resolve_outcome == Bytes("VOID"),
            )
        ),
        App.globalPut(RESOLVED, Int(1)),
        App.globalPut(OUTCOME, resolve_outcome),
        Approve(),
    )

    # --- Claim ---
    user_voted = App.localGet(Txn.sender(), VOTED)
    user_stake = App.localGet(Txn.sender(), STAKE)
    outcome = App.globalGet(OUTCOME)
    total_pool = App.globalGet(YES_POOL) + App.globalGet(NO_POOL)

    winning_pool = If(
        outcome == Bytes("YES"),
        App.globalGet(YES_POOL),
        App.globalGet(NO_POOL),
    )

    # Payout = (user_stake / winning_pool) * total_pool
    # Using integer math: payout = user_stake * total_pool / winning_pool
    payout = WideRatio([user_stake, total_pool], [winning_pool])

    # 10% burn on losing side (deflationary mechanic)
    burn_amount = WideRatio([user_stake, Int(10)], [Int(100)])

    on_claim = Seq(
        Assert(App.globalGet(RESOLVED) == Int(1)),
        Assert(user_stake > Int(0)),
        If(
            outcome == Bytes("VOID"),
            # Refund on void
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.receiver: Txn.sender(),
                        TxnField.amount: user_stake,
                        TxnField.fee: Int(0),
                    }
                ),
                InnerTxnBuilder.Submit(),
            ),
            If(
                user_voted == outcome,
                # Winner — gets proportional share of total pool
                Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields(
                        {
                            TxnField.type_enum: TxnType.Payment,
                            TxnField.receiver: Txn.sender(),
                            TxnField.amount: payout,
                            TxnField.fee: Int(0),
                        }
                    ),
                    InnerTxnBuilder.Submit(),
                ),
                # Loser — stake is forfeited (10% burned)
                Seq(
                    # No payout for losers
                    Approve(),
                ),
            ),
        ),
        # Clear user state
        App.localPut(Txn.sender(), STAKE, Int(0)),
        Approve(),
    )

    # --- Router ---
    method = Txn.application_args[0]

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Assert(is_oracle)],
        [method == Bytes("vote"), on_vote],
        [method == Bytes("resolve"), on_resolve],
        [method == Bytes("claim"), on_claim],
    )

    return program


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    import os

    os.makedirs("build", exist_ok=True)

    with open("build/prediction_market_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=10)
        f.write(compiled)

    with open("build/prediction_market_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=10)
        f.write(compiled)

    print("✅ Compiled prediction_market to build/")
