import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: Role;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
