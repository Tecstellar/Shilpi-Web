import React, { useMemo, useState, useEffect } from 'react';
import {
  Building2,
  ChevronRight,
  Crown,
  FileText,
  Lock,
  LogOut,
  MessageSquare,
  Phone,
  Shield,
  Sparkles,
  User,
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Palette,
  BarChart2,
  MapPin,
} from 'lucide-react';

export interface SettingsUsageCounts {
  orders: number;
  clients: number;
  packages: number;
  reminders: number;
  closes: number;
}

interface SettingsViewProps {
  artistName?: string;
  studioName?: string;
  studioLogo?: string | null;
  studioPhone?: string;
  studioCity?: string;
  studioRole?: string;
  address?: string;
  pincode?: string;
  isPremium?: boolean;
  usage: SettingsUsageCounts;
  onGoToSubscription: () => void;
  onLogout: () => void;
  onUpdateProfile?: (updated: {
    artistName?: string;
    studioName?: string;
    studioPhone?: string;
    studioCity?: string;
    studioRole?: string;
    address?: string;
    pincode?: string;
    studioLogo?: string;
  }) => Promise<void> | void;
  onDeleteAccount?: (reason: string, feedback?: string) => Promise<void> | void;
}

const LIMITS: { key: keyof SettingsUsageCounts; label: string; max: number }[] = [
  { key: 'orders', label: 'Order creation', max: 20 },
  { key: 'clients', label: 'Client creation', max: 20 },
  { key: 'packages', label: 'Packages catalog', max: 5 },
  { key: 'reminders', label: 'Automated reminders', max: 10 },
  { key: 'closes', label: 'Photo order closures', max: 10 },
];

const ROLE_SUGGESTIONS = [
  'Bridal Makeup Artist',
  'Celebrity Makeup & Hair Stylist',
  'Bridal Mehendi Artist',
  'Hairstylist & Saree Draper',
  'Nails & Lash Extension Specialist',
  'Beauty Studio & Academy Owner',
];

const CITY_SUGGESTIONS = [
  'Coimbatore',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Kochi',
  'Pune',
];

const DELETION_REASONS = [
  'I am closing or pausing my studio business',
  'Switching to another app or physical registers',
  'Found it difficult to use or missing key features',
  'Subscription pricing / upgrade is too expensive',
  'Privacy, data security, or backup concerns',
  'Other reason',
];

interface MessageTemplateItem {
  id: string;
  title: string;
  subtitle: string;
  body: string;
}

const DEFAULT_TEMPLATES: MessageTemplateItem[] = [
  {
    id: 'advance',
    title: 'Booking & Advance Receipt',
    subtitle: 'Sent when advance payment is received',
    body: 'Dear {client_name}, your bridal appointment for {event_date} is confirmed with advance payment. Total package: {package_name}. Thank you for choosing {studio_name}!',
  },
  {
    id: 'trial',
    title: 'Wedding Trial Reminder',
    subtitle: 'Sent 2-3 days before bridal trial look',
    body: 'Hi {client_name}, this is a gentle reminder for your bridal makeup trial session scheduled on {event_date} at {studio_name}. Please arrive with a clean face and your outfit reference.',
  },
  {
    id: 'balance',
    title: 'Pending Balance Due Alert',
    subtitle: 'Sent before the wedding day event',
    body: 'Dear {client_name}, the remaining balance of {balance_due} for your booking on {event_date} is due. You can pay via UPI or Cash. Looking forward to making you look stunning!',
  },
  {
    id: 'thanks',
    title: 'Post-Wedding Thank You Note',
    subtitle: 'Sent after wedding day completion',
    body: 'Thank you {client_name} for choosing {studio_name} on your most special day! We would love to see your professional photos and hear your feedback.',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  artistName = 'Artist',
  studioName = 'Shilpi Studio',
  studioLogo,
  studioPhone = '',
  studioCity = '',
  studioRole = 'Bridal Makeup Artist',
  address = '',
  pincode = '',
  isPremium = false,
  usage,
  onGoToSubscription,
  onLogout,
  onUpdateProfile,
  onDeleteAccount,
}) => {
  // Local profile state
  const [curArtistName, setCurArtistName] = useState(artistName);
  const [curStudioName, setCurStudioName] = useState(studioName);
  const [curStudioPhone, setCurStudioPhone] = useState(studioPhone);
  const [curStudioCity, setCurStudioCity] = useState(studioCity);
  const [curStudioRole, setCurStudioRole] = useState(studioRole);
  const [curAddress, setCurAddress] = useState(address);
  const [curPincode, setCurPincode] = useState(pincode);

  // Sync with props
  useEffect(() => {
    setCurArtistName(artistName);
    setCurStudioName(studioName);
    setCurStudioPhone(studioPhone);
    setCurStudioCity(studioCity);
    setCurStudioRole(studioRole);
    setCurAddress(address);
    setCurPincode(pincode);
  }, [artistName, studioName, studioPhone, studioCity, studioRole, address, pincode]);

  // Modals state
  const [editArtistModalOpen, setEditArtistModalOpen] = useState(false);
  const [editBusinessModalOpen, setEditBusinessModalOpen] = useState(false);
  const [editWhatsAppModalOpen, setEditWhatsAppModalOpen] = useState(false);
  const [editTemplatesModalOpen, setEditTemplatesModalOpen] = useState(false);
  const [quotasExpanded, setQuotasExpanded] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('Signature Luxury');
  const [infoModal, setInfoModal] = useState<{ title: string; body: string } | null>(null);
  const [confirmLogoutModalOpen, setConfirmLogoutModalOpen] = useState(false);

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<MessageTemplateItem[]>(DEFAULT_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplateItem | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  const initialLetter = (curArtistName.trim().charAt(0) || 'S').toUpperCase();

  // Usage calculations
  const usageRows = useMemo(() => {
    let atLimitCount = 0;
    const rows = LIMITS.map((item) => {
      const used = usage[item.key] || 0;
      const full = used >= item.max;
      if (full) atLimitCount += 1;
      const pct = isPremium ? 100 : Math.min(Math.round((used / item.max) * 100), 100);
      return {
        label: item.label,
        value: isPremium ? 'Unlimited' : `${used} / ${item.max}`,
        pct,
        full,
      };
    });
    return { rows, atLimitCount };
  }, [usage, isPremium]);

  // Save handler
  const handleSaveProfile = async (updates: {
    artistName?: string;
    studioName?: string;
    studioPhone?: string;
    studioCity?: string;
    studioRole?: string;
    address?: string;
    pincode?: string;
  }) => {
    setIsSaving(true);
    try {
      if (updates.artistName !== undefined) setCurArtistName(updates.artistName);
      if (updates.studioName !== undefined) setCurStudioName(updates.studioName);
      if (updates.studioPhone !== undefined) setCurStudioPhone(updates.studioPhone);
      if (updates.studioCity !== undefined) setCurStudioCity(updates.studioCity);
      if (updates.studioRole !== undefined) setCurStudioRole(updates.studioRole);
      if (updates.address !== undefined) setCurAddress(updates.address);
      if (updates.pincode !== undefined) setCurPincode(updates.pincode);

      if (onUpdateProfile) {
        await onUpdateProfile({
          artistName: updates.artistName ?? curArtistName,
          studioName: updates.studioName ?? curStudioName,
          studioPhone: updates.studioPhone ?? curStudioPhone,
          studioCity: updates.studioCity ?? curStudioCity,
          studioRole: updates.studioRole ?? curStudioRole,
          address: updates.address ?? curAddress,
          pincode: updates.pincode ?? curPincode,
        });
      }
    } finally {
      setIsSaving(false);
      setEditArtistModalOpen(false);
      setEditBusinessModalOpen(false);
      setEditWhatsAppModalOpen(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!selectedReason) {
      alert('Please select a reason for account deletion.');
      return;
    }
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type "DELETE" to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount(selectedReason, feedbackText);
      }
      onLogout();
    } catch {
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* =========================================================================
          1. STUDIO & ARTIST PROFILE HERO CARD (Identical to Mobile App)
          ========================================================================= */}
      <section className="bg-[#121214] text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-black/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            {studioLogo ? (
              <img
                src={studioLogo}
                alt={curArtistName}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#e8276b] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center font-display text-2xl font-extrabold text-white shrink-0">
                {initialLetter}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                  {curArtistName}
                </h2>
                {/* PRO / FREE TIER BADGE -> Click routes to subscription */}
                <button
                  type="button"
                  onClick={onGoToSubscription}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-transform hover:scale-105 ${
                    isPremium
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-[#ffeef4] text-[#a50f45] border border-[#e8276b]/30'
                  }`}
                  title="Click to view subscription"
                >
                  {isPremium ? 'PRO' : 'FREE TIER'}
                </button>
              </div>

              <p className="text-xs text-white/90 font-medium truncate mt-0.5">{curStudioName}</p>
              <p className="text-[11px] text-white/60 truncate mt-0.5">
                {curStudioRole}
                {curStudioCity ? ` · ${curStudioCity}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <button
              type="button"
              onClick={() => setEditArtistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onGoToSubscription}
              className="px-4 py-2 rounded-xl bg-[#e8276b] hover:bg-[#a50f45] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isPremium ? 'Manage Pro' : 'Upgrade'}</span>
            </button>
          </div>
        </div>

        {/* Hero Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-white/60" />
            <span>{curStudioPhone || 'No WhatsApp linked'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>VERIFIED ARTIST</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. GROUP 1: PROFILE (Only exact options from Mobile App)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-[#64748b]">
            PROFILE
          </h3>
          <span className="text-[10px] font-bold text-[#64748b]">
            {isPremium ? 'PRO MEMBER' : 'FREE TRIAL'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm divide-y divide-black/[0.05] overflow-hidden">
          {/* 1. Artist Profile Row */}
          <button
            type="button"
            onClick={() => setEditArtistModalOpen(true)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Artist Profile</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {curArtistName} · {curStudioRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#e8276b]">Edit</span>
              <ChevronRight className="w-4 h-4 text-[#64748b]/50" />
            </div>
          </button>

          {/* 2. Business Profile Row */}
          <button
            type="button"
            onClick={() => setEditBusinessModalOpen(true)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Business Profile</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {curStudioName}
                  {curStudioCity ? ` · ${curStudioCity}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#e8276b]">Edit</span>
              <ChevronRight className="w-4 h-4 text-[#64748b]/50" />
            </div>
          </button>

          {/* 3. WhatsApp Row */}
          <button
            type="button"
            onClick={() => setEditWhatsAppModalOpen(true)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#25D366] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">WhatsApp</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {curStudioPhone || 'Setup WhatsApp number'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-[#e8276b]">Edit</span>
              <ChevronRight className="w-4 h-4 text-[#64748b]/50" />
            </div>
          </button>

          {/* 4. Subscription Row -> Clicking routes to subscription page */}
          <button
            type="button"
            onClick={onGoToSubscription}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isPremium ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#ffeef4] text-[#e8276b]'
                }`}
              >
                <Crown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Subscription</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {isPremium ? 'Shilpi Pro · Unlimited' : 'Free Tier · 20 Bookings Limit'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                  isPremium
                    ? 'bg-amber-100 text-[#d97706]'
                    : 'bg-[#ffeef4] text-[#a50f45]'
                }`}
              >
                {isPremium ? 'MANAGE' : 'UPGRADE'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#64748b]/50" />
            </div>
          </button>

          {/* 5. Active Month Quotas (Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setQuotasExpanded((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#f8fafc] text-[#1e293b] flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#121214]">Active Month Quotas</p>
                  <p className="text-[11px] text-[#64748b] truncate">
                    {isPremium
                      ? 'All 5 features unlimited · Click to inspect'
                      : `${usageRows.atLimitCount} of 5 limits reached · Click to inspect`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#64748b]">
                  {quotasExpanded ? 'HIDE' : 'VIEW'}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-[#64748b]/50 transition-transform ${
                    quotasExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {/* Quotas Visible ONLY when expanded */}
            {quotasExpanded && (
              <div className="p-4 sm:p-5 bg-[#faf8f9] border-t border-black/[0.05] space-y-3.5 animate-in fade-in duration-150">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-[#64748b]">
                  ACTIVE MONTH USAGE STATUS
                </p>

                <div className="space-y-3">
                  {usageRows.rows.map((u) => (
                    <div key={u.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#121214]">{u.label}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            isPremium
                              ? 'text-[#121214]'
                              : u.full
                              ? 'text-[#e8276b]'
                              : 'text-[#64748b]'
                          }`}
                        >
                          {u.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
                        <div
                          style={{ width: `${u.pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPremium
                              ? 'bg-[#121214]'
                              : u.full
                              ? 'bg-[#e8276b]'
                              : 'bg-[#121214]/60'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!isPremium && (
                  <button
                    type="button"
                    onClick={onGoToSubscription}
                    className="w-full mt-2 h-10 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-extrabold tracking-wider uppercase transition-colors"
                  >
                    UNLOCK UNLIMITED BOOKINGS · UPGRADE
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. GROUP 2: SETTINGS & HELP (Exact options from Mobile App)
          ========================================================================= */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-[#64748b] px-1">
          SETTINGS &amp; HELP
        </h3>

        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm divide-y divide-black/[0.05] overflow-hidden">
          {/* App Theme */}
          <div>
            <button
              type="button"
              onClick={() => setThemePickerOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#fdf2f8] text-[#be185d] flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#121214]">App Theme</p>
                  <p className="text-[11px] text-[#64748b] truncate">{activeTheme}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#64748b]">
                  {themePickerOpen ? 'HIDE' : 'CHANGE'}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-[#64748b]/50 transition-transform ${
                    themePickerOpen ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {themePickerOpen && (
              <div className="p-4 bg-[#faf8f9] border-t border-black/[0.05] grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                {[
                  { name: 'Signature Luxury', desc: 'Obsidian & Rose Silk', color: '#e8276b' },
                  { name: 'Rose Velvet', desc: 'Blush pink & Champagne', color: '#be185d' },
                  { name: 'Emerald Royale', desc: 'Forest gold & Jade', color: '#059669' },
                  { name: 'Midnight Amethyst', desc: 'Deep violet & Platinum', color: '#7c3aed' },
                ].map((th) => (
                  <button
                    key={th.name}
                    type="button"
                    onClick={() => setActiveTheme(th.name)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                      activeTheme === th.name
                        ? 'bg-white border-[#121214] shadow-sm'
                        : 'bg-white/60 border-black/[0.06] hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: th.color }}
                      />
                      <div>
                        <p className="text-xs font-bold text-[#121214]">{th.name}</p>
                        <p className="text-[10px] text-[#64748b]">{th.desc}</p>
                      </div>
                    </div>
                    {activeTheme === th.name && <Check className="w-4 h-4 text-[#121214]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Message Templates Row */}
          <button
            type="button"
            onClick={() => setEditTemplatesModalOpen(true)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">
                  WhatsApp Message Templates
                </p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {templates.length} client message templates (Advance, Trial, Balance, Thank You)
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748b]/50 shrink-0" />
          </button>

          {/* Terms of Conditions */}
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: 'Terms of Conditions',
                body: 'By using Shilpi Studio ERP, you agree to our fair usage policies, data privacy protection, and software service agreement. Your bookings, client registers, and earnings data remain yours to export or manage at any time.',
              })
            }
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Terms of Conditions</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  Service agreement &amp; usage terms
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748b]/50 shrink-0" />
          </button>

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: 'Privacy Policy',
                body: 'Your client data and financials are protected with industry-standard encryption and never sold or shared with third parties. All phone numbers, invoices, and photos remain strictly isolated to your studio profile.',
              })
            }
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Privacy Policy</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  Data security &amp; encryption terms
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748b]/50 shrink-0" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          4. GROUP 3: ACCOUNT ACTIONS (Exact options from Mobile App)
          ========================================================================= */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-[#64748b] px-1">
          ACCOUNT ACTIONS
        </h3>

        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm divide-y divide-black/[0.05] overflow-hidden">
          {/* Logout */}
          <button
            type="button"
            onClick={() => setConfirmLogoutModalOpen(true)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#faf8f9] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#121214]">Log Out</p>
                <p className="text-[11px] text-[#64748b] truncate">
                  Sign out from this browser session
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748b]/50 shrink-0" />
          </button>

          {/* Permanently Delete Account */}
          <button
            type="button"
            onClick={() => {
              setSelectedReason('');
              setFeedbackText('');
              setConfirmText('');
              setDeleteModalOpen(true);
            }}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#fee2e2]/40 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#dc2626]">
                  Permanently Delete Account
                </p>
                <p className="text-[11px] text-[#dc2626]/70 truncate">
                  Irreversible deletion of all studio clients &amp; records
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#dc2626]/60 shrink-0" />
          </button>
        </div>
      </section>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. Edit Artist Profile Modal */}
      {editArtistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
            <div className="flex justify-between items-center pb-3 border-b border-black/5">
              <h3 className="font-display text-base font-bold text-[#121214]">Edit Artist Profile</h3>
              <button
                type="button"
                onClick={() => setEditArtistModalOpen(false)}
                className="text-[#64748b] hover:text-[#121214]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile({ artistName: curArtistName, studioRole: curStudioRole });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Artist Name</label>
                <input
                  type="text"
                  value={curArtistName}
                  onChange={(e) => setCurArtistName(e.target.value)}
                  required
                  placeholder="e.g. Radhika Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Role / Specialization</label>
                <input
                  type="text"
                  value={curStudioRole}
                  onChange={(e) => setCurStudioRole(e.target.value)}
                  required
                  placeholder="e.g. Bridal Makeup Artist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ROLE_SUGGESTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCurStudioRole(r)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                        curStudioRole === r
                          ? 'bg-[#121214] text-white border-[#121214]'
                          : 'bg-[#faf8f9] text-[#64748b] border-black/[0.06] hover:border-black/20'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditArtistModalOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] text-white text-xs font-bold"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Business Profile Modal */}
      {editBusinessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
            <div className="flex justify-between items-center pb-3 border-b border-black/5">
              <h3 className="font-display text-base font-bold text-[#121214]">Edit Business Profile</h3>
              <button
                type="button"
                onClick={() => setEditBusinessModalOpen(false)}
                className="text-[#64748b] hover:text-[#121214]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile({
                  studioName: curStudioName,
                  studioCity: curStudioCity,
                  address: curAddress,
                  pincode: curPincode,
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Studio / Brand Name</label>
                <input
                  type="text"
                  value={curStudioName}
                  onChange={(e) => setCurStudioName(e.target.value)}
                  required
                  placeholder="e.g. Shilpi Bridal Atelier"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">City</label>
                <input
                  type="text"
                  value={curStudioCity}
                  onChange={(e) => setCurStudioCity(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CITY_SUGGESTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurStudioCity(c)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                        curStudioCity === c
                          ? 'bg-[#121214] text-white border-[#121214]'
                          : 'bg-[#faf8f9] text-[#64748b] border-black/[0.06] hover:border-black/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Studio Address (Optional)</label>
                <input
                  type="text"
                  value={curAddress}
                  onChange={(e) => setCurAddress(e.target.value)}
                  placeholder="e.g. 12, Race Course Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Pincode (Optional)</label>
                <input
                  type="text"
                  value={curPincode}
                  onChange={(e) => setCurPincode(e.target.value)}
                  placeholder="e.g. 641018"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditBusinessModalOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] text-white text-xs font-bold"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit WhatsApp Number Modal */}
      {editWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
            <div className="flex justify-between items-center pb-3 border-b border-black/5">
              <h3 className="font-display text-base font-bold text-[#121214]">Update WhatsApp Number</h3>
              <button
                type="button"
                onClick={() => setEditWhatsAppModalOpen(false)}
                className="text-[#64748b] hover:text-[#121214]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile({ studioPhone: curStudioPhone });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#121214] mb-1">Studio Phone (with Country Code)</label>
                <input
                  type="tel"
                  value={curStudioPhone}
                  onChange={(e) => setCurStudioPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.12] text-xs font-semibold focus:outline-none focus:border-[#e8276b]"
                />
                <p className="text-[11px] text-[#64748b] mt-1.5">
                  Used for sending client advance receipts, trial reminders, and invoice links.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditWhatsAppModalOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 rounded-xl bg-[#25D366] text-white text-xs font-bold"
                >
                  {isSaving ? 'Saving...' : 'Update WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. WhatsApp Message Templates Modal */}
      {editTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-black/10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-black/5">
              <div>
                <h3 className="font-display text-base font-bold text-[#121214]">
                  WhatsApp Message Templates
                </h3>
                <p className="text-xs text-[#64748b]">
                  Automated studio message templates for client communication
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditTemplatesModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="text-[#64748b] hover:text-[#121214]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingTemplate ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-[#121214]">
                    Edit: {editingTemplate.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="text-xs text-[#e8276b] font-bold"
                  >
                    Back to Templates
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121214] mb-1">Template Body</label>
                  <textarea
                    rows={5}
                    value={editingTemplate.body}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, body: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-black/[0.12] text-xs font-medium focus:outline-none focus:border-[#e8276b]"
                  />
                  <p className="text-[10px] text-[#64748b] mt-1">
                    Variables available: {'{client_name}'}, {'{event_date}'}, {'{studio_name}'}, {'{balance_due}'}, {'{package_name}'}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplates((prev) =>
                        prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
                      );
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#121214] text-white text-xs font-bold"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-[#faf8f9] border border-black/[0.06] hover:border-black/20 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#121214]">{tpl.title}</p>
                        <p className="text-[10px] text-[#64748b]">{tpl.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(tpl)}
                        className="text-xs font-bold text-[#e8276b] hover:underline"
                      >
                        Customize
                      </button>
                    </div>
                    <p className="text-xs text-[#52525b] leading-relaxed italic bg-white p-2.5 rounded-lg border border-black/[0.04]">
                      "{tpl.body}"
                    </p>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setEditTemplatesModalOpen(false)}
                  className="w-full mt-3 h-10 rounded-xl bg-[#121214] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Terms / Privacy Info Modal */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInfoModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-bold text-[#121214]">
                {infoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#52525b] leading-relaxed">{infoModal.body}</p>
            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="w-full h-10 rounded-xl bg-[#121214] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 6. Confirm Logout Modal */}
      {confirmLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <h3 className="font-display text-base font-bold text-[#121214]">Log Out</h3>
            <p className="text-xs text-[#52525b]">
              Are you sure you want to log out of your Shilpi Studio account?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLogoutModalOpen(false)}
                className="flex-1 h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmLogoutModalOpen(false);
                  onLogout();
                }}
                className="flex-1 h-10 rounded-xl bg-[#e8276b] text-white text-xs font-bold"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Permanent Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <div className="flex items-center gap-3 text-[#dc2626]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-display text-base font-bold">Permanently Delete Account</h3>
            </div>

            <p className="text-xs text-[#52525b] leading-relaxed">
              This will <span className="font-bold text-[#dc2626]">permanently erase</span> all client records, bookings, and receipts. There is no way to recover this data.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#121214] mb-1">
                Reason for deleting <span className="text-[#dc2626]">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/[0.12] text-xs bg-[#faf8f9]"
              >
                <option value="">Select a reason...</option>
                {DELETION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#121214] mb-1">
                Type <span className="text-[#dc2626] font-extrabold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-black/[0.12] text-xs font-bold uppercase"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting || confirmText.trim().toUpperCase() !== 'DELETE' || !selectedReason}
                className="flex-1 h-10 rounded-xl bg-[#dc2626] disabled:opacity-40 text-white text-xs font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
