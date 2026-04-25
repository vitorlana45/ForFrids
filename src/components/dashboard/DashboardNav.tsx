'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Bell,
  Clock,
  Heart,
  Home,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  QrCode,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useDashboardAlerts } from '@/hooks/useDashboardAlerts';
import type { Profile } from '@/types/database';

interface Props {
  profile: Profile | null;
  pendingApprovalsCount?: number;
  readyCapsulesCount?: number;
  memorialLikesCount?: number;
}

const NAV_LINKS = [
  { href: '/dashboard',             label: 'Início',      Icon: Home        },
  { href: '/dashboard/capsulas',    label: 'Cápsulas',    Icon: LockKeyhole },
  { href: '/dashboard/qrcode',      label: 'QR Code',     Icon: QrCode      },
  { href: '/dashboard/aprovacoes',  label: 'Aprovações',  Icon: ShieldCheck },
  { href: '/dashboard/engajamento', label: 'Engajamento', Icon: BarChart2   },
  { href: '/dashboard/planos',      label: 'Planos',      Icon: Sparkles    },
];

export default function DashboardNav({
  profile,
  pendingApprovalsCount = 0,
  readyCapsulesCount = 0,
  memorialLikesCount = 0,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const alerts = useDashboardAlerts({ pendingApprovalsCount, readyCapsulesCount, memorialLikesCount });

  const totalAlerts = alerts.total;
  const hasEngagement = alerts.memorialLikesCount > 0;

  useEffect(() => setMounted(true), []);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  const isDark = mounted && resolvedTheme === 'dark';

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/20 bg-surface/90 shadow-[0_4px_20px_-5px_rgba(141,170,145,0.06)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 md:px-6">

          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-8">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/dashboard" className="text-2xl font-serif italic text-primary">
              Eterno Pet
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive(href)
                      ? 'bg-surface-container font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Alerts bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAlertsOpen(o => !o)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                aria-expanded={alertsOpen}
                aria-label="Abrir alertas"
              >
                <Bell className="h-5 w-5" />
                {totalAlerts > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold leading-none text-on-secondary">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setAlertsOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-[70] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-premium">
                    <div className="border-b border-outline-variant/15 px-5 py-4">
                      <p className="font-serif text-lg text-on-surface">Alertas</p>
                      <p className="text-xs text-on-surface-variant">Resumo do que precisa da sua atenção.</p>
                    </div>
                    <div className="p-2">
                      {alerts.pendingApprovalsCount > 0 && (
                        <Link href="/dashboard/aprovacoes" onClick={() => setAlertsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                            <ShieldCheck className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-on-surface">
                              {alerts.pendingApprovalsCount} {alerts.pendingApprovalsCount === 1 ? 'homenagem pendente' : 'homenagens pendentes'}
                            </span>
                            <span className="block text-xs text-on-surface-variant">Revise antes de publicar no memorial.</span>
                          </span>
                        </Link>
                      )}
                      {alerts.readyCapsulesCount > 0 && (
                        <Link href="/dashboard/capsulas" onClick={() => setAlertsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                            <Clock className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-on-surface">
                              {alerts.readyCapsulesCount} {alerts.readyCapsulesCount === 1 ? 'cápsula pronta' : 'cápsulas prontas'}
                            </span>
                            <span className="block text-xs text-on-surface-variant">Há mensagens do tempo para abrir.</span>
                          </span>
                        </Link>
                      )}
                      {hasEngagement && (
                        <Link href="/dashboard/engajamento" onClick={() => setAlertsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-300">
                            <Heart className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-on-surface">
                              {alerts.memorialLikesCount} {alerts.memorialLikesCount === 1 ? 'curtida em memorial' : 'curtidas em memoriais'}
                            </span>
                            <span className="block text-xs text-on-surface-variant">Veja quais memoriais estão recebendo carinho.</span>
                          </span>
                        </Link>
                      )}
                      {totalAlerts === 0 && !hasEngagement && (
                        <div className="px-5 py-8 text-center">
                          <span className="material-symbols-outlined mb-2 block text-[40px] text-outline">notifications</span>
                          <p className="font-serif text-base text-on-surface">Nada pendente</p>
                          <p className="mt-1 text-xs text-on-surface-variant">Quando algo precisar de atenção, aparece aqui.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Settings — hidden on mobile (in drawer) */}
            <Link
              href="/dashboard/configuracoes"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:flex"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Link>

            {/* Avatar + name */}
            <div className="ml-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-container bg-primary-fixed">
                <span className="font-serif text-sm font-bold text-primary">
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <span className="hidden text-sm text-on-surface-variant lg:block">
                {profile?.full_name}
              </span>
            </div>

            {/* Sign out — hidden on mobile (in drawer) */}
            <button
              onClick={signOut}
              className="hidden text-on-surface-variant transition-colors hover:text-on-surface sm:block"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />

      {/* Drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-[90] flex w-72 flex-col bg-surface shadow-premium transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <Link href="/dashboard" className="font-serif text-xl italic text-primary">
            Eterno Pet
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/50">
            Navegação
          </p>
          <ul className="space-y-0.5">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = isActive(href);
              const badge =
                href === '/dashboard/aprovacoes' && alerts.pendingApprovalsCount > 0
                  ? alerts.pendingApprovalsCount
                  : href === '/dashboard/capsulas' && alerts.readyCapsulesCount > 0
                  ? alerts.readyCapsulesCount
                  : null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                      active
                        ? 'bg-surface-container font-semibold text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge !== null && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold text-on-secondary">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-outline-variant/20 p-4 space-y-1">
          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-container bg-primary-fixed">
              <span className="font-serif text-sm font-bold text-primary">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">
                {profile?.full_name ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-on-surface-variant">{profile?.email}</p>
            </div>
          </div>

          {/* Settings */}
          <Link
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
