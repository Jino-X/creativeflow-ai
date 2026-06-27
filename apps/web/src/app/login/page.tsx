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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await apiPost<AuthResponse>('/auth/login', data);
      setAuth(res);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left hero panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(252,87%,10%) 0%, hsl(222,28%,7%) 50%, hsl(280,60%,10%) 100%)',
        }}>
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-purple-500/15 blur-[60px]" />
        <div className="absolute top-2/3 left-1/3 h-32 w-32 rounded-full bg-teal-500/10 blur-[50px]" />

        {/* Grid overlay */}
        <div className="absolute inset-0 mesh-bg opacity-30" />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-2xl shadow-primary/40">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CreativeFlow AI</h1>
          <p className="mt-3 text-base text-white/50 leading-relaxed">
            The enterprise creative operations platform powered by artificial intelligence.
          </p>

          <div className="mt-10 space-y-4 text-left">
            {[
              { icon: '✦', label: 'AI-powered request enrichment' },
              { icon: '✦', label: 'Real-time team collaboration' },
              { icon: '✦', label: 'End-to-end workflow automation' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-primary text-xs">{f.icon}</span>
                <span className="text-sm text-white/60">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="absolute bottom-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          All systems operational
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">CreativeFlow AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Create one
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-8 rounded-xl border border-border/50 bg-secondary/30 p-4 text-xs text-muted-foreground backdrop-blur-sm">
            <p className="font-semibold text-foreground/70 mb-1.5">Demo credentials</p>
            <p><span className="text-primary/80">admin@acme.test</span> · Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
