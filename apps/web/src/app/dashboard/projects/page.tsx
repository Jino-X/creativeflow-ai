'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus, FileText, User, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiGet, apiPost, getErrorMessage } from '@/lib/api';
import { fullName } from '@/lib/labels';
import { useAuthStore } from '@/store/auth';
import type { Project } from '@/lib/types';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const CAN_CREATE: string[] = ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER'];

export default function ProjectsPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canCreate = user?.role && CAN_CREATE.includes(user.role);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiGet<Project[]>('/projects'),
  });

  const projects = Array.isArray(data) ? data : (data as any)?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (dto: CreateForm) => apiPost<Project>('/projects', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      setOpen(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects group related creative requests and assign ownership to a manager.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" className="gap-2 shadow-sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold">No projects yet</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Projects help organise requests into campaigns or workstreams. Create your first one to get started.
            </p>
            {canCreate && (
              <Button size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <Card key={project.id} className="group flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  {project.isArchived && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
                <CardTitle className="mt-3 text-base font-semibold leading-tight">
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {project.description || 'No description provided.'}
                </p>

                <div className="mt-auto space-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{project._count?.requests ?? 0} request{project._count?.requests !== 1 ? 's' : ''}</span>
                  </div>
                  {(project as any).owner && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{fullName((project as any).owner)}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/dashboard/requests?projectId=${project.id}`}
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                >
                  View requests <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" placeholder="e.g. Summer Campaign 2026" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Brief description of this project" {...register('description')} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
