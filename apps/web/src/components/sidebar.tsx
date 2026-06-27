'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import type { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[];
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/requests', label: 'Requests', icon: FileText },
  {
    href: '/dashboard/projects',
    label: 'Projects',
    icon: FolderKanban,
    roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER', 'DESIGNER'],
  },
  {
    href: '/dashboard/team',
    label: 'Team',
    icon: Users,
    roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'CREATIVE_MANAGER'],
  },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role as Role | undefined;

  const visible = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <aside
      className="glass-sidebar fixed left-0 top-0 z-40 flex h-screen flex-col"
      style={{ width: 'var(--sidebar-w, 260px)' }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-white/5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
          <Sparkles className="h-4.5 w-4.5 text-white" />
          <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[hsl(var(--sidebar-bg))]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight tracking-tight">CreativeFlow</p>
          <p className="text-[10px] text-white/35 font-medium tracking-widest uppercase">AI Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">
          Navigation
        </p>

        {visible.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary/20 to-purple-500/10 text-white'
                  : 'text-white/45 hover:text-white/85 hover:bg-white/5',
              )}
            >
              {/* Active left indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-primary to-purple-400" />
              )}

              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20'
                  : 'text-white/40 group-hover:text-white/70 group-hover:bg-white/5',
              )}>
                <item.icon className="h-4 w-4" />
              </div>

              <span className="flex-1 tracking-tight">{item.label}</span>

              {item.badge && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Status chip */}
      <div className="mx-3 mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-medium text-emerald-400/80">AI Engine Active</span>
          <Zap className="ml-auto h-3 w-3 text-emerald-400/60" />
        </div>
      </div>

      {/* User section */}
      <div className="shrink-0 border-t border-white/5 p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/5 group"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-purple-600/30 text-xs font-bold text-white ring-1 ring-white/10">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-[10px] text-white/30">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
