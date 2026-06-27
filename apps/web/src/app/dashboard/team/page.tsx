'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiGet, apiPost, getErrorMessage } from '@/lib/api';
import { ROLE_LABELS, ROLE_OPTIONS, initials } from '@/lib/labels';
import { useAuthStore } from '@/store/auth';
import type { OrgUser, Role } from '@/lib/types';

const inviteSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['ORG_ADMIN', 'CREATIVE_MANAGER', 'DESIGNER', 'REQUESTER'] as const),
});
type InviteForm = z.infer<typeof inviteSchema>;

const CAN_MANAGE: string[] = ['ORG_ADMIN', 'SUPER_ADMIN'];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ORG_ADMIN: 'bg-indigo-100 text-indigo-700',
  CREATIVE_MANAGER: 'bg-blue-100 text-blue-700',
  DESIGNER: 'bg-teal-100 text-teal-700',
  REQUESTER: 'bg-slate-100 text-slate-600',
};

export default function TeamPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const canManage = me?.role && CAN_MANAGE.includes(me.role);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<OrgUser[]>('/users'),
  });

  const users: OrgUser[] = Array.isArray(data) ? data : (data as any)?.items ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'REQUESTER' },
  });

  const roleValue = watch('role');

  const inviteMutation = useMutation({
    mutationFn: (dto: InviteForm) => apiPost('/users', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Team member added');
      setOpen(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organisation's members and their roles.
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2 shadow-sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {users.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(['ORG_ADMIN', 'CREATIVE_MANAGER', 'DESIGNER', 'REQUESTER'] as Role[]).map((role) => {
            const count = users.filter((u) => u.role === role).length;
            return (
              <Card key={role} className="p-4">
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
                <p className="mt-1 text-2xl font-bold">{count}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold">No team members yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first team member to get started.</p>
            {canManage && (
              <Button size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">
              Members
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {activeCount} active of {users.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="divide-y">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-3.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(u)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.firstName} {u.lastName}
                      {u.id === me?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      {u.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ROLE_COLORS[u.role as Role]}`}>
                      <Shield className="h-2.5 w-2.5" />
                      {ROLE_LABELS[u.role as Role]}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.isActive
                        ? <><CheckCircle className="h-2.5 w-2.5" /> Active</>
                        : <><XCircle className="h-2.5 w-2.5" /> Inactive</>
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input placeholder="Jane" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input placeholder="Doe" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="jane@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password *</Label>
              <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={roleValue} onValueChange={(v) => setValue('role', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter((r) => r !== 'SUPER_ADMIN').map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Adding…' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
