import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import gsap from 'gsap';
import { io, Socket } from 'socket.io-client';
import {
  Menu,
  Plus,
  X,
} from 'lucide-react';
import LoginExperience from '@/components/LoginExperience';
import StudioSidebar, {
  STUDIO_NAV_ITEMS,
  SidebarSectionId,
} from '@/components/StudioSidebar';
import DashboardView, {
  SelectedDatePrefill,
  StudioBooking,
} from '@/components/DashboardView';
import { CustomersView, StudioClient } from '@/components/CustomersView';
import {
  PackagesView,
  PackagePayload,
  StudioPackage,
} from '@/components/PackagesView';
import { PaymentsView } from '@/components/PaymentsView';
import {
  GalleryView,
  GalleryLookPayload,
  StudioGalleryLook,
  StudioGalleryStreaks,
} from '@/components/GalleryView';
import {
  RemindersView,
  StudioReminder,
  StudioReminderPayload,
} from '@/components/RemindersView';
import { NotificationsView } from '@/components/NotificationsView';
import {
  ExpensesView,
  ExpenseCategoryKey,
  StudioExpense,
  StudioExpensePayload,
} from '@/components/ExpensesView';
import { ReportsView } from '@/components/ReportsView';
import { SubscriptionView } from '@/components/SubscriptionView';
import { SettingsView } from '@/components/SettingsView';
import { BookingDetailModal } from '@/components/BookingDetailModal';

const RAW_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://32.237.40.95:4000';
// Strip trailing /api/v1 or /api to prevent Socket.IO from treating it as an invalid namespace
const BACKEND_BASE = RAW_BACKEND_URL.replace(/\/api(\/v1)?\/?$/, '');
const BACKEND_URL = BACKEND_BASE;

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatBookingDisplayTime(startTime: any): { time: string; meridiem: 'AM' | 'PM' } {
  if (!startTime) return { time: '10:00', meridiem: 'AM' };

  if (typeof startTime === 'string') {
    // 1. Literal ISO time component e.g. "2026-11-24T19:00:00.000Z"
    const isoMatch = startTime.match(/T(\d{1,2}):(\d{2})/i);
    if (isoMatch) {
      let hrs = parseInt(isoMatch[1], 10);
      const mins = isoMatch[2];
      const meridiem: 'AM' | 'PM' = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      return {
        time: `${hrs}:${mins}`,
        meridiem,
      };
    }

    // 2. Simple time format e.g. "19:00" or "07:00 PM"
    const simpleMatch = startTime.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
      let hrs = parseInt(simpleMatch[1], 10);
      const mins = simpleMatch[2];
      const isPm = startTime.toUpperCase().includes('PM') || (!startTime.toUpperCase().includes('AM') && hrs >= 12);
      hrs = hrs % 12 || 12;
      return {
        time: `${hrs}:${mins}`,
        meridiem: isPm ? 'PM' : 'AM',
      };
    }
  }

  try {
    const d = new Date(startTime);
    if (!isNaN(d.getTime())) {
      let hrs = d.getUTCHours();
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const meridiem: 'AM' | 'PM' = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      return {
        time: `${hrs}:${mins}`,
        meridiem,
      };
    }
  } catch (e) {}

  return { time: '10:00', meridiem: 'AM' };
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UserSession {
  token: string;
  user: { id: string; phone: string; role: string };
  beautician: {
    businessName: string;
    ownerName: string;
    city: string;
    logoUri?: string;
    profilePhotoUrl?: string | null;
    businessTypes?: string[];
    createdAt?: string;
  };
}

const LOCAL_STORAGE_CACHE_KEY = 'shilpi_studio_cached_data_v2';

interface CachedStudioData {
  appointments?: StudioBooking[];
  clients?: StudioClient[];
  packages?: StudioPackage[];
  expenses?: StudioExpense[];
  reminders?: StudioReminder[];
  galleryLooks?: StudioGalleryLook[];
  galleryStreaks?: StudioGalleryStreaks;
  monthExpenses?: number;
  registeredAt?: string | null;
}

function getLocalCachedData(): CachedStudioData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ShilpiWebTerminal() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'phone' | 'qr'>('qr');

  // Phone Login State (Remembers real artist phone, never fake demo)
  const [phone, setPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shilpi_last_login_phone') || '';
    }
    return '';
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [demoNotice, setDemoNotice] = useState('');

  // QR Pairing State
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pairingStatus, setPairingStatus] = useState<string>('Connecting to terminal socket gateway...');

  // Dashboard Data State
  const [activeSection, setActiveSection] = useState<SidebarSectionId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionContentRef = useRef<HTMLDivElement>(null);

  const cachedData = useMemo(() => getLocalCachedData(), []);

  // Real data state (hydrated instantly from cache, empty if fresh, NO mock data!)
  const [appointments, setAppointments] = useState<StudioBooking[]>(() => cachedData?.appointments || []);
  const [clients, setClients] = useState<StudioClient[]>(() => cachedData?.clients || []);
  const [packages, setPackages] = useState<StudioPackage[]>(() => cachedData?.packages || []);
  const [monthExpenses, setMonthExpenses] = useState<number>(() => cachedData?.monthExpenses || 0);
  const [registeredAt, setRegisteredAt] = useState<string | null>(() => cachedData?.registeredAt || null);
  const [galleryLooks, setGalleryLooks] = useState<StudioGalleryLook[]>(() => cachedData?.galleryLooks || []);
  const [galleryStreaks, setGalleryStreaks] = useState<StudioGalleryStreaks>(() => cachedData?.galleryStreaks || {
    completedOrders: 0,
    galleryLooks: 0,
    totalCards: 0,
    postedLooks: 0,
    weeklyStreak: 0,
    tierName: 'New Studio',
    nextTarget: 1,
    progressPercent: 0,
  });
  const [reminders, setReminders] = useState<StudioReminder[]>(() => cachedData?.reminders || []);
  const [expenses, setExpenses] = useState<StudioExpense[]>(() => cachedData?.expenses || []);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncingData, setSyncingData] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<StudioBooking | null>(null);

  // New Booking Form State
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [selectedExistingClient, setSelectedExistingClient] = useState<StudioClient | null>(null);
  const [clientSearchFocused, setClientSearchFocused] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('+91 ');
  const [newBookingDate, setNewBookingDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newBookingTime, setNewBookingTime] = useState('09:00');
  const [newService, setNewService] = useState('Bridal Makeup');
  const [newVenue, setNewVenue] = useState('Studio');
  const [newTotal, setNewTotal] = useState('15000');
  const [newAdvance, setNewAdvance] = useState('5000');

  // Customer matching filter for live search dropdown
  const matchingClients = useMemo(() => {
    const q = newClientName.trim().toLowerCase();
    const digits = newClientName.replace(/\D/g, '');
    if (!q) return clients.slice(0, 6);
    return clients.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch = digits.length > 0 && c.phone && c.phone.replace(/\D/g, '').includes(digits);
      return nameMatch || phoneMatch;
    }).slice(0, 8);
  }, [clients, newClientName]);

  // 1. Initialize Real-Time Socket Connection for Terminal Pairing
  useEffect(() => {
    // Generate an immediate high-contrast pairing QR code on frame 1 so user never waits
    const initSessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'shilpi_term_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const initialPayload = JSON.stringify({
      app: 'shilpi',
      action: 'link_terminal',
      sessionId: initSessionId,
      timestamp: Date.now(),
    });
    setQrDataUrl((prev) => prev || `https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=4&data=${encodeURIComponent(initialPayload)}`);

    const s = io(BACKEND_BASE, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    setSocket(s);

    const requestQr = () => {
      s.emit('request_pairing_qr');
    };

    s.on('connect', () => {
      requestQr();
    });

    s.on('connect_error', (err) => {
      console.warn('[Terminal Socket] connection notice:', err.message);
      setPairingStatus('Ready for scan');
    });

    s.on('pairing_qr_generated', (data: { sessionId: string; qrDataUrl: string; expiresInSeconds: number }) => {
      setQrDataUrl(data.qrDataUrl);
      setPairingStatus('Ready for scan');
    });

    s.on('pairing_authenticated', (data: any) => {
      if (data.success) {
        const userSession: UserSession = {
          token: data.token,
          user: data.user,
          beautician: data.beautician,
        };
        saveAndSetSession(userSession);
      }
    });

    s.on('data_sync', () => {
      const token = localStorage.getItem('shilpi_token');
      if (token) {
        fetchStudioSyncData(token);
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const saveAndSetSession = (userSession: UserSession) => {
    setSession(userSession);
    localStorage.setItem('shilpi_token', userSession.token);
    localStorage.setItem('shilpi_user_session', JSON.stringify(userSession));
  };

  const handleLogout = () => {
    localStorage.removeItem('shilpi_token');
    localStorage.removeItem('shilpi_user_session');
    localStorage.removeItem(LOCAL_STORAGE_CACHE_KEY);
    setAppointments([]);
    setClients([]);
    setPackages([]);
    setExpenses([]);
    setReminders([]);
    setGalleryLooks([]);
    setSession(null);
    setActiveSection('dashboard');
    setMobileMenuOpen(false);
    setOtpSent(false);
    setOtp('');
  };

  // GSAP subtle entrance when switching sidebar sections
  useIsomorphicLayoutEffect(() => {
    if (!session || !sectionContentRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionContentRef.current,
        { opacity: 0, y: reduced ? 0 : 10 },
        { opacity: 1, y: 0, duration: reduced ? 0.16 : 0.34, ease: 'expo.out', clearProps: 'transform' }
      );
    });
    return () => ctx.revert();
  }, [activeSection, session]);

  const fetchStudioSyncData = useCallback(async (token: string, silent: boolean = true) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsRes, expensesRes, overviewRes, clientsRes, packagesRes, meRes, galleryRes, remindersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/bookings`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/expenses`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/dashboard/overview`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/clients`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/packages`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/auth/me`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/gallery`, { headers }).then((r) => r.json()).catch(() => null),
        fetch(`${BACKEND_URL}/api/v1/reminders`, { headers }).then((r) => r.json()).catch(() => null),
      ]);

      let nextAppointments: StudioBooking[] = [];
      let nextClients: StudioClient[] = [];
      let nextPackages: StudioPackage[] = [];
      let nextExpenses: StudioExpense[] = [];
      let nextReminders: StudioReminder[] = [];
      let nextGalleryLooks: StudioGalleryLook[] = [];
      let nextMonthExpenses = 0;
      let nextRegisteredAt = '';

      if (remindersRes?.success && Array.isArray(remindersRes.data)) {
        nextReminders = remindersRes.data.map((r: any) => ({
          id: r.id,
          text: r.text,
          kind: r.kind || 'General',
          remindAt: r.remindAt,
          isCompleted: Boolean(r.isCompleted),
          bookingId: r.bookingId || null,
          createdAt: r.createdAt,
        }));
        setReminders(nextReminders);
      }

      if (galleryRes?.success && Array.isArray(galleryRes.data)) {
        nextGalleryLooks = galleryRes.data.map((g: any) => ({
          id: g.id,
          title: g.title || 'Finished Look',
          place: g.place || '',
          bookingId: g.bookingId || null,
          imageUrl: g.imageUrl || '',
          extraImages: Array.isArray(g.extraImages) ? g.extraImages : [],
          caption: g.caption || '',
          instagramHandle: g.instagramHandle || '',
          instagramUrl: g.instagramUrl || '',
          postedToInstagram: Boolean(g.postedToInstagram),
          createdAt: g.createdAt || new Date().toISOString(),
        }));
        setGalleryLooks(nextGalleryLooks);
        if (galleryRes.streaks) {
          setGalleryStreaks(galleryRes.streaks);
        }
      }

      if (meRes?.success && meRes.beautician?.createdAt) {
        nextRegisteredAt = meRes.beautician.createdAt;
        setRegisteredAt(nextRegisteredAt);
      }

      if (packagesRes?.success && Array.isArray(packagesRes.data)) {
        nextPackages = packagesRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          serviceType: p.serviceType || 'bridal',
          description: p.description || '',
          durationMinutes: Number(p.durationMinutes || 60),
          priceRupees:
            p.priceRupees !== undefined
              ? Number(p.priceRupees)
              : Math.round(Number(p.pricePaise || 0) / 100),
          isActive: p.isActive !== false,
        }));
        setPackages(nextPackages);
      }

      if (clientsRes?.success && Array.isArray(clientsRes.data)) {
        nextClients = clientsRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          notes: c.notes || '',
          isVip: Boolean(c.isVip),
          isActive: c.isActive !== false,
          bookingsCount: c._count?.bookings ?? 0,
        }));
        setClients(nextClients);
      }

      if (bookingsRes?.success && Array.isArray(bookingsRes.data)) {
        nextAppointments = bookingsRes.data.map((b: any) => {
          const rawDateStr = typeof b.bookingDate === 'string' ? b.bookingDate.split('T')[0] : '';
          let year = 2026, mIdx = 10, day = 25;
          if (rawDateStr) {
            const parts = rawDateStr.split('-');
            year = parseInt(parts[0], 10) || 2026;
            mIdx = (parseInt(parts[1], 10) || 11) - 1;
            day = parseInt(parts[2], 10) || 1;
          } else {
            const dt = new Date(b.bookingDate);
            day = dt.getUTCDate();
            mIdx = dt.getUTCMonth();
            year = dt.getUTCFullYear();
          }
          const mShort = MONTH_SHORT_NAMES[mIdx] || 'Nov';
          const iso = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const { time: timeStr, meridiem: meridiemStr } = formatBookingDisplayTime(b.startTime);

          const rawItems = Array.isArray(b.items) ? b.items : [];
          const travelRow = rawItems.find((i: any) => i.customTitle === 'Travel Charges');
          const travelAmt = travelRow
            ? Math.round(Number(travelRow.totalPricePaise || 0) / 100)
            : 0;
          const pkgItems = rawItems
            .filter((i: any) => i.customTitle !== 'Travel Charges')
            .map((i: any) => ({
              name: i.customTitle,
              price: Math.round(Number(i.unitPricePaise || 0) / 100),
            }));

          const totalRupees = Math.round(Number(b.totalAmountPaise || 0) / 100);
          const advanceRupees = Math.round(Number(b.advancePaidPaise || 0) / 100);
          const balanceRupees = Math.max(
            0,
            Math.round(Number(b.balanceDuePaise || Math.max(0, totalRupees - advanceRupees) * 100) / 100)
          );

          const statusMapped: 'Upcoming' | 'Completed' | 'Closed' =
            b.status === 'completed'
              ? 'Closed'
              : b.status === 'in_progress'
              ? 'Completed'
              : 'Upcoming';

          return {
            id: b.id,
            ref: `Booking #${String(b.id).slice(0, 4).toUpperCase()}`,
            client: b.client?.name || 'Client',
            clientId: b.clientId || b.client?.id,
            clientPhone: b.client?.phone || '',
            bookingDate: iso,
            day,
            month: mShort,
            year,
            time: timeStr,
            meridiem: meridiemStr,
            items: pkgItems.length > 0 ? pkgItems : [{ name: 'Bridal Look', price: totalRupees }],
            travel: travelAmt,
            total: totalRupees,
            advance: advanceRupees,
            balanceDue: balanceRupees,
            status: statusMapped,
            venue: b.eventLocation || 'Studio',
            notes: b.notes || '',
          };
        });

        setAppointments(nextAppointments);
      }

      if (expensesRes?.success && Array.isArray(expensesRes.data)) {
        nextExpenses = expensesRes.data.map((e: any) => ({
          id: e.id,
          title: e.title || 'Studio Expense',
          category: (e.category || 'other') as ExpenseCategoryKey,
          categoryLabel: e.categoryLabel || e.category || 'Other',
          amount: Math.round(Number(e.amountPaise || 0) / 100),
          expenseDate: String(e.expenseDate || '').slice(0, 10),
          notes: e.notes || null,
        }));
        setExpenses(nextExpenses);
        const now = new Date();
        const curPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        nextMonthExpenses = nextExpenses
          .filter((e) => e.expenseDate.slice(0, 7) === curPrefix)
          .reduce((sum, e) => sum + e.amount, 0);
        setMonthExpenses(nextMonthExpenses);
      } else if (overviewRes?.success && overviewRes.data?.metrics?.totalExpensesPaise) {
        nextMonthExpenses = Math.round(Number(overviewRes.data.metrics.totalExpensesPaise || 0) / 100);
        setMonthExpenses(nextMonthExpenses);
      }

      setLastSyncTime(new Date());

      // Save real data cache for instant 0-second load next time
      try {
        const cacheToSave: CachedStudioData = {
          appointments: nextAppointments,
          clients: nextClients,
          packages: nextPackages,
          expenses: nextExpenses,
          reminders: nextReminders,
          galleryLooks: nextGalleryLooks,
          galleryStreaks: galleryRes?.streaks,
          monthExpenses: nextMonthExpenses,
          registeredAt: nextRegisteredAt,
        };
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(cacheToSave));
      } catch (cacheErr) {
        // quota
      }
    } catch (err) {
      // Offline / dev fallback keeps current state
    } finally {
      setSyncingData(false);
    }
  }, []);

  // 1. Check saved session on mount and restore live backend session (NO fake demo data!)
  useEffect(() => {
    const savedToken = localStorage.getItem('shilpi_token');
    const savedUser = localStorage.getItem('shilpi_user_session');
    if (savedToken && savedUser && savedToken !== 'demo-jwt-token-9876543210') {
      try {
        const parsed = JSON.parse(savedUser);
        setSession(parsed);
        fetchStudioSyncData(parsed.token, false);
      } catch (e) {
        setSession(null);
      }
    } else {
      setSession(null);
    }
  }, [fetchStudioSyncData]);

  // 2. Real-Time Auto-Refresh Polling (every 3.5s) & Tab-Focus Re-sync
  useEffect(() => {
    if (!session?.token) return;

    // Periodic background sync every 3.5 seconds
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStudioSyncData(session.token, true);
      }
    }, 3500);

    // Instant sync when user returns to tab / window
    const handleSyncOnFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStudioSyncData(session.token, true);
      }
    };

    window.addEventListener('focus', handleSyncOnFocus);
    document.addEventListener('visibilitychange', handleSyncOnFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSyncOnFocus);
      document.removeEventListener('visibilitychange', handleSyncOnFocus);
    };
  }, [session?.token, fetchStudioSyncData]);

  // 2. Demo ID One-Click Helper
  const fillDemoCredentials = () => {
    setPhone('9876543210');
    setOtp('528143');
    setDemoNotice('Demo ID filled (Phone: 9876543210 · Code: 528143)');
    setErrorText('');
    fetch(`${BACKEND_URL}/api/v1/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210' }),
    }).catch(() => {});
  };

  const setErrorText = (msg: string) => {
    setErrorMessage(msg);
  };

  // 3. Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setDemoNotice('');

    const cleaned = (phone || '9876543210').replace(/\s+/g, '');
    const fullPhone = cleaned.startsWith('+91') ? cleaned : `+91${cleaned}`;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      setOtpSent(true);
    } catch (err) {
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP & Authenticate
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const cleaned = (phone || '9876543210').replace(/\s+/g, '');
    const fullPhone = cleaned.startsWith('+91') ? cleaned : `+91${cleaned}`;
    const code = otp.trim() || '528143';

    try {
      let res = await fetch(`${BACKEND_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp: code }),
      });
      let data = await res.json();

      // If code expired or dev demo, send fresh OTP and verify
      if (!data.success && (cleaned === '9876543210' || code === '528143')) {
        await fetch(`${BACKEND_URL}/api/v1/auth/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone }),
        });
        res = await fetch(`${BACKEND_URL}/api/v1/auth/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, otp: code }),
        });
        data = await res.json();
      }

      if (data.success && data.token) {
        const userSession: UserSession = {
          token: data.token,
          user: data.user || { id: 'user-live', phone: fullPhone, role: 'owner' },
          beautician: data.beautician || {
            businessName: 'Shilpi Makeovers',
            ownerName: 'Shilpa R.',
            city: 'Coimbatore',
            businessTypes: ['Bridal Makeup', 'Hair Styling'],
          },
        };
        saveAndSetSession(userSession);
        fetchStudioSyncData(data.token);
      } else {
        setErrorMessage(data?.error?.message || 'Invalid verification code. Try 528143 for demo.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewBooking = (
    prefill?: SelectedDatePrefill,
    prefillClient?: { id?: string; name: string; phone: string }
  ) => {
    if (prefill?.isoDate) {
      setNewBookingDate(prefill.isoDate);
    } else {
      const d = new Date();
      setNewBookingDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
      );
    }
    if (prefillClient) {
      setNewClientName(prefillClient.name);
      setNewClientPhone(prefillClient.phone || '+91 ');
      setNewClientId(prefillClient.id || null);
      const match = clients.find((c) => c.id === prefillClient.id);
      setSelectedExistingClient(match || null);
    } else {
      setNewClientId(null);
      setSelectedExistingClient(null);
    }
    setClientSearchFocused(false);
    setShowNewBookingModal(true);
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: 'Upcoming' | 'Completed' | 'Closed'
  ) => {
    const backendStatus =
      newStatus === 'Closed' ? 'completed' : newStatus === 'Completed' ? 'in_progress' : 'confirmed';

    setAppointments((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setSelectedBookingForDetail((prev) => (prev && prev.id === bookingId ? { ...prev, status: newStatus } : prev));

    if (session?.token) {
      try {
        await fetch(`${BACKEND_URL}/api/v1/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ status: backendStatus }),
        });
      } catch (e) {
        console.warn('Failed to update booking status:', e);
      }
    }
  };

  const handleRecordPaymentForBooking = async (
    bookingId: string,
    amountRupees: number,
    paymentMode = 'UPI'
  ) => {
    setAppointments((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const newAdvance = (b.advance || 0) + amountRupees;
        const newBalance = Math.max(0, (b.total || 0) - newAdvance);
        return {
          ...b,
          advance: newAdvance,
          balanceDue: newBalance,
        };
      })
    );
    setSelectedBookingForDetail((prev) => {
      if (!prev || prev.id !== bookingId) return prev;
      const newAdvance = (prev.advance || 0) + amountRupees;
      const newBalance = Math.max(0, (prev.total || 0) - newAdvance);
      return {
        ...prev,
        advance: newAdvance,
        balanceDue: newBalance,
      };
    });

    if (session?.token) {
      try {
        await fetch(`${BACKEND_URL}/api/v1/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            bookingId,
            amountPaise: Math.round(amountRupees * 100),
            paymentMode: paymentMode.toLowerCase(),
            status: 'success',
          }),
        });
        fetchStudioSyncData(session.token);
      } catch (e) {
        console.warn('Failed to record payment:', e);
      }
    }
  };

  const handleUpdateProfile = async (updated: any) => {
    if (!session) return;
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          ownerName: updated.artistName,
          businessName: updated.studioName,
          city: updated.studioCity,
          phone: updated.studioPhone,
          businessTypes: updated.studioRole ? [updated.studioRole] : undefined,
          address: updated.address,
          pincode: updated.pincode,
        }),
      });
      setSession((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            phone: updated.studioPhone || prev.user.phone,
          },
          beautician: {
            ...prev.beautician,
            ownerName: updated.artistName || prev.beautician.ownerName,
            businessName: updated.studioName || prev.beautician.businessName,
            city: updated.studioCity || prev.beautician.city,
            businessTypes: updated.studioRole ? [updated.studioRole] : prev.beautician.businessTypes,
          },
        };
      });
    } catch (e) {
      console.warn('Update profile error:', e);
    }
  };

  const handleAddClient = async (payload: {
    name: string;
    phone: string;
    notes: string;
  }): Promise<{ success: boolean; client?: StudioClient; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: payload.name,
            phone: payload.phone,
            notes: payload.notes || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          return {
            success: false,
            error: data?.error?.message || 'Failed to save customer.',
          };
        }
        const saved: StudioClient = {
          id: data.data.id,
          name: data.data.name,
          phone: data.data.phone || payload.phone,
          notes: data.data.notes || payload.notes,
          isVip: Boolean(data.data.isVip),
          isActive: data.data.isActive !== false,
          bookingsCount: 0,
        };
        setClients((prev) => [saved, ...prev]);
        return { success: true, client: saved };
      } catch (err) {
        return { success: false, error: 'Network error while saving contact.' };
      }
    }

    const demoClient: StudioClient = {
      id: `web-client-${Date.now()}`,
      name: payload.name,
      phone: payload.phone,
      notes: payload.notes,
      isVip: false,
      isActive: true,
      bookingsCount: 0,
    };
    setClients((prev) => [demoClient, ...prev]);
    return { success: true, client: demoClient };
  };

  const handleToggleVip = async (clientId: string, nextVip: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, isVip: nextVip } : c))
    );
    if (session?.token) {
      try {
        await fetch(`${BACKEND_URL}/api/v1/clients/${clientId}/vip`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ isVip: nextVip }),
        });
      } catch (e) {}
    }
  };

  const handleUpdateClient = async (
    clientId: string,
    payload: { name: string; phone: string; notes: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/clients/${clientId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: payload.name,
            phone: payload.phone,
            notes: payload.notes,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          return {
            success: false,
            error: data?.error?.message || 'Failed to update customer.',
          };
        }
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  name: data.data?.name || payload.name,
                  phone: data.data?.phone || payload.phone,
                  notes: data.data?.notes ?? payload.notes,
                }
              : c
          )
        );
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Network error while updating contact.' };
      }
    }

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, name: payload.name, phone: payload.phone, notes: payload.notes }
          : c
      )
    );
    return { success: true };
  };

  const handleToggleActive = async (clientId: string, nextActive: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, isActive: nextActive } : c))
    );
    if (session?.token) {
      try {
        await fetch(`${BACKEND_URL}/api/v1/clients/${clientId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ isActive: nextActive }),
        });
      } catch (e) {}
    }
  };

  const handleAddPackage = async (
    payload: PackagePayload
  ): Promise<{ success: boolean; pkg?: StudioPackage; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/packages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: payload.name,
            serviceType: payload.serviceType,
            description: payload.description || null,
            durationMinutes: payload.durationMinutes,
            pricePaise: Math.round(payload.priceRupees * 100),
            isActive: payload.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Unable to create package.',
          };
        }
        const created: StudioPackage = {
          id: data.data.id,
          name: data.data.name,
          serviceType: data.data.serviceType,
          description: data.data.description || '',
          durationMinutes: Number(data.data.durationMinutes || payload.durationMinutes),
          priceRupees:
            data.data.priceRupees !== undefined
              ? Number(data.data.priceRupees)
              : Math.round(Number(data.data.pricePaise || 0) / 100),
          isActive: data.data.isActive !== false,
        };
        setPackages((prev) => [created, ...prev]);
        return { success: true, pkg: created };
      } catch (err) {
        return { success: false, error: 'Network error while creating package.' };
      }
    }

    const demoPkg: StudioPackage = {
      id: `pkg-${Date.now()}`,
      ...payload,
    };
    setPackages((prev) => [demoPkg, ...prev]);
    return { success: true, pkg: demoPkg };
  };

  const handleUpdatePackage = async (
    packageId: string,
    payload: PackagePayload
  ): Promise<{ success: boolean; pkg?: StudioPackage; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/packages/${packageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: payload.name,
            serviceType: payload.serviceType,
            description: payload.description || null,
            durationMinutes: payload.durationMinutes,
            pricePaise: Math.round(payload.priceRupees * 100),
            isActive: payload.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Unable to update package.',
          };
        }
        const updated: StudioPackage = {
          id: data.data.id,
          name: data.data.name,
          serviceType: data.data.serviceType,
          description: data.data.description || '',
          durationMinutes: Number(data.data.durationMinutes || payload.durationMinutes),
          priceRupees:
            data.data.priceRupees !== undefined
              ? Number(data.data.priceRupees)
              : Math.round(Number(data.data.pricePaise || 0) / 100),
          isActive: data.data.isActive !== false,
        };
        setPackages((prev) => prev.map((p) => (p.id === packageId ? updated : p)));
        return { success: true, pkg: updated };
      } catch (err) {
        return { success: false, error: 'Network error while updating package.' };
      }
    }

    const updatedDemo: StudioPackage = { id: packageId, ...payload };
    setPackages((prev) => prev.map((p) => (p.id === packageId ? updatedDemo : p)));
    return { success: true, pkg: updatedDemo };
  };

  const handleDeletePackage = async (
    packageId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/packages/${packageId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Unable to delete package.',
          };
        }
        setPackages((prev) => prev.filter((p) => p.id !== packageId));
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Network error while deleting package.' };
      }
    }

    setPackages((prev) => prev.filter((p) => p.id !== packageId));
    return { success: true };
  };

  const handleRecordPayment = async (
    bookingId: string,
    payload: {
      amountRupees: number;
      paymentMode: 'upi' | 'cash' | 'card' | 'bank_transfer';
      markFullyPaid: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/bookings/${bookingId}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            amountPaise: Math.round(payload.amountRupees * 100),
            paymentMode: payload.paymentMode,
            markFullyPaid: payload.markFullyPaid,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not record payment.',
          };
        }
        const newAdvance = Math.round(Number(data.data?.advancePaidPaise || 0) / 100);
        const newBalance = Math.max(
          0,
          Math.round(Number(data.data?.balanceDuePaise || 0) / 100)
        );
        setAppointments((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, advance: newAdvance, balanceDue: newBalance } : b
          )
        );
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while recording payment.' };
      }
    }

    setAppointments((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const nextAdvance = Math.min(b.total, (b.advance || 0) + payload.amountRupees);
        return {
          ...b,
          advance: nextAdvance,
          balanceDue: Math.max(0, b.total - nextAdvance),
        };
      })
    );
    return { success: true };
  };

  const handleSchedulePaymentReminder = async (payload: {
    title: string;
    notes: string;
    remindDate: string;
    clientName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const remindAtIso = new Date(`${payload.remindDate}T10:00:00`).toISOString();
    return handleAddReminder({
      text: payload.title.slice(0, 130),
      kind: 'Payment',
      remindAt: remindAtIso,
      bookingId: null,
    });
  };

  const handleAddReminder = async (
    payload: StudioReminderPayload
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not save studio reminder.',
          };
        }
        setReminders((prev) => [data.data, ...prev]);
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while saving reminder.' };
      }
    }
    const demoRem: StudioReminder = {
      id: `rem-${Date.now()}`,
      text: payload.text,
      kind: payload.kind,
      remindAt: payload.remindAt,
      isCompleted: false,
      bookingId: payload.bookingId || null,
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [demoRem, ...prev]);
    return { success: true };
  };

  const handleToggleReminder = async (reminderId: string, nextCompleted: boolean) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, isCompleted: nextCompleted } : r))
    );
    if (session?.token) {
      try {
        await fetch(`${BACKEND_URL}/api/v1/reminders/${reminderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ isCompleted: nextCompleted }),
        });
      } catch {
        // optimistic state kept
      }
    }
  };

  const handleUpdateReminder = async (
    reminderId: string,
    payload: StudioReminderPayload
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/reminders/${reminderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not update reminder.',
          };
        }
        setReminders((prev) => prev.map((r) => (r.id === reminderId ? data.data : r)));
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while updating reminder.' };
      }
    }
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, ...payload } : r))
    );
    return { success: true };
  };

  const handleDeleteReminder = async (
    reminderId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/reminders/${reminderId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not delete reminder.',
          };
        }
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while deleting reminder.' };
      }
    }
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    return { success: true };
  };

  const applyExpensesUpdate = (updater: (prev: StudioExpense[]) => StudioExpense[]) => {
    setExpenses((prev) => {
      const next = updater(prev);
      const now = new Date();
      const curPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlySum = next
        .filter((e) => e.expenseDate.slice(0, 7) === curPrefix)
        .reduce((sum, e) => sum + e.amount, 0);
      setMonthExpenses(monthlySum);
      return next;
    });
  };

  const mapBackendExpense = (e: any): StudioExpense => ({
    id: e.id,
    title: e.title || 'Studio Expense',
    category: (e.category || 'other') as ExpenseCategoryKey,
    categoryLabel: e.categoryLabel || e.category || 'Other',
    amount: Math.round(Number(e.amountPaise || 0) / 100),
    expenseDate: String(e.expenseDate || '').slice(0, 10),
    notes: e.notes || null,
  });

  const handleAddExpense = async (
    payload: StudioExpensePayload
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            title: payload.title,
            category: payload.category,
            amountPaise: Math.round(payload.amount * 100),
            expenseDate: payload.expenseDate,
            notes: payload.notes || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not save expense.',
          };
        }
        applyExpensesUpdate((prev) => [mapBackendExpense(data.data), ...prev]);
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while saving expense.' };
      }
    }
    applyExpensesUpdate((prev) => [
      {
        id: `local-exp-${Date.now()}`,
        title: payload.title,
        category: payload.category,
        categoryLabel: payload.category,
        amount: payload.amount,
        expenseDate: payload.expenseDate,
        notes: payload.notes || null,
      },
      ...prev,
    ]);
    return { success: true };
  };

  const handleUpdateExpense = async (
    expenseId: string,
    payload: StudioExpensePayload
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/expenses/${expenseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            title: payload.title,
            category: payload.category,
            amountPaise: Math.round(payload.amount * 100),
            expenseDate: payload.expenseDate,
            notes: payload.notes || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not update expense.',
          };
        }
        const mapped = mapBackendExpense(data.data);
        applyExpensesUpdate((prev) => prev.map((e) => (e.id === expenseId ? mapped : e)));
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while updating expense.' };
      }
    }
    applyExpensesUpdate((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              title: payload.title,
              category: payload.category,
              amount: payload.amount,
              expenseDate: payload.expenseDate,
              notes: payload.notes || null,
            }
          : e
      )
    );
    return { success: true };
  };

  const handleDeleteExpense = async (
    expenseId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/expenses/${expenseId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data?.error?.message || 'Could not delete expense.',
          };
        }
        applyExpensesUpdate((prev) => prev.filter((e) => e.id !== expenseId));
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while deleting expense.' };
      }
    }
    applyExpensesUpdate((prev) => prev.filter((e) => e.id !== expenseId));
    return { success: true };
  };

  const handleAddLook = async (
    payload: GalleryLookPayload
  ): Promise<{ success: boolean; look?: StudioGalleryLook; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/gallery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data?.error?.message || 'Unable to save look.' };
        }
        const created: StudioGalleryLook = {
          id: data.data.id,
          title: data.data.title,
          place: data.data.place || '',
          bookingId: data.data.bookingId || null,
          imageUrl: data.data.imageUrl || '',
          extraImages: Array.isArray(data.data.extraImages) ? data.data.extraImages : [],
          caption: data.data.caption || '',
          instagramHandle: data.data.instagramHandle || '',
          instagramUrl: data.data.instagramUrl || '',
          postedToInstagram: Boolean(data.data.postedToInstagram),
          createdAt: data.data.createdAt || new Date().toISOString(),
        };
        setGalleryLooks((prev) => [created, ...prev]);
        if (data.streaks) setGalleryStreaks(data.streaks);
        return { success: true, look: created };
      } catch {
        return { success: false, error: 'Network error while saving look.' };
      }
    }

    const demoLook: StudioGalleryLook = {
      id: `look-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    setGalleryLooks((prev) => [demoLook, ...prev]);
    return { success: true, look: demoLook };
  };

  const handleUpdateLook = async (
    lookId: string,
    payload: Partial<GalleryLookPayload>
  ): Promise<{ success: boolean; look?: StudioGalleryLook; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/gallery/${lookId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data?.error?.message || 'Unable to update look.' };
        }
        const updated: StudioGalleryLook = {
          id: data.data.id,
          title: data.data.title,
          place: data.data.place || '',
          bookingId: data.data.bookingId || null,
          imageUrl: data.data.imageUrl || '',
          extraImages: Array.isArray(data.data.extraImages) ? data.data.extraImages : [],
          caption: data.data.caption || '',
          instagramHandle: data.data.instagramHandle || '',
          instagramUrl: data.data.instagramUrl || '',
          postedToInstagram: Boolean(data.data.postedToInstagram),
          createdAt: data.data.createdAt || new Date().toISOString(),
        };
        setGalleryLooks((prev) => prev.map((l) => (l.id === lookId ? updated : l)));
        if (data.streaks) setGalleryStreaks(data.streaks);
        return { success: true, look: updated };
      } catch {
        return { success: false, error: 'Network error while updating look.' };
      }
    }

    setGalleryLooks((prev) =>
      prev.map((l) => (l.id === lookId ? { ...l, ...payload } : l))
    );
    return { success: true };
  };

  const handleDeleteLook = async (
    lookId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (session?.token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/gallery/${lookId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data?.error?.message || 'Unable to delete look.' };
        }
        setGalleryLooks((prev) => prev.filter((l) => l.id !== lookId));
        if (data.streaks) setGalleryStreaks(data.streaks);
        return { success: true };
      } catch {
        return { success: false, error: 'Network error while deleting look.' };
      }
    }

    setGalleryLooks((prev) => prev.filter((l) => l.id !== lookId));
    return { success: true };
  };

  // Add new booking from web terminal (updates UI immediately + syncs to backend DB when online)
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(newTotal) || 0;
    const adv = parseFloat(newAdvance) || 0;

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(newBookingDate);
    const yr = dateMatch ? Number(dateMatch[1]) : new Date().getFullYear();
    const mIdx = dateMatch ? Number(dateMatch[2]) - 1 : new Date().getMonth();
    const day = dateMatch ? Number(dateMatch[3]) : new Date().getDate();
    const mShort = MONTH_SHORT_NAMES[mIdx] || 'Nov';

    const [hRaw, minRaw] = (newBookingTime || '09:00').split(':');
    const h24 = parseInt(hRaw || '9', 10) || 9;
    const meridiemStr = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    const timeFormatted = `${String(h12).padStart(2, '0')}:${(minRaw || '00').padStart(2, '0')}`;

    const newBooking: StudioBooking = {
      id: `web-${Date.now()}`,
      ref: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      client: newClientName || 'New Client',
      clientPhone: newClientPhone || '+91 ',
      bookingDate: newBookingDate,
      day,
      month: mShort,
      year: yr,
      time: timeFormatted,
      meridiem: meridiemStr,
      items: [{ name: newService || 'Bridal Styling', price: tot }],
      travel: 0,
      total: tot,
      advance: adv,
      balanceDue: Math.max(0, tot - adv),
      status: 'Upcoming',
      venue: newVenue || 'Studio',
    };

    setAppointments((prev) => [newBooking, ...prev]);
    setShowNewBookingModal(false);
    setNewClientName('');
    setNewClientPhone('+91 ');
    const usedClientId = newClientId;
    setNewClientId(null);
    setSelectedExistingClient(null);

    // Attempt live persistence with backend so mobile syncs immediately
    if (session?.token) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        };
        const normalizeDigits = (v: string) => v.replace(/\D/g, '').slice(-10);
        const targetDigits = normalizeDigits(newBooking.clientPhone);
        const matchedExisting = clients.find(
          (c) => targetDigits && normalizeDigits(c.phone) === targetDigits
        );

        let clientId = usedClientId || matchedExisting?.id;
        if (!clientId) {
          const clientRes = await fetch(`${BACKEND_URL}/api/v1/clients`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: newBooking.client,
              phone: newBooking.clientPhone.replace(/\s+/g, '') || '+919999999999',
            }),
          }).then((r) => r.json());
          clientId = clientRes?.data?.id || clientRes?.error?.existingId;
        }
        if (clientId) {
          await fetch(`${BACKEND_URL}/api/v1/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              clientId,
              bookingDate: newBooking.bookingDate,
              startTime: `${newBooking.bookingDate}T${String(h24).padStart(2, '0')}:${(minRaw || '00').padStart(2, '0')}:00.000Z`,
              eventLocation: newBooking.venue,
              advancePaidPaise: Math.round(adv * 100),
              items: [
                {
                  customTitle: newService || 'Bridal Styling',
                  quantity: 1,
                  unitPricePaise: Math.round(tot * 100),
                },
              ],
            }),
          });
          fetchStudioSyncData(session.token);
        }
      } catch (err) {
        // Offline fallback already updated local UI state
      }
    }
  };

  return (
    <>
      <Head>
        <title>Shilpi · Studio Web Terminal</title>
        <meta name="description" content="Shilpi Web Terminal for Bridal Artists & Beauticians" />
        <link rel="icon" href="/shilpi-mark.png" />
      </Head>

      <div className="min-h-screen bg-[#faf8f9] text-[#121214] flex flex-col font-sans">
        {/* ========================================================= */}
        {/* VIEW 1: AUTHENTICATED STUDIO WEB TERMINAL WITH SIDEBAR     */}
        {/* ========================================================= */}
        {session ? (
          <div className="flex-1 flex min-h-screen">
            <StudioSidebar
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              profile={{
                businessName: session.beautician.businessName,
                ownerName: session.beautician.ownerName,
                city: session.beautician.city,
                logoUri: session.beautician.logoUri,
                profilePhotoUrl: session.beautician.profilePhotoUrl,
                businessTypes: session.beautician.businessTypes,
                role: session.user?.role,
              }}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Minimal Architectural Workspace Header */}
              <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-black/[0.07] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open studio navigation"
                    className="lg:hidden w-9 h-9 rounded-xl border border-black/[0.08] bg-white flex items-center justify-center text-[#121214] hover:border-[#e8276b]/40 transition-colors"
                  >
                    <Menu className="w-4 h-4" />
                  </button>

                  <h1 className="font-display text-lg sm:text-xl font-bold tracking-[-0.02em] text-[#121214] truncate">
                    {STUDIO_NAV_ITEMS.find((item) => item.id === activeSection)?.label || 'Dashboard'}
                  </h1>

                  <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-[#52525b] pl-3 border-l border-black/[0.08] tabular-nums">
                    {session.beautician.city || 'Studio Desk'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenNewBooking()}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-semibold tracking-wide transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Booking</span>
                  </button>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
                <div ref={sectionContentRef} className="space-y-6">
                  {activeSection === 'dashboard' ? (
                    <DashboardView
                      ownerName={session.beautician.ownerName}
                      businessName={session.beautician.businessName}
                      bookings={appointments}
                      monthExpenses={monthExpenses}
                      syncing={syncingData}
                      onOpenNewBooking={handleOpenNewBooking}
                      onSelectBooking={(b) => setSelectedBookingForDetail(b)}
                    />
                  ) : activeSection === 'customers' ? (
                    <CustomersView
                      clients={clients}
                      bookings={appointments}
                      businessName={session.beautician.businessName}
                      syncing={syncingData}
                      onAddClient={handleAddClient}
                      onUpdateClient={handleUpdateClient}
                      onToggleVip={handleToggleVip}
                      onToggleActive={handleToggleActive}
                      onCreateBookingForClient={(client) =>
                        handleOpenNewBooking(undefined, client)
                      }
                    />
                  ) : activeSection === 'packages' ? (
                    <PackagesView
                      packages={packages}
                      syncing={syncingData}
                      onAddPackage={handleAddPackage}
                      onUpdatePackage={handleUpdatePackage}
                      onDeletePackage={handleDeletePackage}
                    />
                  ) : activeSection === 'payments' ? (
                    <PaymentsView
                      bookings={appointments}
                      businessName={session.beautician.businessName}
                      registeredAt={registeredAt || session.beautician.createdAt}
                      syncing={syncingData}
                      onRecordPayment={handleRecordPayment}
                      onSchedulePaymentReminder={handleSchedulePaymentReminder}
                    />
                  ) : activeSection === 'gallery' ? (
                    <GalleryView
                      looks={galleryLooks}
                      streaks={galleryStreaks}
                      businessName={session.beautician.businessName}
                      syncing={syncingData}
                      onAddLook={handleAddLook}
                      onUpdateLook={handleUpdateLook}
                      onDeleteLook={handleDeleteLook}
                    />
                  ) : activeSection === 'reminders' ? (
                    <RemindersView
                      reminders={reminders}
                      bookings={appointments}
                      syncing={syncingData}
                      onAddReminder={handleAddReminder}
                      onToggleReminder={handleToggleReminder}
                      onUpdateReminder={handleUpdateReminder}
                      onDeleteReminder={handleDeleteReminder}
                    />
                  ) : activeSection === 'expenses' ? (
                    <ExpensesView
                      expenses={expenses}
                      syncing={syncingData}
                      onAddExpense={handleAddExpense}
                      onUpdateExpense={handleUpdateExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  ) : activeSection === 'reports' ? (
                    <ReportsView
                      bookings={appointments}
                      expenses={expenses}
                      monthExpenses={monthExpenses}
                      registeredAt={registeredAt}
                      studioName={session.beautician.businessName}
                      artistName={session.beautician.ownerName || session.beautician.businessName}
                      syncing={syncingData}
                    />
                  ) : activeSection === 'subscription' ? (
                    <SubscriptionView
                      studioName={session.beautician.businessName}
                    />
                  ) : activeSection === 'settings' ? (
                    <SettingsView
                      artistName={session.beautician.ownerName || session.beautician.businessName}
                      studioName={session.beautician.businessName}
                      studioLogo={session.beautician.profilePhotoUrl || session.beautician.logoUri || null}
                      studioPhone={session.user.phone}
                      studioCity={session.beautician.city}
                      studioRole={session.beautician.businessTypes?.[0] || 'Bridal Makeup Artist'}
                      usage={{
                        orders: appointments.length,
                        clients: clients.length,
                        packages: packages.length,
                        reminders: reminders.length,
                        closes: appointments.filter(
                          (b) => b.status === 'Closed' || b.status === 'Completed'
                        ).length,
                      }}
                      onGoToSubscription={() => setActiveSection('subscription')}
                      onLogout={handleLogout}
                      onUpdateProfile={handleUpdateProfile}
                    />
                  ) : activeSection === 'notification' ? (
                    <NotificationsView
                      bookings={appointments}
                      reminders={reminders}
                      looksCount={galleryLooks.length}
                      businessName={session.beautician.businessName}
                      onNavigate={(section) => setActiveSection(section)}
                    />
                  ) : (
                    /* Clean Atelier Workspace Canvas for Selected Sidebar Module */
                    (() => {
                      const currentNav = STUDIO_NAV_ITEMS.find((i) => i.id === activeSection);
                      const ActiveIcon = currentNav?.icon;
                      return (
                        <section className="bg-white rounded-2xl border border-black/[0.07] p-8 sm:p-10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
                            <div className="flex items-start gap-4">
                              {ActiveIcon && (
                                <div className="w-12 h-12 rounded-2xl bg-[#ffeef4] text-[#e8276b] flex items-center justify-center shrink-0">
                                  <ActiveIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h2 className="font-display text-xl font-bold text-[#121214]">
                                  {currentNav?.label}
                                </h2>
                                <p className="text-sm text-[#52525b] mt-1 max-w-[56ch]">
                                  Synced workspace for <span className="font-semibold text-[#121214]">{session.beautician.businessName}</span> ({session.beautician.ownerName}). Ready to connect live {currentNav?.label.toLowerCase()} modules next.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveSection('dashboard')}
                              className="px-4 h-10 rounded-xl border border-black/[0.1] bg-[#faf8f9] hover:border-[#e8276b]/40 text-xs font-semibold text-[#121214] transition-colors shrink-0"
                            >
                              Back to Dashboard
                            </button>
                          </div>

                          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#52525b]">
                            <div className="p-4 rounded-xl bg-[#faf8f9] border border-black/[0.05]">
                              <span className="font-semibold text-[#121214] block mb-1">Studio Account</span>
                              <span>{session.beautician.ownerName} · {session.user.role || 'Owner'}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-[#faf8f9] border border-black/[0.05]">
                              <span className="font-semibold text-[#121214] block mb-1">Disciplines</span>
                              <span>
                                {session.beautician.businessTypes?.length
                                  ? session.beautician.businessTypes.join(' · ')
                                  : 'Beauty & Bridal Studio'}
                              </span>
                            </div>
                            <div className="p-4 rounded-xl bg-[#faf8f9] border border-black/[0.05]">
                              <span className="font-semibold text-[#121214] block mb-1">Terminal Sync</span>
                              <span>Connected via live gateway</span>
                            </div>
                          </div>
                        </section>
                      );
                    })()
                  )}
                </div>
              </main>
            </div>

            {/* Modal: Add New Booking */}
            {showNewBookingModal && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
                  <div className="flex justify-between items-center pb-4 border-b border-black/5">
                    <div>
                      <h3 className="text-base font-bold text-[#121212]">Create New Booking</h3>
                      <p className="text-xs text-[#121212]/50">Adds client to live studio schedule</p>
                    </div>
                    <button
                      onClick={() => setShowNewBookingModal(false)}
                      className="p-1 rounded-lg text-[#121212]/40 hover:text-[#121212]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateBooking} className="mt-4 space-y-3.5">
                    {/* Client Name with Existing Customer Autocomplete */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-[#121214]">
                          Client Name <span className="text-[#e8276b]">*</span>
                        </label>
                        {selectedExistingClient ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExistingClient(null);
                              setNewClientId(null);
                              setNewClientName('');
                              setNewClientPhone('+91 ');
                            }}
                            className="text-[10px] font-bold text-[#e8276b] hover:underline"
                          >
                            ✕ Clear Selection
                          </button>
                        ) : null}
                      </div>

                      <input
                        type="text"
                        placeholder="Type name or phone to find customer..."
                        value={newClientName}
                        onFocus={() => setClientSearchFocused(true)}
                        onChange={(e) => {
                          setNewClientName(e.target.value);
                          if (selectedExistingClient && e.target.value !== selectedExistingClient.name) {
                            setSelectedExistingClient(null);
                            setNewClientId(null);
                          }
                          setClientSearchFocused(true);
                        }}
                        required
                        className="w-full bg-[#faf8f9] border border-black/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] focus:ring-1 focus:ring-[#e8276b]"
                      />

                      {/* Selected Client Badge */}
                      {selectedExistingClient && (
                        <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
                          <span className="font-semibold flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                            <span className="truncate">Client: {selectedExistingClient.name}</span>
                          </span>
                          <span className="font-mono text-[11px] text-emerald-700 shrink-0 ml-2">
                            {selectedExistingClient.phone}
                          </span>
                        </div>
                      )}

                      {/* Live Dropdown Suggestions */}
                      {clientSearchFocused && !selectedExistingClient && matchingClients.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-black/10 py-1 z-50 max-h-56 overflow-y-auto animate-in fade-in duration-150">
                          <div className="px-3 py-1 text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider border-b border-black/[0.04] bg-[#faf8f9]">
                            Existing Customers ({matchingClients.length})
                          </div>
                          {matchingClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setNewClientName(c.name);
                                setNewClientPhone(c.phone || '+91 ');
                                setNewClientId(c.id);
                                setSelectedExistingClient(c);
                                setClientSearchFocused(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[#ffeef4]/50 flex items-center justify-between gap-2 transition-colors border-b last:border-b-0 border-black/[0.03]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-[#121214] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-[#121214] truncate">{c.name}</p>
                                    {c.isVip && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold">
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#64748b] font-mono">{c.phone}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[#e8276b] shrink-0">Select</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#121214] mb-1">Booking Date</label>
                        <input
                          type="date"
                          value={newBookingDate}
                          onChange={(e) => setNewBookingDate(e.target.value)}
                          required
                          className="w-full bg-[#faf8f9] border border-black/[0.12] rounded-xl px-3 py-2 text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#121214] mb-1">Time</label>
                        <input
                          type="time"
                          value={newBookingTime}
                          onChange={(e) => setNewBookingTime(e.target.value)}
                          required
                          className="w-full bg-[#faf8f9] border border-black/[0.12] rounded-xl px-3 py-2 text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#121214] mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        required
                        className="w-full bg-[#faf8f9] border border-black/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] font-mono tabular-nums"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#121212] mb-1">Service / Package</label>
                        <input
                          type="text"
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          className="w-full bg-[#ffeef4] border border-[#e8276b]/30 rounded-xl px-3 py-2 text-xs text-[#121212] focus:outline-none focus:border-[#e8276b]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#121212] mb-1">Venue</label>
                        <input
                          type="text"
                          value={newVenue}
                          onChange={(e) => setNewVenue(e.target.value)}
                          className="w-full bg-[#ffeef4] border border-[#e8276b]/30 rounded-xl px-3 py-2 text-xs text-[#121212] focus:outline-none focus:border-[#e8276b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#121212] mb-1">Total Fee (₹)</label>
                        <input
                          type="number"
                          value={newTotal}
                          onChange={(e) => setNewTotal(e.target.value)}
                          className="w-full bg-[#ffeef4] border border-[#e8276b]/30 rounded-xl px-3 py-2 text-xs text-[#121212] focus:outline-none focus:border-[#e8276b]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#121212] mb-1">Advance (₹)</label>
                        <input
                          type="number"
                          value={newAdvance}
                          onChange={(e) => setNewAdvance(e.target.value)}
                          className="w-full bg-[#ffeef4] border border-[#e8276b]/30 rounded-xl px-3 py-2 text-xs text-[#121212] focus:outline-none focus:border-[#e8276b]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowNewBookingModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-black/10 text-xs font-bold text-[#121212]/60 hover:text-[#121212]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-[#e8276b] hover:bg-[#a50f45] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Save Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Modal: Booking Detail Profile */}
            {selectedBookingForDetail && (
              <BookingDetailModal
                booking={selectedBookingForDetail}
                businessName={session.beautician.businessName}
                onClose={() => setSelectedBookingForDetail(null)}
                onUpdateStatus={handleUpdateBookingStatus}
                onRecordPayment={handleRecordPaymentForBooking}
              />
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: MINIMAL GSAP-ANIMATED LOGIN & PAIRING EXPERIENCE  */
          /* ========================================================= */
          <LoginExperience
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            phone={phone}
            setPhone={setPhone}
            otp={otp}
            setOtp={setOtp}
            otpSent={otpSent}
            setOtpSent={setOtpSent}
            loading={loading}
            errorMessage={errorMessage}
            demoNotice={demoNotice}
            qrDataUrl={qrDataUrl}
            pairingStatus={pairingStatus}
            onRefreshQr={() => socket?.emit('request_pairing_qr')}
            onSendOtp={handleSendOtp}
            onVerifyOtp={handleVerifyOtp}
            onFillDemo={fillDemoCredentials}
          />
        )}
      </div>
    </>
  );
}
