"""create file_records

Revision ID: 0001
Revises:
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "file_records",
        sa.Column("id",              sa.String(),  nullable=False),
        sa.Column("idempotency_key", sa.String(),  nullable=False),
        sa.Column("workspace_id",    sa.String(),  nullable=False),
        sa.Column("original_key",    sa.String(),  nullable=False),
        sa.Column("processed_key",   sa.String(),  nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "done", "failed", name="filestatus"),
            nullable=False,
        ),
        sa.Column("error",      sa.Text(),     nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_file_records_idempotency_key", "file_records", ["idempotency_key"], unique=True)
    op.create_index("ix_file_records_workspace_id",    "file_records", ["workspace_id"],    unique=False)


def downgrade() -> None:
    op.drop_index("ix_file_records_workspace_id",    table_name="file_records")
    op.drop_index("ix_file_records_idempotency_key", table_name="file_records")
    op.drop_table("file_records")
    op.execute("DROP TYPE filestatus")
