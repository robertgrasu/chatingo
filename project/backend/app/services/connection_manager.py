"""
In-memory WebSocket Connection Manager for Live Chat.

Tracks visitor and operator WebSocket connections, manages conversation
assignments, and routes messages between visitors and operators.
"""

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # {session_id: WebSocket}
        self.visitor_connections: dict[str, WebSocket] = {}
        # {admin_user_id: WebSocket}
        self.operator_connections: dict[str, WebSocket] = {}
        # {admin_user_id: set of bot_ids they handle}
        self.operator_bots: dict[str, set[str]] = {}
        # {conversation_id: admin_user_id}
        self.assignments: dict[str, str] = {}

    # ── Visitor connections ──────────────────────────────────

    def connect_visitor(self, session_id: str, ws: WebSocket):
        self.visitor_connections[session_id] = ws

    def disconnect_visitor(self, session_id: str):
        self.visitor_connections.pop(session_id, None)

    # ── Operator connections ─────────────────────────────────

    def connect_operator(self, user_id: str, ws: WebSocket, bot_ids: list[str]):
        self.operator_connections[user_id] = ws
        self.operator_bots[user_id] = set(bot_ids) if bot_ids else set()

    def disconnect_operator(self, user_id: str):
        self.operator_connections.pop(user_id, None)
        self.operator_bots.pop(user_id, None)

    # ── Availability checks ──────────────────────────────────

    def is_any_operator_online(self, bot_id: str) -> bool:
        for user_id, bots in self.operator_bots.items():
            if bot_id in bots and user_id in self.operator_connections:
                return True
        return False

    def get_online_operators_for_bot(self, bot_id: str) -> list[str]:
        result = []
        for user_id, bots in self.operator_bots.items():
            if bot_id in bots and user_id in self.operator_connections:
                result.append(user_id)
        return result

    # ── Assignment tracking ──────────────────────────────────

    def assign_conversation(self, conversation_id: str, operator_id: str):
        self.assignments[conversation_id] = operator_id

    def unassign_conversation(self, conversation_id: str):
        self.assignments.pop(conversation_id, None)

    def get_operator_for_conversation(self, conversation_id: str) -> str | None:
        return self.assignments.get(conversation_id)

    def get_conversations_for_operator(self, operator_id: str) -> list[str]:
        return [cid for cid, oid in self.assignments.items() if oid == operator_id]

    # ── Message sending ──────────────────────────────────────

    async def send_to_visitor(self, session_id: str, message: dict):
        ws = self.visitor_connections.get(session_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect_visitor(session_id)

    async def send_to_operator(self, user_id: str, message: dict):
        ws = self.operator_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect_operator(user_id)

    async def broadcast_to_operators(self, bot_id: str, message: dict):
        operator_ids = self.get_online_operators_for_bot(bot_id)
        tasks = []
        for uid in operator_ids:
            ws = self.operator_connections.get(uid)
            if ws:
                tasks.append(self._safe_send(ws, uid, message))
        if tasks:
            await asyncio.gather(*tasks)

    async def _safe_send(self, ws: WebSocket, user_id: str, message: dict):
        try:
            await ws.send_json(message)
        except Exception:
            self.disconnect_operator(user_id)


# Singleton instance
manager = ConnectionManager()
