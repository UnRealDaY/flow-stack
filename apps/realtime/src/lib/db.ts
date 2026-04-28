import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({ connectionString: config.db.url, max: 5 });

// Lightweight membership check — avoids pulling in the full Prisma client.
export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM workspace_members
     WHERE workspace_id = $1 AND user_id = $2
     LIMIT 1`,
    [workspaceId, userId],
  );
  return rows.length > 0;
}
