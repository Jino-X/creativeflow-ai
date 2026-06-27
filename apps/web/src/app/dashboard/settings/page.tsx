'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABELS, initials } from '@/lib/labels';
import type { Role } from '@/lib/types';

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ORG_ADMIN: 'bg-indigo-100 text-indigo-700',
  CREATIVE_MANAGER: 'bg-blue-100 text-blue-700',
  DESIGNER: 'bg-teal-100 text-teal-700',
  REQUESTER: 'bg-slate-100 text-slate-600',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and organisation details.</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Profile</CardTitle>
          <CardDescription>Your identity within this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Avatar + name hero */}
          <div className="mb-6 flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {user ? initials(user) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              {user?.role && (
                <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role as Role]}`}>
                  {ROLE_LABELS[user.role as Role]}
                </span>
              )}
            </div>
          </div>

          <div className="divide-y">
            <InfoRow label="First Name" value={user?.firstName} />
            <InfoRow label="Last Name" value={user?.lastName} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Role" value={user?.role ? ROLE_LABELS[user.role as Role] : undefined} />
          </div>
        </CardContent>
      </Card>

      {/* Organisation card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Organisation</CardTitle>
          <CardDescription>Details about the org this account belongs to.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <InfoRow label="Organisation ID" value={user?.organizationId} />
          </div>
        </CardContent>
      </Card>

      {/* Permissions summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Your Permissions</CardTitle>
          <CardDescription>What you can do based on your role.</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {[
                { label: 'Create & submit requests', allowed: true },
                { label: 'View all requests in org', allowed: ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER'].includes(user.role) },
                { label: 'Assign & transition requests', allowed: ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER', 'DESIGNER'].includes(user.role) },
                { label: 'Manage projects', allowed: ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER'].includes(user.role) },
                { label: 'Manage team members', allowed: ['ORG_ADMIN', 'SUPER_ADMIN'].includes(user.role) },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.allowed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  <span className={p.allowed ? 'text-foreground' : ''}>{p.label}</span>
                  {!p.allowed && <Badge variant="secondary" className="ml-auto text-[10px]">Restricted</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
