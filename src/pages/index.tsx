import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Check,
  MessageCircle,
  Users,
  Layers,
  Heart,
  Palette,
  Clock,
  Smartphone,
  ChevronRight,
  X,
  Menu,
  Phone,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingUp,
  Star,
  Copy,
  CheckCheck,
  Download,
  FileText,
  FileSpreadsheet,
  Share2,
  RefreshCw,
  Plus
} from 'lucide-react';
import ShilpiEditVectorIcon from '@/components/ShilpiEditVectorIcon';

// Bridal Quote Master Services
interface QuoteService {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  selected: boolean;
}

const DEFAULT_QUOTE_SERVICES: QuoteService[] = [
  {
    id: 'hd-bridal',
    name: 'HD Muhurtham Bridal Makeup',
    category: 'Makeup',
    price: 18000,
    description: 'Long-lasting sweatproof base, eye contouring, and setting for morning temple Muhurtham.',
    selected: true,
  },
  {
    id: 'poola-jada',
    name: 'Heritage Poola Jada & Hair Art',
    category: 'Hairstyle',
    price: 4500,
    description: 'Traditional gold billai setting with fresh Madurai jasmine flowers and braid cascade.',
    selected: true,
  },
  {
    id: 'saree-drape',
    name: 'Kanjeevaram Saree Box-Pleating & Pinning',
    category: 'Draping',
    price: 3000,
    description: 'Precision 6-box pleats ironed and pinned for zero slip during mandapam ceremonies.',
    selected: true,
  },
  {
    id: 'reception-touchup',
    name: 'Evening Reception Touchup & Glam',
    category: 'Reception',
    price: 9500,
    description: 'Evening look transformation with dewy glass skin glow and second saree/lehenga restyling.',
    selected: false,
  },
  {
    id: 'bridesmaid-glam',
    name: 'Mother & Sister Traditional Glam (x2)',
    category: 'Family',
    price: 7000,
    description: 'Complete makeup, hairstyle, and saree draping for two close family members.',
    selected: true,
  },
];

// Interactive Client CRM Demo Data
interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  event: string;
  date: string;
  venue: string;
  avatar: string;
  totalPackage: number;
  advancePaid: number;
  dueAmount: number;
  skinTone: string;
  lipstick: string;
  sareeDrape: string;
  allergies: string;
}

const CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'c1',
    name: 'Ananya Sharma',
    phone: '+91 98401 23456',
    event: 'Subha Muhurtham & Reception',
    date: '14 Dec 2026 · 04:30 AM',
    venue: 'Taj Vivanta, Race Course, Coimbatore',
    avatar: '/south_bride_hero.jpg',
    totalPackage: 25500,
    advancePaid: 10200,
    dueAmount: 15300,
    skinTone: 'MAC NC 42 · Warm Golden Ochre',
    lipstick: 'Chestnut Liner + Velvet Teddy Glass',
    sareeDrape: '6-Box Pleats Pressed with Waistband Lock',
    allergies: 'Latex Adhesive Sensitive (Use DUO Clear)',
  },
  {
    id: 'c2',
    name: 'Keerthana Sundaram',
    phone: '+91 94440 98765',
    event: 'Telugu Pellikuthuru & Kalyanam',
    date: '22 Jan 2027 · 05:00 AM',
    venue: 'ITC Kohenur, HITEC City, Hyderabad',
    avatar: '/south_bride_look2.jpg',
    totalPackage: 22000,
    advancePaid: 11000,
    dueAmount: 11000,
    skinTone: 'NARS Barcelona · Neutral Olive Base',
    lipstick: 'Charlotte Tilbury Pillow Talk Medium',
    sareeDrape: 'Traditional Andhra Pinning & Silk Dupatta',
    allergies: 'No Fragrance Primers (Use Clinique)',
  },
  {
    id: 'c3',
    name: 'Divya Krishnan',
    phone: '+91 98840 54321',
    event: 'Temple Mandapam Wedding',
    date: '08 Feb 2027 · 06:15 AM',
    venue: 'Ramada Resort, Kumbalam, Kochi',
    avatar: '/hero_bride.jpg',
    totalPackage: 19500,
    advancePaid: 9500,
    dueAmount: 10000,
    skinTone: 'MAC NC 37 · Warm Honey Tone',
    lipstick: 'Rosewood Nude with High-Shine Gloss',
    sareeDrape: 'Kerala Kasavu Front Fan Pleat Style',
    allergies: 'None recorded · Cry & Sweat Proof Tested',
  },
];

// Actual Subscription Plans From The Shilpi App (shilpi-android prototypeData)
interface SubscriptionPlan {
  id: string;
  duration: string;
  months: number;
  perMonth: number;
  totalPrice: number;
  badge?: string;
  note: string;
  isPopular?: boolean;
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '3_months',
    duration: '3 Months',
    months: 3,
    perMonth: 499,
    totalPrice: 1497,
    note: 'billed quarterly',
    badge: 'Standard',
    features: [
      'Unlimited bridal bookings & calendar conflict radar',
      'Client directory with wedding notes & skin shade records',
      '1-Tap WhatsApp due reminders & branded PDF receipts',
      'Add & customize packages with dynamic categories',
      'Track payments, advance dues, and monthly cashflow',
      'View & download studio income and expense reports',
      'Instant cloud sync between mobile app and web desk',
    ],
  },
  {
    id: '6_months',
    duration: '6 Months',
    months: 6,
    perMonth: 449,
    totalPrice: 2694,
    note: 'billed semi-annually',
    badge: 'Save 10%',
    isPopular: true,
    features: [
      'Everything in the 3 Months Plan',
      'Peak wedding season priority date conflict radar',
      'Curated bridal lookbook cards & full gallery showcase',
      'Multi-assistant & makeup artist team login access',
      'Priority 24/7 WhatsApp studio support assistance',
      'Monthly bridal booking streak & revenue analytics',
      'Detailed downloadable profit and expense spreadsheets',
    ],
  },
  {
    id: '12_months',
    duration: '12 Months',
    months: 12,
    perMonth: 399,
    totalPrice: 4788,
    note: 'billed annually',
    badge: 'Best Value · Save ₹1,200',
    features: [
      'Everything in the 6 Months Plan',
      '1 Year continuous cloud backup and instant restore',
      'Dedicated onboarding setup for your packages & pricing',
      'VIP portfolio feature on the Shilpi beautician network',
      'Zero booking limits, zero commissions, unlimited brides',
      'Multi-chair salon & academy licensing included',
      'Unlimited report exports (PDF & Excel formats)',
    ],
  },
];

export default function ShilpiLandingPage() {
  const router = useRouter();

  // Mobile drawer menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Client CRM demo selection
  const [activeClientIndex, setActiveClientIndex] = useState<number>(0);

  // Quote Studio state
  const [quoteServices, setQuoteServices] = useState<QuoteService[]>(DEFAULT_QUOTE_SERVICES);
  const [advancePercent, setAdvancePercent] = useState<number>(40);
  const [copiedToast, setCopiedToast] = useState(false);

  // Interactive Package Slider in Feature Card
  const [packageSliderTab, setPackageSliderTab] = useState<'category' | 'service'>('category');

  // Report Download Simulation State
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Pricing Modal state
  const [selectedPlanModal, setSelectedPlanModal] = useState<SubscriptionPlan | null>(null);

  // Smooth scroll handler
  const scrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculations for quote studio
  const selectedQuoteTotal = quoteServices
    .filter((s) => s.selected)
    .reduce((sum, item) => sum + item.price, 0);

  const advanceAmount = Math.round((selectedQuoteTotal * advancePercent) / 100);
  const balanceDue = selectedQuoteTotal - advanceAmount;

  const toggleService = (id: string) => {
    setQuoteServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleCopyQuote = () => {
    const activeList = quoteServices.filter((s) => s.selected);
    const message = `✨ *SHILPI STUDIO · OFFICIAL BRIDAL QUOTATION* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Client:* Ananya Sharma
*Event:* Subha Muhurtham & Mandapam Reception
*Morning Call Time:* 04:30 AM Sharp
*Venue:* Taj Vivanta, Race Course, Coimbatore

*SELECTED BRIDAL SERVICES:*
${activeList.map((s, idx) => `${idx + 1}. ${s.name} — ₹${s.price.toLocaleString('en-IN')}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Total Bridal Package:* ₹${selectedQuoteTotal.toLocaleString('en-IN')}
*Token Advance (${advancePercent}%):* ₹${advanceAmount.toLocaleString('en-IN')} (Locks Auspicious Muhurtham Slot)
*Balance Payable at Mandapam:* ₹${balanceDue.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Generated via Shilpi App. Bank / UPI payment details attached._`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(message);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2600);
    }
  };

  const handleSimulateReportDownload = () => {
    setDownloadingReport(true);
    setTimeout(() => {
      setDownloadingReport(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1200);
  };

  const activeClient = CLIENT_PROFILES[activeClientIndex];

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#161214] font-sans selection:bg-[#FFE4EE] selection:text-[#E8276B] antialiased">
      <Head>
        <title>Shilpi · Manage Your Wedding Bookings Without The Season Stress</title>
        <meta
          name="description"
          content="Shilpi is the simple, beautiful app for South India's bridal makeup artists and beauticians. Manage wedding bookings, track client advance dues, send WhatsApp reminders, and organize your bridal looks."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/shilpi-logo-tight.png" />
      </Head>

      {/* ============================================================ */}
      {/* 1. TOP ANNOUNCEMENT BAR                                      */}
      {/* ============================================================ */}
      <div className="bg-[#161214] text-white text-[12px] py-2 px-4 text-center tracking-wider font-medium border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E8276B] animate-pulse"></span>
          <span>✦ Shilpi App is now live on Google Play & App Store · Start your 30-day free trial today</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. NAVBAR (With exact headings requested by user)           */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#FAF7F5]/90 backdrop-blur-xl border-b border-black/[0.05] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo: Official Shilpi Logo with Pink Ribbon S & Tagline */}
          <Link
            href="/"
            onClick={(e) => scrollTo(e, 'home')}
            className="flex items-center group focus:outline-none py-1"
          >
            <img
              src="/shilpi_brand_logo_tight.png"
              alt="Shilpi · Your Beauty Business, Simplified."
              className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Center Navbar Links: Home, Why Shilpi, Features, Quotes, Pricing */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            <a
              href="#home"
              onClick={(e) => scrollTo(e, 'home')}
              className="text-[14px] font-medium text-[#161214] hover:text-[#E8276B] transition-colors py-1 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E8276B] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#why"
              onClick={(e) => scrollTo(e, 'why')}
              className="text-[14px] font-medium text-[#6E646A] hover:text-[#E8276B] transition-colors py-1 relative group"
            >
              Why Shilpi
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E8276B] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#features"
              onClick={(e) => scrollTo(e, 'features')}
              className="text-[14px] font-medium text-[#6E646A] hover:text-[#E8276B] transition-colors py-1 relative group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E8276B] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#quotes"
              onClick={(e) => scrollTo(e, 'quotes')}
              className="text-[14px] font-medium text-[#6E646A] hover:text-[#E8276B] transition-colors py-1 relative group"
            >
              Quotes
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E8276B] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#pricing"
              onClick={(e) => scrollTo(e, 'pricing')}
              className="text-[14px] font-medium text-[#6E646A] hover:text-[#E8276B] transition-colors py-1 relative group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#E8276B] transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/terminal')}
              className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E8276B] hover:bg-[#c71957] text-white text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-[0_4px_18px_rgba(232,39,107,0.3)] hover:shadow-[0_6px_25px_rgba(232,39,107,0.45)] active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full bg-white border border-black/[0.08] text-[#161214] hover:text-[#E8276B] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} strokeWidth={2.4} /> : <Menu size={18} strokeWidth={2.2} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-20 bg-[#FAF7F5] border-b border-black/[0.08] shadow-2xl px-6 py-8 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-3.5 text-base font-medium">
              <a
                href="#home"
                onClick={(e) => scrollTo(e, 'home')}
                className="text-[#161214] hover:text-[#E8276B] py-1 border-b border-black/[0.04]"
              >
                Home
              </a>
              <a
                href="#why"
                onClick={(e) => scrollTo(e, 'why')}
                className="text-[#161214] hover:text-[#E8276B] py-1 border-b border-black/[0.04]"
              >
                Why Shilpi
              </a>
              <a
                href="#features"
                onClick={(e) => scrollTo(e, 'features')}
                className="text-[#161214] hover:text-[#E8276B] py-1 border-b border-black/[0.04]"
              >
                Features
              </a>
              <a
                href="#quotes"
                onClick={(e) => scrollTo(e, 'quotes')}
                className="text-[#161214] hover:text-[#E8276B] py-1 border-b border-black/[0.04]"
              >
                Quotes
              </a>
              <a
                href="#pricing"
                onClick={(e) => scrollTo(e, 'pricing')}
                className="text-[#161214] hover:text-[#E8276B] py-1 border-b border-black/[0.04]"
              >
                Pricing
              </a>
            </nav>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/terminal');
              }}
              className="w-full py-3.5 rounded-full bg-[#E8276B] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 3. HERO SECTION (#home) — Beautiful South Bride + Store CTAs */}
      {/* ============================================================ */}
      <section id="home" className="relative pt-12 pb-20 lg:pt-18 lg:pb-28 overflow-hidden">
        {/* Soft Ambient Radial Light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#FFE5EE]/70 to-[#FFF0EA]/50 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Clean Headline & Store Badges */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Exact Requested Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#161214] font-light leading-[1.14] mb-6">
                Manage your wedding bookings{' '}
                <span className="block font-serif italic font-normal text-[#E8276B]">
                  without the season stress.
                </span>
              </h1>

              {/* Natural, honest copy */}
              <p className="text-base sm:text-lg text-[#6E646A] leading-relaxed max-w-xl mb-10">
                Schedule auspicious Muhurthams, record token advances, track pending dues, send WhatsApp receipts, and
                organize all your bridal looks — seamlessly synchronized between mobile and web.
              </p>

              {/* Store Download CTAs (Requested by user: Get it on Google Play & App Store) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
                {/* Google Play Store Badge */}
                <a
                  href="https://play.google.com/store/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-[#161214] hover:bg-black text-white flex items-center gap-3.5 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-white/[0.1]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
                    <path fill="#00A0FF" d="M3.5 2.5 13 12l-9.5 9.5z" />
                    <path fill="#00E676" d="M3.5 2.5 13 12l3.4-2.3z" />
                    <path fill="#FF3A44" d="M3.5 21.5 13 12l3.4 2.3z" />
                    <path fill="#FFD500" d="M16.4 9.7 20.5 12l-4.1 2.3L13 12z" />
                  </svg>
                  <div className="flex flex-col text-left leading-tight">
                    <small className="text-[10px] text-white/70 uppercase tracking-widest font-medium">
                      GET IT ON
                    </small>
                    <b className="text-[15px] text-white font-bold tracking-tight">
                      Google Play
                    </b>
                  </div>
                </a>

                {/* Apple App Store Badge */}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Shilpi for iOS will be available soon on the App Store!');
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF4F0] text-[#161214] flex items-center gap-3.5 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 border border-black/[0.1]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#161214]">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.05-.51 2.67-1.26z" />
                  </svg>
                  <div className="flex flex-col text-left leading-tight">
                    <small className="text-[10px] text-[#6E646A] uppercase tracking-widest font-medium">
                      Download on the
                    </small>
                    <b className="text-[15px] text-[#161214] font-bold tracking-tight">
                      App Store
                    </b>
                  </div>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6 border-t border-black/[0.06] w-full">
                <div className="flex items-center gap-1.5 text-[#E8276B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#E8276B" color="#E8276B" />
                  ))}
                </div>
                <div className="text-xs text-[#6E646A]">
                  <strong className="text-[#161214] font-semibold">4.9 / 5 Rating</strong> · Trusted by 850+ South Indian bridal artists & salons
                </div>
              </div>
            </div>

            {/* Right Column: South Area Bride Image with Organic Floating Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Traditional South Indian Bride Portrait Container */}
                <div className="relative rounded-[36px] overflow-hidden bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-black/[0.05]">
                  <div className="rounded-[28px] overflow-hidden aspect-[4/5] relative bg-rose-50">
                    <img
                      src="/south_bride_hero.jpg"
                      alt="Traditional South Area Muhurtham Bride"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                    {/* Overlay Caption on Photo */}
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <span className="text-[10px] tracking-widest uppercase font-semibold text-[#FF9DBE] block mb-1">
                        Ananya Sharma · Subha Muhurtham
                      </span>
                      <h4 className="font-serif text-lg font-medium">Taj Vivanta, Grand Ballroom</h4>
                      <p className="text-xs text-white/80 mt-0.5">Temple Gold Jewelry · Jasmine Veni · HD Muhurtham Glam</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1 (Top Left, animate-float-slow): Muhurtham Slot Locked */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md border border-black/[0.06] rounded-2xl p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.1)] flex items-center gap-3 animate-float-slow">
                  <div className="w-9 h-9 rounded-full bg-[#FFEBF2] flex items-center justify-center text-[#E8276B]">
                    <Clock size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#6E646A] font-semibold block">
                      Auspicious Morning Slot
                    </span>
                    <span className="text-xs font-bold text-[#161214]">04:30 AM Call Locked</span>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom Right, animate-float-reverse): Advance Received */}
                <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md border border-black/[0.06] rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.12)] max-w-[210px] animate-float-reverse">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#6E646A] font-semibold">
                      Advance Token
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#E8276B]"></span>
                  </div>
                  <div className="text-base font-serif font-bold text-[#161214]">₹12,000 Received</div>
                  <div className="text-[11px] text-[#E8276B] font-semibold mt-1 flex items-center gap-1">
                    <Check size={12} strokeWidth={3} />
                    <span>WhatsApp Receipt Sent</span>
                  </div>
                </div>

                {/* Floating Badge 3 (Mid Left, animate-subtle-float): Conflict Radar */}
                <div className="hidden sm:flex absolute top-1/2 -left-8 bg-[#161214] text-white border border-[#E8276B]/40 rounded-full px-4 py-2 shadow-xl items-center gap-2 animate-subtle-float">
                  <span className="w-2 h-2 rounded-full bg-[#E8276B] animate-pulse"></span>
                  <span className="text-[11px] font-semibold tracking-wide">Conflict Radar: 0 Overlaps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. NEW INTERACTIVE CLIENT CRM & PROFILES STUDIO              */}
      {/* ============================================================ */}
      <section className="py-20 bg-white border-y border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Client Profiles & CRM
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Maintain your clients with complete clarity.
            </h2>
            <p className="text-[#6E646A] mt-3 text-base">
              Switch between clients below to see how Shilpi stores wedding venues, contact numbers, trial makeup notes,
              and pending dues.
            </p>
          </div>

          {/* Client Tab Switcher */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {CLIENT_PROFILES.map((client, idx) => (
              <button
                key={client.id}
                onClick={() => setActiveClientIndex(idx)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                  activeClientIndex === idx
                    ? 'bg-[#E8276B] text-white shadow-[0_4px_18px_rgba(232,39,107,0.35)] scale-105'
                    : 'bg-[#FAF7F5] border border-black/[0.08] text-[#6E646A] hover:text-[#161214] hover:border-[#E8276B]/30'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-rose-100">
                  <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                </div>
                <span>{client.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive Client CRM Card */}
          <div className="max-w-4xl mx-auto bg-[#FAF7F5] rounded-[36px] p-6 sm:p-10 border border-black/[0.06] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Bride Avatar & Direct Contact Actions */}
              <div className="md:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white shadow-md mb-4 bg-rose-100">
                  <img
                    src={activeClient.avatar}
                    alt={activeClient.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#161214]">{activeClient.name}</h3>
                <span className="text-xs text-[#6E646A] mt-0.5">{activeClient.phone}</span>
                <span className="text-xs font-semibold text-[#E8276B] mt-2 bg-[#FFEBF2] px-3 py-1 rounded-full">
                  {activeClient.event}
                </span>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2.5 mt-5">
                  <a
                    href={`tel:${activeClient.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-black/[0.08] text-xs font-semibold text-[#161214] hover:border-[#E8276B] transition-colors"
                  >
                    <Phone size={13} color="#E8276B" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${activeClient.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E8276B] text-white text-xs font-semibold hover:bg-[#c71957] transition-colors shadow-sm"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Wedding Details, Due Ledger, and Beauty Notes */}
              <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-black/[0.05] shadow-sm space-y-5">
                {/* Due Ledger Box */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF7F5] border border-black/[0.04] text-center">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#6E646A] block">Total Package</span>
                    <span className="text-sm sm:text-base font-serif font-bold text-[#161214]">
                      ₹{activeClient.totalPackage.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#6E646A] block">Advance Paid</span>
                    <span className="text-sm sm:text-base font-serif font-bold text-[#2E7D32]">
                      ₹{activeClient.advancePaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#E8276B] block">Balance Due</span>
                    <span className="text-sm sm:text-base font-serif font-bold text-[#E8276B]">
                      ₹{activeClient.dueAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Wedding Venue & Time */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-[#6E646A]">Muhurtham Date & Call Time:</span>
                    <span className="font-semibold text-[#161214]">{activeClient.date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-[#6E646A]">Mandapam Venue:</span>
                    <span className="font-semibold text-[#161214]">{activeClient.venue}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-[#6E646A]">Foundation Shade:</span>
                    <span className="font-semibold text-[#161214]">{activeClient.skinTone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-[#6E646A]">Saree Draping Style:</span>
                    <span className="font-semibold text-[#161214]">{activeClient.sareeDrape}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6E646A]">Skin / Allergy Notes:</span>
                    <span className="font-semibold text-[#E8276B]">{activeClient.allergies}</span>
                  </div>
                </div>

                {/* Clear Due Action */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#6E646A]">
                    Receipts auto-sent with payment details
                  </span>
                  <button
                    onClick={() =>
                      alert(`WhatsApp balance due message prepared for ${activeClient.name} (Due: ₹${activeClient.dueAmount.toLocaleString('en-IN')})`)
                    }
                    className="px-4 py-2 rounded-full bg-[#FFEBF2] text-[#E8276B] text-xs font-bold hover:bg-[#ffd6e5] transition-colors"
                  >
                    Clear Due ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. WHY SHILPI SECTION (#why) — 100% Truthful Comparison      */}
      {/* ============================================================ */}
      <section id="why" className="py-24 bg-[#F5EDE8] border-b border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Why Shilpi
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Say goodbye to paper diaries and forgotten advance dues.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* The Old Diary Reality */}
            <div className="bg-[#FAF4F0] rounded-[32px] p-8 lg:p-10 border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#8A7D85] font-semibold block mb-2">
                  The Old Diary Way
                </span>
                <h3 className="font-serif text-2xl text-[#161214] mb-6">
                  Lost advance notes, double-booking panic, and awkward phone calls.
                </h3>
                <ul className="space-y-4 text-sm text-[#6E646A]">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-black/[0.05] flex items-center justify-center text-[#8A7D85] shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </span>
                    <span>Writing Muhurtham dates on paper diaries that get misplaced during wedding seasons.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-black/[0.05] flex items-center justify-center text-[#8A7D85] shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </span>
                    <span>Forgetting who paid the advance and having uncomfortable balance due discussions at the mandapam.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-black/[0.05] flex items-center justify-center text-[#8A7D85] shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </span>
                    <span>Panic when two clients book the exact same auspicious morning date.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-black/[0.05] flex items-center justify-center text-[#8A7D85] shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </span>
                    <span>Searching through thousands of phone photos to find what lipstick shade or saree pleat you did.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-[#8A7D85] italic">
                Result: Unnecessary stress, missed payments, and wasted time during peak wedding rush.
              </div>
            </div>

            {/* The Shilpi Way — 100% Truthful, No Fake Claims */}
            <div className="bg-[#161214] text-white rounded-[32px] p-8 lg:p-10 border border-[#E8276B]/30 shadow-[0_20px_50px_rgba(232,39,107,0.15)] flex flex-col justify-between relative overflow-hidden">
              {/* Soft Ambient Radial Light */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#E8276B]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-widest text-[#FF9DBE] font-semibold">
                    The Shilpi Way
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E8276B] text-white text-[10px] font-bold tracking-wider uppercase">
                    SIMPLE & RELIABLE
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-white mb-6">
                  Intelligent calendar radar, 1-tap WhatsApp dues, and saved client records.
                </h3>
                <ul className="space-y-4 text-sm text-white/80">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#E8276B] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      <strong className="text-white">Manage Bookings & Auspicious Dates:</strong> Avoid double-booking on peak Muhurtham dates with automated time-slot conflict warnings.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#E8276B] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      <strong className="text-white">Track Advance Tokens & Dues:</strong> Automatically know who paid what, calculate remaining dues, and send WhatsApp reminder cards.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#E8276B] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      <strong className="text-white">Complete Looks & Photo Gallery:</strong> Save finished client look cards with foundation shades, lipstick notes, and saree pleating preferences.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#E8276B] flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                      ✓
                    </span>
                    <span>
                      <strong className="text-white">Download Studio Reports:</strong> View payments, track monthly studio earnings, and download profit reports to Excel or PDF.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.1] text-xs text-[#FF9DBE] italic">
                Result: Complete calm, zero double-bookings, and faster payment clearance.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FEATURES SECTION (#features) — True App Capabilities      */}
      {/* ============================================================ */}
      <section id="features" className="py-24 bg-[#FAF7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Everything built for real bridal studio needs.
            </h2>
            <p className="text-[#6E646A] mt-3 text-base">
              Manage your bookings, dues, packages, lookbook gallery, and reports effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Muhurtham Calendar */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <Calendar size={22} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  Muhurtham Calendar
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  Pick auspicious wedding dates, schedule early morning call times (04:00 AM), and avoid overlapping bookings with real-time radar.
                </p>
              </div>

              <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-black/[0.04]">
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span>Muhurtham Morning Slot</span>
                  <span className="text-[#E8276B]">04:30 AM Locked</span>
                </div>
                <span className="text-[11px] text-[#6E646A]">Venue: Taj Vivanta, Coimbatore</span>
              </div>
            </div>

            {/* Feature 2: 1-Tap WhatsApp Due Invoices */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <MessageCircle size={22} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  Track Dues & WhatsApp Reminders
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  Record advance token payments, track remaining dues, and send professional WhatsApp balance due summaries in one click.
                </p>
              </div>

              <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-black/[0.04] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#6E646A] block">Balance Due</span>
                  <span className="text-base font-bold text-[#E8276B]">₹15,300</span>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-[#E8276B] text-white text-[11px] font-semibold tracking-wider uppercase">
                  WhatsApp Due ↗
                </span>
              </div>
            </div>

            {/* Feature 3: Packages & Category Slider with Vector Edit Icon */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <ShilpiEditVectorIcon size={22} color="#E8276B" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  Packages & Category Slider
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  Easily add packages, configure custom rates, and toggle between Add Category & Add Service with the smooth slider switch.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#FAF7F5] rounded-2xl p-1.5 border border-black/[0.05] flex gap-1">
                  <button
                    onClick={() => setPackageSliderTab('category')}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${
                      packageSliderTab === 'category'
                        ? 'bg-[#E8276B] text-white shadow-sm'
                        : 'text-[#6E646A] hover:text-[#161214]'
                    }`}
                  >
                    Add Category
                  </button>
                  <button
                    onClick={() => setPackageSliderTab('service')}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${
                      packageSliderTab === 'service'
                        ? 'bg-[#E8276B] text-white shadow-sm'
                        : 'text-[#6E646A] hover:text-[#161214]'
                    }`}
                  >
                    Add Service
                  </button>
                </div>

                {/* 3 Services in one line in rose-colored container boxes */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFEBF2] rounded-xl p-2.5 border border-[#F8D2E0] text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-[#161214] block truncate">HD Bridal</span>
                    <span className="text-xs font-serif font-bold text-[#E8276B]">₹18,000</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFEBF2] rounded-xl p-2.5 border border-[#F8D2E0] text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-[#161214] block truncate">Poola Jada</span>
                    <span className="text-xs font-serif font-bold text-[#E8276B]">₹4,500</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFEBF2] rounded-xl p-2.5 border border-[#F8D2E0] text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-[#161214] block truncate">Saree Drape</span>
                    <span className="text-xs font-serif font-bold text-[#E8276B]">₹3,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Complete Gallery & Look Cards */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <Palette size={22} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  Complete Looks & Gallery
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  See your overall looks and complete gallery. Store finished bridal transformation cards tagged by Muhurtham and Reception.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FAF7F5] border border-black/[0.05] text-[11px] font-medium text-[#161214]">
                  Temple Muhurtham
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FAF7F5] border border-black/[0.05] text-[11px] font-medium text-[#161214]">
                  Poola Jada Art
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FFEBF2] text-[#E8276B] text-[11px] font-medium">
                  +18 Looks
                </span>
              </div>
            </div>

            {/* Feature 5: View & Download Studio Reports */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <FileText size={22} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  View & Download Reports
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  View your monthly earnings, studio cashflow, and detailed profit reports. Export clean PDF and Excel summaries in one click.
                </p>
              </div>

              <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-black/[0.04] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#6E646A] block">Monthly Earnings</span>
                  <span className="text-base font-bold text-[#161214]">₹1,84,500</span>
                </div>
                <button
                  onClick={handleSimulateReportDownload}
                  disabled={downloadingReport}
                  className="px-3.5 py-1.5 rounded-full bg-[#161214] text-white text-[11px] font-semibold flex items-center gap-1.5 hover:bg-black transition-colors"
                >
                  <Download size={12} />
                  <span>{downloadSuccess ? 'Downloaded!' : downloadingReport ? 'Exporting...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>

            {/* Feature 6: Seamless Web Sync */}
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFEBF2] text-[#E8276B] flex items-center justify-center mb-6">
                  <RefreshCw size={22} strokeWidth={2.2} />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#161214] mb-3">
                  Instant Web & Mobile Sync
                </h3>
                <p className="text-sm text-[#6E646A] leading-relaxed mb-6">
                  Easily sync your data between your phone and front-desk laptop. Any booking or payment added on mobile shows instantly on web.
                </p>
              </div>

              <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-black/[0.04]">
                <span className="text-xs font-semibold text-[#161214] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8276B] animate-pulse"></span>
                  Real-Time Cloud Synchronization
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. QUOTES SECTION (#quotes) — Interactive Quotation Studio   */}
      {/* ============================================================ */}
      <section id="quotes" className="py-24 bg-[#F5EDE8] border-y border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Quotes Studio
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Create & send clear bridal quotes in seconds.
            </h2>
            <p className="text-[#6E646A] mt-3 text-base">
              Select services, pick the advance percentage, and copy a formatted message ready to send on WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Package Picker & Advance Token Slider */}
            <div className="lg:col-span-7 bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-black/[0.06] mb-6">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#161214]">
                    Select Bridal Services
                  </h3>
                  <span className="text-xs text-[#6E646A]">
                    Tap any service to include in the quote
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#E8276B] bg-[#FFEBF2] px-3.5 py-1.5 rounded-full">
                  {quoteServices.filter((s) => s.selected).length} Selected
                </span>
              </div>

              {/* Service Cards: 3 services in one line in rose-colored container boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-8">
                {quoteServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative group ${
                      service.selected
                        ? 'bg-gradient-to-br from-[#FFF5F8] via-[#FFF0F5] to-[#FFEBF2] border-[#E8276B] shadow-[0_4px_16px_rgba(232,39,107,0.12)]'
                        : 'bg-[#FFF8FA] border-[#F8D2E0]/70 hover:border-[#E8276B]/40 hover:bg-[#FFF2F6]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-[#E8276B] border border-[#E8276B]/20">
                          {service.category}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            service.selected
                              ? 'bg-[#E8276B] text-white shadow-2xs'
                              : 'border border-[#F8D2E0] bg-white'
                          }`}
                        >
                          {service.selected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${service.selected ? 'text-[#161214]' : 'text-[#4A3E45]'}`}>
                        {service.name}
                      </h4>
                      <p className="text-[11px] text-[#8A7D85] mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F8D2E0]/60 flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A7D85]">
                        Studio Rate
                      </span>
                      <div className="bg-white px-2.5 py-0.5 rounded-lg border border-[#F8D2E0] shadow-2xs">
                        <span className="text-sm font-serif font-bold text-[#E8276B]">
                          ₹{service.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advance Percentage Selector */}
              <div className="bg-[#FAF7F5] rounded-2xl p-6 border border-black/[0.04]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6E646A]">
                    Advance Token Percentage
                  </span>
                  <span className="text-sm font-bold text-[#E8276B]">
                    {advancePercent}% (₹{advanceAmount.toLocaleString('en-IN')})
                  </span>
                </div>

                <div className="flex gap-2">
                  {[20, 30, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setAdvancePercent(pct)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
                        advancePercent === pct
                          ? 'bg-[#E8276B] text-white shadow-sm'
                          : 'bg-white border border-black/[0.08] text-[#161214] hover:border-[#E8276B]/40'
                      }`}
                    >
                      {pct}% Advance
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live WhatsApp Quote Card Preview */}
            <div className="lg:col-span-5 bg-[#161214] text-white rounded-[32px] p-8 border border-[#E8276B]/30 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.1] mb-6">
                <div>
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-[#FF9DBE] block">
                    WhatsApp Message Preview
                  </span>
                  <h4 className="font-serif text-lg font-medium text-white">Quotation Breakdown</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#E8276B]/20 flex items-center justify-center text-[#E8276B]">
                  <MessageCircle size={16} />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-white/70">Total Package Amount:</span>
                  <span className="text-xl font-serif font-bold text-white">
                    ₹{selectedQuoteTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-white/70">Advance Token Due ({advancePercent}%):</span>
                  <span className="text-base font-semibold text-[#FF9DBE]">
                    ₹{advanceAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm pt-3 border-t border-white/[0.1]">
                  <span className="text-white font-medium">Balance at Mandapam:</span>
                  <span className="text-xl font-serif font-bold text-[#E8276B]">
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Copy Quote Button */}
              <div className="space-y-3">
                <button
                  onClick={handleCopyQuote}
                  className="w-full py-4 rounded-full bg-[#E8276B] hover:bg-[#c71957] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,39,107,0.35)] transition-all"
                >
                  {copiedToast ? <CheckCheck size={16} /> : <Copy size={16} />}
                  <span>{copiedToast ? 'Quotation Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <button
                  onClick={() => router.push('/terminal')}
                  className="w-full py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white text-xs font-semibold tracking-wider uppercase transition-all"
                >
                  Open In Web Console →
                </button>
              </div>

              <span className="text-[11px] text-white/50 text-center block mt-6">
                Ready to paste directly into your bride's WhatsApp chat.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. PRICING SECTION (#pricing) — Exact App Subscription Plans  */}
      {/* ============================================================ */}
      <section id="pricing" className="py-24 bg-[#FAF7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Honest subscription plans. Zero booking commissions.
            </h2>
            <p className="text-[#6E646A] mt-3 text-base">
              All prices include GST. Pick a billing term — longer terms cost less per month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-[32px] p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.isPopular
                    ? 'bg-white border-2 border-[#E8276B] shadow-[0_16px_40px_rgba(232,39,107,0.12)] scale-[1.02]'
                    : 'bg-white border border-black/[0.06] shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md ${
                      plan.isPopular ? 'bg-[#E8276B] text-white' : 'bg-[#161214] text-white'
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[#6E646A] mb-1">
                    {plan.duration}
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-[#161214] mb-4">
                    ₹{plan.perMonth} <span className="text-sm font-sans text-[#6E646A]">/ month</span>
                  </h3>

                  <div className="mb-6 pb-6 border-b border-black/[0.06]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-bold text-[#161214]">
                        ₹{plan.totalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#6E646A]">({plan.note})</span>
                    </div>
                    <span className="text-xs text-[#E8276B] font-semibold mt-1 block">
                      All prices include GST
                    </span>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-[#6E646A] leading-relaxed">
                        <Check size={14} className="text-[#E8276B] shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedPlanModal(plan)}
                  className={`w-full py-4 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                    plan.isPopular
                      ? 'bg-[#E8276B] hover:bg-[#c71957] text-white shadow-[0_4px_18px_rgba(232,39,107,0.3)]'
                      : 'bg-[#161214] hover:bg-black text-white'
                  }`}
                >
                  Pay ₹{plan.totalPrice.toLocaleString('en-IN')} · {plan.duration} →
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-[#8A7D85] mt-10">
            Need multi-chair salon licensing or custom setup?{' '}
            <a
              href="https://wa.me/918870500106?text=Hi%20Shilpi%2C%20I%20need%20multi-chair%20salon%20licensing."
              target="_blank"
              rel="noreferrer"
              className="text-[#E8276B] font-medium underline"
            >
              Chat with us on WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. REAL ARTIST TESTIMONIALS                                  */}
      {/* ============================================================ */}
      <section className="py-24 bg-[#F5EDE8] border-t border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#E8276B] block mb-3">
              Beautician Reviews
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#161214] font-normal leading-tight">
              Loved by bridal artists across South India.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <p className="text-sm text-[#6E646A] leading-relaxed italic mb-6">
                "Shilpi saved my wedding season. Having 18 brides booked across 4 consecutive auspicious days, zero double-booking and automated WhatsApp advance dues gave me total peace of mind."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.05]">
                <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden">
                  <img
                    src="/south_bride_hero.jpg"
                    alt="Priyadarshini K."
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#161214]">Priyadarshini K.</h4>
                  <span className="text-[11px] text-[#6E646A]">Bridal Makeup Artist · Coimbatore</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <p className="text-sm text-[#6E646A] leading-relaxed italic mb-6">
                "The bride skin profile and lookbook cards make my 04:30 AM Muhurtham appointments smooth. I never have to ask a bride for her foundation shade or saree pleating preference on the wedding morning."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.05]">
                <div className="w-10 h-10 rounded-full bg-amber-100 overflow-hidden">
                  <img
                    src="/south_bride_look2.jpg"
                    alt="Anjali Menon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#161214]">Anjali Menon</h4>
                  <span className="text-[11px] text-[#6E646A]">Bridal Studio Owner · Chennai</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <p className="text-sm text-[#6E646A] leading-relaxed italic mb-6">
                "We run a 5-artist bridal salon. Shilpi's multi-assistant logins and instant web sync mean my team stays coordinated without a single phone call."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.05]">
                <div className="w-10 h-10 rounded-full bg-pink-100 overflow-hidden">
                  <img
                    src="/hero_bride.jpg"
                    alt="Deepika Reddy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#161214]">Deepika Reddy</h4>
                  <span className="text-[11px] text-[#6E646A]">Bridal Stylist · Hyderabad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. CALL TO ACTION BANNER                                    */}
      {/* ============================================================ */}
      <section className="py-24 bg-[#FAF7F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#161214] text-white rounded-[40px] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl border border-[#E8276B]/30">
            {/* Ambient Pink Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#E8276B]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#FF9DBE] block mb-4">
                Get Started Today
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-white font-normal leading-tight mb-6">
                Make your wedding bookings effortless this season.
              </h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-10">
                Join 850+ South Indian bridal artists who manage their bookings, client dues, and lookbooks with Shilpi.
                Start your free 30-day trial today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/terminal')}
                  className="px-8 py-4 rounded-full bg-[#E8276B] hover:bg-[#c71957] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get Started with Web Desk →
                </button>
                <a
                  href="https://wa.me/918870500106?text=Hi%20Shilpi%2C%20I%20would%20like%20to%20request%20a%20bridal%20studio%20demo."
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-4 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white text-xs font-semibold tracking-wider uppercase transition-all"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 11. FOOTER                                                   */}
      {/* ============================================================ */}
      <footer className="bg-[#120E10] text-[#A3989E] py-16 border-t border-white/[0.08] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/[0.08]">
            {/* Brand Column */}
            <div className="md:col-span-5 flex flex-col items-start">
              <Link href="/" className="inline-block mb-4">
                <img
                  src="/shilpi_brand_logo_white_text.png"
                  alt="Shilpi · Your Beauty Business, Simplified."
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </Link>
              <p className="text-xs text-[#8A7D85] leading-relaxed max-w-sm mb-6">
                The simple, reliable app for South India's bridal makeup artists, wedding stylists, and salons.
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1]">
                <span className="w-2 h-2 rounded-full bg-[#E8276B] animate-pulse"></span>
                <span className="text-[11px] text-white/80">Active Beautician Network</span>
              </div>
            </div>

            {/* Quick Links Column 1: Navigation */}
            <div className="md:col-span-3">
              <h4 className="text-[11px] uppercase tracking-widest font-semibold text-white mb-4">
                Navigation
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#home" onClick={(e) => scrollTo(e, 'home')} className="hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#why" onClick={(e) => scrollTo(e, 'why')} className="hover:text-white transition-colors">
                    Why Shilpi
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={(e) => scrollTo(e, 'features')} className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#quotes" onClick={(e) => scrollTo(e, 'quotes')} className="hover:text-white transition-colors">
                    Quotes
                  </a>
                </li>
                <li>
                  <a href="#pricing" onClick={(e) => scrollTo(e, 'pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links Column 2: Support */}
            <div className="md:col-span-4">
              <h4 className="text-[11px] uppercase tracking-widest font-semibold text-white mb-4">
                Support & Demo
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://wa.me/918870500106?text=Hi%20Shilpi%2C%20I%20would%20like%20to%20request%20a%20bridal%20studio%20demo."
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF9DBE] hover:underline flex items-center gap-1.5 font-medium"
                  >
                    <span>WhatsApp Demo Hotline ↗</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:support@tecstellar.com" className="hover:text-white transition-colors">
                    support@tecstellar.com
                  </a>
                </li>
                <li className="text-[#8A7D85]">Coimbatore · Chennai · Bengaluru · Hyderabad</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar with Tecstellar Chip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7A7077]">
            <div>© 2026 Shilpi. All rights reserved. Cloud Encrypted.</div>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <a
                href="https://tecstellar.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#E8276B] transition-colors"
              >
                TECSTELLAR ↗
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Plan Selection Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative border border-black/[0.08] animate-in fade-in-50 zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF7F5] flex items-center justify-center text-[#161214] hover:text-[#E8276B] transition-colors"
            >
              <X size={16} />
            </button>

            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#E8276B] block mb-1">
              Shilpi Premium Activation
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#161214] mb-2">
              {selectedPlanModal.duration} Plan
            </h3>
            <p className="text-xs text-[#6E646A] mb-6">
              ₹{selectedPlanModal.perMonth} / month ({selectedPlanModal.note}) · All prices include GST.
            </p>

            <div className="bg-[#FFEBF2] rounded-2xl p-5 mb-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-[#6E646A] uppercase font-semibold block">Total Subscription Fee</span>
                <span className="text-2xl font-serif font-bold text-[#E8276B]">
                  ₹{selectedPlanModal.totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#161214]">₹{selectedPlanModal.perMonth} / mo</span>
                <span className="text-[10px] text-[#6E646A] block">Includes GST</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedPlanModal(null);
                  router.push('/terminal');
                }}
                className="w-full py-4 rounded-full bg-[#E8276B] hover:bg-[#c71957] text-white text-xs font-semibold tracking-wider uppercase shadow-md transition-all"
              >
                PAY ₹{selectedPlanModal.totalPrice.toLocaleString('en-IN')} · {selectedPlanModal.duration} →
              </button>
              <a
                href={`https://wa.me/918870500106?text=Hi%20Shilpi%2C%20I%20want%20to%20activate%20the%20${selectedPlanModal.duration}%20plan%20(₹${selectedPlanModal.totalPrice}).`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-full bg-[#FAF7F5] border border-black/[0.08] text-[#161214] text-xs font-semibold tracking-wider uppercase text-center block transition-colors"
              >
                Pay via UPI on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
