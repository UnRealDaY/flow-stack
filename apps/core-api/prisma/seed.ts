import { PrismaClient, PlanName, WorkspaceRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed plans
  const plans = await Promise.all(
    ([PlanName.FREE, PlanName.PRO, PlanName.ENTERPRISE] as const).map((name) =>
      prisma.plan.upsert({
        where: { name },
        update: {},
        create: { name, features: defaultFeatures(name) },
      }),
    ),
  );

  const freePlan = plans.find((p) => p.name === PlanName.FREE)!;

  // Demo account
  const password = await bcrypt.hash('demo1234', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@flowstack.dev' },
    update: {},
    create: { email: 'demo@flowstack.dev', name: 'Demo User', password },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      ownerId: demo.id,
      planId: freePlan.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: demo.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: demo.id, role: WorkspaceRole.OWNER },
  });

  console.log(`Seeded: demo@flowstack.dev / demo1234  →  workspace: ${workspace.slug}`);
}

function defaultFeatures(plan: PlanName): string[] {
  const map: Record<PlanName, string[]> = {
    FREE: ['5 members', '1GB storage', 'Basic support'],
    PRO: ['Unlimited members', '50GB storage', 'Priority support', 'Advanced analytics'],
    ENTERPRISE: ['Unlimited everything', 'SLA', 'Dedicated support', 'SSO'],
  };
  return map[plan];
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
