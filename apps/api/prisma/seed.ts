import { Priority, PrismaClient, RequestStatus, RequestType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const org = await prisma.organization.upsert({
    where: { slug: 'acme-creative' },
    update: {},
    create: { name: 'Acme Creative', slug: 'acme-creative', plan: 'enterprise' },
  });

  const seedUser = async (
    email: string,
    firstName: string,
    lastName: string,
    role: Role,
  ) =>
    prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email } },
      update: { role },
      create: { organizationId: org.id, email, passwordHash, firstName, lastName, role },
    });

  const admin = await seedUser('admin@acme.test', 'Ada', 'Admin', Role.ORG_ADMIN);
  const manager = await seedUser('manager@acme.test', 'Max', 'Manager', Role.CREATIVE_MANAGER);
  const designer = await seedUser('designer@acme.test', 'Dana', 'Designer', Role.DESIGNER);
  const requester = await seedUser('requester@acme.test', 'Rex', 'Requester', Role.REQUESTER);

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Summer Campaign 2026',
      description: 'Seasonal marketing push across social and email.',
      ownerId: manager.id,
    },
  });

  await prisma.creativeRequest.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      requesterId: requester.id,
      assigneeId: designer.id,
      title: 'Instagram launch banner',
      description: 'Hero banner for the summer sale announcement.',
      type: RequestType.SOCIAL_MEDIA,
      priority: Priority.HIGH,
      status: RequestStatus.IN_PROGRESS,
      campaign: 'Summer Sale',
      department: 'Marketing',
      statusHistory: {
        create: [
          { toStatus: RequestStatus.DRAFT, changedById: requester.id },
          {
            fromStatus: RequestStatus.DRAFT,
            toStatus: RequestStatus.SUBMITTED,
            changedById: requester.id,
          },
          {
            fromStatus: RequestStatus.SUBMITTED,
            toStatus: RequestStatus.ASSIGNED,
            changedById: manager.id,
          },
          {
            fromStatus: RequestStatus.ASSIGNED,
            toStatus: RequestStatus.IN_PROGRESS,
            changedById: designer.id,
          },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with admin@acme.test / Password123!');
  void admin;
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
