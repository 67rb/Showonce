# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
"""Durable, concurrent reservations for Hashir's authorized $5 Meta allowance."""
import math
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

from .common import AIError


def spark_cost_microusd(input_tokens, output_tokens):
    # Verified 2026-10-27: uncached $1.25 input / $4.25 output per million.
    # Ignore cache discounts to keep this estimate conservative.
    if any(type(v) is not int or v < 0 for v in (input_tokens, output_tokens)):
        raise ValueError("Invalid token counts")
    return (5 * input_tokens + 17 * output_tokens + 3) // 4


class MetaBudget:
    def __init__(self, path="data/hashir-meta-budget.sqlite3"):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.db() as db:
            db.execute("CREATE TABLE IF NOT EXISTS meta_budget_calls(id TEXT PRIMARY KEY, reserved INTEGER NOT NULL, charged INTEGER NOT NULL, status TEXT NOT NULL, input_tokens INTEGER, output_tokens INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=5)
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def reserve(self, maximum_microusd):
        if type(maximum_microusd) is not int or maximum_microusd <= 0:
            raise ValueError("Invalid reservation")
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            spent = db.execute("SELECT COALESCE(SUM(charged),0) FROM meta_budget_calls").fetchone()[0]
            if spent + maximum_microusd > 5_000_000:
                raise AIError("budget_exhausted", "The local US$5 Meta budget cannot cover another call.", False, 402)
            identifier = uuid.uuid4().hex
            # Charge the full reservation FIRST. A crash/timeout never refunds it.
            db.execute("INSERT INTO meta_budget_calls(id,reserved,charged,status) VALUES(?,?,?,'reserved')", (identifier, maximum_microusd, maximum_microusd))
            return identifier

    def settle(self, identifier, input_tokens, output_tokens):
        actual = spark_cost_microusd(input_tokens, output_tokens)
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT reserved,status FROM meta_budget_calls WHERE id=?", (identifier,)).fetchone()
            if not row or row[1] != "reserved":
                raise AIError("budget_record_invalid", "Budget reservation needs review.", False, 502)
            if actual > row[0]:
                # Fail closed for future calls if upstream exceeded the token cap.
                db.execute("UPDATE meta_budget_calls SET charged=5000000,status='usage_exceeded_reservation' WHERE id=?", (identifier,))
            else:
                db.execute("UPDATE meta_budget_calls SET charged=?,status='settled',input_tokens=?,output_tokens=? WHERE id=?", (actual, input_tokens, output_tokens, identifier))
        if actual > row[0]:
            raise AIError("budget_usage_mismatch", "Provider usage exceeded its reservation; further calls are blocked.", False, 502)
        return actual / 1_000_000

    def ensure_available(self):
        if self.summary()["remaining_usd"] <= 0:
            raise AIError("budget_exhausted", "The local US$5 Meta budget is exhausted.", False, 402)

    def summary(self):
        with self.db() as db:
            count, total, unresolved = db.execute("SELECT COUNT(*),COALESCE(SUM(charged),0),COALESCE(SUM(CASE WHEN status='reserved' THEN charged ELSE 0 END),0) FROM meta_budget_calls").fetchone()
        return {"limit_usd": 5, "charged_or_reserved_usd": total / 1_000_000, "unresolved_reservations_usd": unresolved / 1_000_000,
                "remaining_usd": max(0, 5_000_000-total) / 1_000_000, "generation_calls_reserved": count,
                "basis": "Conservative local token-price estimate; provider billing is authoritative."}
