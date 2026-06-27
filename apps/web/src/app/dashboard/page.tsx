'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  FolderKanban,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, TYPE_LABELS, fullName } from '@/lib/labels';
import { useAuthStore } from '@/store/auth';
import type { CreativeRequest, PaginatedResponse, OrgUser } from '@/lib/types';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  gradient,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  gradient?: string;
  href?: string;
}) {
  const content = (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] shine group">
      {/* Top accent gradient line */}
      <div className={`absolute inset-x-0 top-0 h-px ${gradient ?? 'bg-gradient-to-r from-primary/60 via-purple-500/40 to-transparent'}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {description && (
            <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${gradient ? 'bg-white/5' : 'bg-primary/10'} transition-all group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: requestsData, isLoading: reqLoading } = useQuery({
    queryKey: ['requests', 'dashboard'],
    queryFn: () => apiGet<PaginatedResponse<CreativeRequest>>('/requests?limit=8'),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: () => apiGet<OrgUser[]>('/users'),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'dashboard'],
    queryFn: () => apiGet<PaginatedResponse<{ id: string; name: string }>>('/projects'),
  });

  const requests = requestsData?.items ?? [];
  const totalRequests = requestsData?.total ?? 0;
  const totalUsers = Array.isArray(usersData) ? usersData.length : 0;
  const totalProjects = projectsData?.total ?? (Array.isArray(projectsData) ? (projectsData as unknown[]).length : 0);

  const pendingCount = requests.filter((r) =>
    ['DRAFT', 'SUBMITTED'].includes(r.status),
  ).length;
  const inProgressCount = requests.filter((r) =>
    ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'CHANGES_REQUESTED'].includes(r.status),
  ).length;
  const completedCount = requests.filter((r) =>
    ['APPROVED', 'COMPLETED'].includes(r.status),
  ).length;

  const overdue = requests.filter(
    (r) => r.dueDate && new Date(r.dueDate) < new Date() && !['COMPLETED', 'CANCELLED', 'APPROVED'].includes(r.status),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <Link href="/dashboard/requests/new">
          <Button size="sm" className="gap-2 shadow-sm">
            <FileText className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={totalRequests}
          icon={FileText}
          description="All time"
          href="/dashboard/requests"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={TrendingUp}
          description="Active work"
          gradient="bg-gradient-to-r from-amber-500/60 via-orange-400/40 to-transparent"
          href="/dashboard/requests"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle2}
          description="Approved or done"
          gradient="bg-gradient-to-r from-emerald-500/60 via-teal-400/40 to-transparent"
          href="/dashboard/requests"
        />
        <StatCard
          title="Team Members"
          value={totalUsers}
          icon={Users}
          description={`${totalProjects} project${totalProjects !== 1 ? 's' : ''}`}
          href="/dashboard/team"
        />
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{overdue.length}</strong> request{overdue.length > 1 ? 's are' : ' is'} past due date.
          </span>
          <Link href="/dashboard/requests" className="ml-auto font-medium underline-offset-2 hover:underline">
            View
          </Link>
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent requests */}
        <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground">Recent Requests</h3>
            <Link href="/dashboard/requests">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {reqLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <FileText className="h-6 w-6 text-primary/60" />
              </div>
              <p className="text-sm font-medium text-foreground/70">No requests yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first creative request to get started</p>
              <Link href="/dashboard/requests/new" className="mt-4">
                <Button size="sm">New Request</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/dashboard/requests/${request.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-white/3 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{request.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {TYPE_LABELS[request.type]} · {fullName(request.requester)} · {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[request.priority]}`}>
                      {PRIORITY_LABELS[request.priority]}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[request.status]}`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-5 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-foreground mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Draft / Submitted', count: pendingCount, pct: totalRequests ? (pendingCount / totalRequests) * 100 : 0, color: 'bg-blue-500' },
                { label: 'In Progress / Review', count: inProgressCount, pct: totalRequests ? (inProgressCount / totalRequests) * 100 : 0, color: 'bg-amber-500' },
                { label: 'Completed / Approved', count: completedCount, pct: totalRequests ? (completedCount / totalRequests) * 100 : 0, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color} shadow-[0_0_6px] shadow-current`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold">{item.count}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-border/40">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-5 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'New Request', href: '/dashboard/requests/new', icon: FileText },
                { label: 'View Projects', href: '/dashboard/projects', icon: FolderKanban },
                { label: 'Team Members', href: '/dashboard/team', icon: Users },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="flex w-full items-center gap-3 rounded-lg border border-border/30 bg-secondary/30 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary/60 hover:text-foreground">
                    <action.icon className="h-4 w-4 shrink-0 text-primary/70" />
                    {action.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending attention */}
          <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-500/60 to-transparent" />
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400/80">Needs Attention</h3>
            </div>
            <p className="text-4xl font-bold text-amber-400">{pendingCount}</p>
            <p className="mt-1 text-xs text-amber-400/50">pending request{pendingCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
