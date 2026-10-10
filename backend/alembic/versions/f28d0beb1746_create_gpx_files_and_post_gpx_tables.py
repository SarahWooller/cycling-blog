"""create gpx_files and post_gpx tables

Revision ID: f28d0beb1746
Revises: 
Create Date: 2026-10-09 14:46:13.090003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f28d0beb1746'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'gpx_files',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploader_id', sa.String(length=36), nullable=True),
        sa.Column('summary', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'post_gpx',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('gpx_id', sa.String(length=36), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['gpx_id'], ['gpx_files.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'gpx_id', name='uq_post_gpx')
    )
    op.create_index(op.f('ix_post_gpx_gpx_id'), 'post_gpx', ['gpx_id'], unique=False)
    op.create_index(op.f('ix_post_gpx_post_id'), 'post_gpx', ['post_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_post_gpx_post_id'), table_name='post_gpx')
    op.drop_index(op.f('ix_post_gpx_gpx_id'), table_name='post_gpx')
    op.drop_table('post_gpx')
    op.drop_table('gpx_files')

