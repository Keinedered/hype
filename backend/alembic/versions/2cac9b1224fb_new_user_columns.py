"""new user columns

Revision ID: 2cac9b1224fb
Revises:
Create Date: 2026-03-13 19:53:53.538603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2cac9b1224fb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to users
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(),
            nullable=False,
            server_default="user",  # keep default so existing rows get value
        ),
    )
    op.add_column(
        "users",
        sa.Column("last_login_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # Optional: if you want clean state for future inserts, remove server_default after fill
    # op.alter_column("users", "role", server_default=None)

def downgrade() -> None:
    # Drop in reverse order is safe
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "role")
    op.drop_column("users", "avatar_url")