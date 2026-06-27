'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Settings, ChevronRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import { apiPost } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Overview',
  requests: 'Requests',
  projects: 'Projects',
  team: 'Team',
  settings: 'Settings',
  new: 'New Request',
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const isUuid = /^[0-9a-f-]{36}$/i.test(seg);
    return {
      label: isUuid ? 'Detail' : (BREADCRUMB_MAP[seg] ?? seg),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className={c.isLast ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
            {c.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function Topbar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch {
      // ignore
    }
    clearAuth();
    router.push('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : '';

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between px-6"
      style={{
        left: 'var(--sidebar-w, 260px)',
        background: 'hsl(var(--background) / 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      <Breadcrumb />

      <div className="flex items-center gap-2">
        {/* Notifications bell — placeholder */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="h-4.5 w-4.5" />
        </Button>

        {/* Role badge */}
        <Badge variant="secondary" className="hidden sm:flex text-xs font-medium">
          {roleLabel}
        </Badge>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 py-1">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate max-w-[140px]">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
