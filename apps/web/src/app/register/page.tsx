'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { apiPost, getErrorMessage } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await apiPost<AuthResponse>('/auth/register', data);
      setAuth(res);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left hero panel */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(252,87%,10%) 0%, hsl(222,28%,7%) 50%, hsl(174,60%,8%) 100%)',
        }}
      >
        <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-teal-500/15 blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/3 h-56 w-56 rounded-full bg-primary/20 blur-[70px]" />
        <div className="absolute inset-0 mesh-bg opacity-25" />

        <div className="relative z-10 max-w-sm text-center px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-2xl shadow-primary/40">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Join CreativeFlow</h1>
          <p className="mt-3 text-base text-white/50 leading-relaxed">
            Set up your organisation's creative workspace in under a minute.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { n: '10k+', l: 'Requests handled' },
              { n: '99.9%', l: 'Uptime SLA' },
              { n: '< 2s', l: 'AI enrichment' },
              { n: 'SOC2', l: 'Compliant' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/8 bg-white/4 p-3">
                <p className="text-lg font-bold text-white">{s.n}</p>
                <p className="text-xs text-white/40">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Free to start · No credit card required
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CreativeFlow AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create your workspace</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">You'll be set up as Organisation Admin</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Organisation Name
              </Label>
              <Input placeholder="Acme Inc." {...register('organizationName')} />
              {errors.organizationName && (
                <p className="text-xs text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  First Name
                </Label>
                <Input placeholder="Jane" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Name
                </Label>
                <Input placeholder="Doe" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work Email
              </Label>
              <Input type="email" placeholder="jane@company.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating…
                </span>
              ) : 'Create workspace'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
