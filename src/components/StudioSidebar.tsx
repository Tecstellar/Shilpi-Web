import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  BarChart3,
  Bell,
  CalendarClock,
  Crown,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react';

export type SidebarSectionId =
  | 'dashboard'
  | 'customers'
  | 'packages'
  | 'payments'
  | 'gallery'
  | 'notification'
  | 'reminders'
  | 'expenses'
  | 'reports'
  | 'subscription'
  | 'settings';

export interface NavItemConfig {
  id: SidebarSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'primary' | 'secondary';
}

export const STUDIO_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'primary' },
  { id: 'customers', label: 'Customers', icon: Users, group: 'primary' },
  { id: 'packages', label: 'Packages', icon: Layers, group: 'primary' },
  { id: 'payments', label: 'Payments and Earnings', icon: Wallet, group: 'primary' },
  { id: 'gallery', label: 'My Gallery', icon: Images, group: 'primary' },
  { id: 'notification', label: 'Notification', icon: Bell, group: 'secondary' },
  { id: 'reminders', label: 'Reminders', icon: CalendarClock, group: 'secondary' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, group: 'secondary' },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'secondary' },
  { id: 'subscription', label: 'Subscription', icon: Crown, group: 'secondary' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'secondary' },
];

export interface SidebarBeauticianProfile {
  businessName: string;
  ownerName: string;
  city?: string;
  logoUri?: string;
  profilePhotoUrl?: string | null;
  businessTypes?: string[];
  role?: string;
}

interface StudioSidebarProps {
  activeSection: SidebarSectionId;
  onSelectSection: (section: SidebarSectionId) => void;
  profile: SidebarBeauticianProfile;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRoleLabel(rawRole?: string): string {
  if (!rawRole) return 'Studio Owner';
  const normalized = rawRole.trim().toLowerCase();
  if (normalized === 'owner') return 'Studio Owner';
  if (normalized === 'admin') return 'Studio Admin';
  if (normalized === 'artist') return 'Lead Artist';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function StudioSidebar({
  activeSection,
  onSelectSection,
  profile,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: StudioSidebarProps) {
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const activeIndicatorRef = useRef<HTMLDivElement>(null);
  const activeBarRef = useRef<HTMLSpanElement>(null);
  const hoverPillRef = useRef<HTMLDivElement>(null);
  const hoverDotRef = useRef<HTMLSpanElement>(null);
  const navButtonRefs = useRef<Partial<Record<SidebarSectionId, HTMLButtonElement | null>>>({});

  const sidebarRootRef = useRef<HTMLElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileBackdropRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(profile.ownerName || profile.businessName || 'Shilpa R.');
  const avatarSrc = profile.logoUri || profile.profilePhotoUrl || null;
  const enteredRoles =
    profile.businessTypes && profile.businessTypes.length > 0
      ? profile.businessTypes
      : [formatRoleLabel(profile.role)];

  // 1. Desktop Architectural Mount Choreography
  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

        tl.from('[data-sidebar-brand]', {
          y: 10,
          opacity: 0,
          duration: 0.45,
        })
          .from(
            '[data-sidebar-identity]',
            {
              y: 12,
              opacity: 0,
              duration: 0.45,
            },
            0.07
          )
          .from(
            '[data-sidebar-nav-item]',
            {
              x: -12,
              opacity: 0,
              duration: 0.4,
              stagger: 0.024,
              clearProps: 'transform',
            },
            0.12
          )
          .from(
            '[data-sidebar-footer]',
            {
              y: 8,
              opacity: 0,
              duration: 0.36,
            },
            0.26
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(
          '[data-sidebar-brand], [data-sidebar-identity], [data-sidebar-nav-item], [data-sidebar-footer]',
          {
            opacity: 0,
            duration: 0.2,
            ease: 'power1.out',
          }
        );
      });
    }, sidebarRootRef);

    return () => ctx.revert();
  }, []);

  // 2. Crisp Pure-White Active Capsule Glide + Crimson Indicator Pop
  useIsomorphicLayoutEffect(() => {
    const btn = navButtonRefs.current[activeSection];
    const indicator = activeIndicatorRef.current;
    const bar = activeBarRef.current;
    if (!btn || !indicator) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      gsap.to(indicator, {
        y: btn.offsetTop,
        height: btn.offsetHeight,
        opacity: 1,
        duration: reduced ? 0.15 : 0.42,
        ease: 'expo.out',
      });

      if (!reduced) {
        gsap.fromTo(
          indicator,
          { scaleX: 0.96 },
          { scaleX: 1, duration: 0.35, ease: 'expo.out', transformOrigin: 'left center' }
        );
      }

      if (bar && !reduced) {
        gsap.fromTo(
          bar,
          { scaleY: 0.35 },
          { scaleY: 1, duration: 0.36, ease: 'expo.out' }
        );
      }
    }, desktopNavRef);

    return () => ctx.revert();
  }, [activeSection, collapsed]);

  // 3. Mobile Drawer Slide-In & Staggered Reveal
  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = mobileDrawerRef.current;
    const backdrop = mobileBackdropRef.current;
    if (!drawer || !backdrop) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: reduced ? 0.15 : 0.26, ease: 'power2.out' }
      );
      gsap.fromTo(
        drawer,
        { x: reduced ? 0 : '-100%', opacity: reduced ? 0 : 1 },
        { x: '0%', opacity: 1, duration: reduced ? 0.18 : 0.38, ease: 'expo.out' }
      );
      if (!reduced) {
        gsap.from(drawer.querySelectorAll('[data-mobile-nav-item]'), {
          x: -14,
          opacity: 0,
          duration: 0.34,
          stagger: 0.02,
          delay: 0.08,
          ease: 'expo.out',
          clearProps: 'transform',
        });
      }
    });

    return () => ctx.revert();
  }, [mobileOpen]);

  // 4. Unique Multi-Layer GSAP Magnetic Hover Glide across Sidebar Items
  const handleNavHoverEnter = (
    e: React.MouseEvent<HTMLButtonElement>,
    isActive: boolean
  ) => {
    const btn = e.currentTarget;
    const hoverPill = hoverPillRef.current;
    const hoverDot = hoverDotRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hoverPill && !isActive) {
      gsap.to(hoverPill, {
        y: btn.offsetTop,
        height: btn.offsetHeight,
        opacity: 1,
        scale: 1,
        duration: reduced ? 0.12 : 0.3,
        ease: 'expo.out',
        overwrite: 'auto',
      });

      if (hoverDot && !reduced) {
        gsap.fromTo(
          hoverDot,
          { scale: 0.2, rotate: -45, opacity: 0 },
          {
            scale: 1,
            rotate: 45,
            opacity: 1,
            duration: 0.32,
            ease: 'back.out(2)',
            overwrite: 'auto',
          }
        );
      }
    } else if (hoverPill && isActive) {
      gsap.to(hoverPill, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }

    if (reduced || isActive) return;

    const iconEl = btn.querySelector('[data-nav-icon]');
    const labelEl = btn.querySelector('[data-nav-label]');
    const traceEl = btn.querySelector('[data-hover-trace]');

    if (iconEl) {
      gsap.to(iconEl, {
        y: -1.5,
        scale: 1.15,
        rotate: -7,
        duration: 0.24,
        ease: 'back.out(2.2)',
        overwrite: 'auto',
      });
    }
    if (labelEl && !collapsed) {
      gsap.to(labelEl, {
        x: 6,
        duration: 0.24,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
    if (traceEl) {
      gsap.to(traceEl, {
        scaleX: 1,
        opacity: 1,
        duration: 0.28,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
  };

  const handleNavHoverLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const iconEl = btn.querySelector('[data-nav-icon]');
    const labelEl = btn.querySelector('[data-nav-label]');
    const traceEl = btn.querySelector('[data-hover-trace]');

    if (iconEl) {
      gsap.to(iconEl, {
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    if (labelEl) {
      gsap.to(labelEl, {
        x: 0,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    if (traceEl) {
      gsap.to(traceEl, {
        scaleX: 0,
        opacity: 0,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  const handleNavMouseLeaveContainer = () => {
    const hoverPill = hoverPillRef.current;
    if (!hoverPill) return;
    gsap.to(hoverPill, {
      opacity: 0,
      scale: 0.97,
      duration: 0.22,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const renderBrandHeader = (isMobile: boolean) => (
    <div
      data-sidebar-brand
      className={`flex items-center justify-between px-4 pt-5 pb-4 ${
        collapsed && !isMobile ? 'px-3 justify-center' : ''
      }`}
    >
      <div
        className={`flex items-center gap-2.5 min-w-0 ${
          collapsed && !isMobile ? 'justify-center' : ''
        }`}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <defs>
            <linearGradient
              id="shilpiSidebarDarkGrad"
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff6b93" />
              <stop offset="55%" stopColor="#e8276b" />
              <stop offset="100%" stopColor="#c91352" />
            </linearGradient>
          </defs>
          <path
            d="M14.5 11C10.5 19.5 14 27 24.5 30.8L39.5 36.2C47.5 39.2 50 45.5 45.5 54C52.5 46.5 52.5 36 41.5 30.8L26 24.4C18 21 15.5 16 14.5 11Z"
            fill="url(#shilpiSidebarDarkGrad)"
          />
          <path d="M40 16L54 9V25L40 16Z" fill="#e8276b" />
          <path d="M24 48L10 55V39L24 48Z" fill="#ff6b93" />
        </svg>

        {(!collapsed || isMobile) && (
          <span className="font-display text-[17px] font-extrabold tracking-[0.16em] text-white truncate">
            SHILPI
          </span>
        )}
      </div>

      {isMobile ? (
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation drawer"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors ${
            collapsed ? 'hidden xl:flex' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );

  const renderBeauticianIdentity = (isMobile: boolean) => {
    const showExpanded = isMobile || !collapsed;
    return (
      <div
        data-sidebar-identity
        className={`mx-3 mb-3.5 px-3.5 py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] ${
          !showExpanded ? 'mx-2 px-2 flex justify-center' : ''
        }`}
      >
        <div className={`flex items-center gap-3 ${!showExpanded ? 'justify-center' : ''}`}>
          {/* Beautician Avatar: Crisp White + Shilpi Pink Ring */}
          <div
            className="w-10 h-10 rounded-full shrink-0 bg-white text-[#0c0c0f] flex items-center justify-center overflow-hidden ring-2 ring-[#e8276b]"
            title={`${profile.ownerName} · ${enteredRoles.join(', ')}`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.ownerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display text-xs font-extrabold tracking-wide text-[#0c0c0f]">
                {initials}
              </span>
            )}
          </div>

          {showExpanded && (
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-bold text-white truncate leading-tight">
                {profile.ownerName || 'Shilpa R.'}
              </div>
              <div className="text-[11px] font-medium text-white/70 truncate mt-0.5">
                {profile.businessName}
              </div>
            </div>
          )}
        </div>

        {/* Entered Beautician Roles (Pink & White Badges on Ink Black) */}
        {showExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-white/[0.09] flex flex-wrap gap-1.5">
            {enteredRoles.slice(0, 3).map((roleText) => (
              <span
                key={roleText}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#e8276b]/20 border border-[#ff5b8f]/35 text-[#ffd5e3] text-[10.5px] font-semibold leading-tight"
              >
                {roleText}
              </span>
            ))}
            {profile.role &&
              enteredRoles.every(
                (r) => r.toLowerCase() !== formatRoleLabel(profile.role).toLowerCase()
              ) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.1] border border-white/[0.14] text-white/90 text-[10.5px] font-semibold leading-tight">
                  {formatRoleLabel(profile.role)}
                </span>
              )}
          </div>
        )}
      </div>
    );
  };

  const primaryItems = STUDIO_NAV_ITEMS.filter((i) => i.group === 'primary');
  const secondaryItems = STUDIO_NAV_ITEMS.filter((i) => i.group === 'secondary');

  const renderNavItem = (item: NavItemConfig, isMobile: boolean) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const showExpanded = isMobile || !collapsed;

    return (
      <button
        key={item.id}
        ref={
          !isMobile
            ? (el) => {
                navButtonRefs.current[item.id] = el;
              }
            : undefined
        }
        type="button"
        data-sidebar-nav-item={!isMobile ? 'true' : undefined}
        data-mobile-nav-item={isMobile ? 'true' : undefined}
        onClick={() => {
          onSelectSection(item.id);
          if (isMobile) onCloseMobile();
        }}
        onMouseEnter={!isMobile ? (e) => handleNavHoverEnter(e, isActive) : undefined}
        onMouseLeave={!isMobile ? handleNavHoverLeave : undefined}
        aria-current={isActive ? 'page' : undefined}
        title={!showExpanded ? item.label : undefined}
        className={`group relative z-10 w-full h-10 rounded-xl flex items-center transition-colors ${
          showExpanded ? 'px-3.5 gap-3 justify-start' : 'px-0 justify-center'
        } ${
          isActive
            ? 'text-[#0c0c0f] font-bold'
            : 'text-[#d4d4d8] hover:text-white font-medium'
        }`}
      >
        <span
          data-nav-icon
          className={`shrink-0 flex items-center justify-center transition-colors ${
            isActive
              ? 'text-[#e8276b]'
              : 'text-[#fda4c4] group-hover:text-[#ff5b8f]'
          }`}
        >
          <Icon className="w-[17px] h-[17px]" />
        </span>

        {showExpanded && (
          <div className="relative flex-1 min-w-0 text-left">
            <span
              data-nav-label
              className="block text-[13px] tracking-[-0.01em] truncate"
            >
              {item.label}
            </span>

            {/* Micro-underline trace animated via GSAP on inactive hover */}
            {!isActive && (
              <span
                data-hover-trace
                aria-hidden="true"
                className="pointer-events-none block h-[1.5px] w-10 origin-left scale-x-0 opacity-0 rounded-full bg-gradient-to-r from-[#ff5b8f] to-transparent mt-[1px]"
              />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP OBSIDIAN INK + PINK + WHITE SIDEBAR               */}
      {/* ========================================================= */}
      <aside
        ref={sidebarRootRef}
        aria-label="Studio Navigation"
        className={`hidden lg:flex flex-col shrink-0 bg-[#0c0c0f] text-white border-r border-white/[0.08] h-screen sticky top-0 select-none transition-[width] duration-300 ease-out ${
          collapsed ? 'w-[78px]' : 'w-[266px]'
        }`}
      >
        {renderBrandHeader(false)}
        {renderBeauticianIdentity(false)}

        {/* Navigation List with Dual GSAP Layers: Pink Magnetic Hover Pill + White Active Capsule */}
        <nav
          aria-label="Studio Sections"
          className="flex-1 overflow-y-auto px-3 py-1"
        >
          <div
            ref={desktopNavRef}
            onMouseLeave={handleNavMouseLeaveContainer}
            className="relative space-y-0.5 pb-4"
          >
            {/* Layer 1: GSAP Magnetic Pink Hover Spotlight Pill */}
            <div
              ref={hoverPillRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-[#e8276b]/18 border border-[#ff5b8f]/35 opacity-0 flex items-center justify-end pr-3"
            >
              {!collapsed && (
                <span
                  ref={hoverDotRef}
                  className="w-1.5 h-1.5 bg-[#ff5b8f] rotate-45 shrink-0"
                />
              )}
            </div>

            {/* Layer 2: GSAP Pure White Active Capsule + Crimson Accent Cursor */}
            <div
              ref={activeIndicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-white shadow-[0_6px_22px_-6px_rgba(232,39,107,0.45)] opacity-0 flex items-center"
            >
              <span
                ref={activeBarRef}
                className="w-[3px] h-5 rounded-full bg-[#e8276b] ml-1 shrink-0"
              />
            </div>

            {primaryItems.map((item) => renderNavItem(item, false))}

            {/* Hairline Separator between Primary & Operations items */}
            <div className="my-2.5 mx-2 h-px bg-white/[0.09]" role="separator" />

            {secondaryItems.map((item) => renderNavItem(item, false))}
          </div>
        </nav>

        {/* Footer Session & Disconnect */}
        <div
          data-sidebar-footer
          className="p-3 border-t border-white/[0.09] space-y-1.5"
        >
          {collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="w-full h-9 rounded-xl flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`group w-full h-10 rounded-xl flex items-center text-[13px] font-medium text-[#d4d4d8] hover:text-white hover:bg-[#e8276b] transition-colors ${
              collapsed ? 'justify-center px-0' : 'px-3.5 gap-3'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#fda4c4] group-hover:text-white transition-colors" />
            {!collapsed && <span>Disconnect Studio</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE SLIDE-OVER DRAWER (PINK + WHITE + BLACK)           */}
      {/* ========================================================= */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            ref={mobileBackdropRef}
            onClick={onCloseMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-[#0c0c0f]/55 backdrop-blur-[2px]"
          />

          <aside
            ref={mobileDrawerRef}
            aria-label="Mobile Studio Navigation"
            className="relative z-10 w-[284px] max-w-[85vw] bg-[#0c0c0f] text-white h-full flex flex-col border-r border-white/[0.1] shadow-2xl"
          >
            {renderBrandHeader(true)}
            {renderBeauticianIdentity(true)}

            <nav aria-label="Mobile Studio Sections" className="flex-1 overflow-y-auto px-3 py-1">
              <div className="space-y-0.5 pb-4">
                {primaryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl ${
                      activeSection === item.id
                        ? 'bg-white shadow-[0_6px_20px_-6px_rgba(232,39,107,0.45)]'
                        : 'hover:bg-[#e8276b]/18'
                    }`}
                  >
                    {renderNavItem(item, true)}
                  </div>
                ))}

                <div className="my-2.5 mx-2 h-px bg-white/[0.09]" role="separator" />

                {secondaryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl ${
                      activeSection === item.id
                        ? 'bg-white shadow-[0_6px_20px_-6px_rgba(232,39,107,0.45)]'
                        : 'hover:bg-[#e8276b]/18'
                    }`}
                  >
                    {renderNavItem(item, true)}
                  </div>
                ))}
              </div>
            </nav>

            <div className="p-3 border-t border-white/[0.09]">
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                className="group w-full h-10 px-3.5 rounded-xl flex items-center gap-3 text-[13px] font-medium text-[#d4d4d8] hover:text-white hover:bg-[#e8276b] transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0 text-[#fda4c4] group-hover:text-white transition-colors" />
                <span>Disconnect Studio</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
