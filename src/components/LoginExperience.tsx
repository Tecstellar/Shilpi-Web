import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  QrCode,
  RotateCw,
  ScanLine,
  Smartphone,
} from 'lucide-react';

interface LoginExperienceProps {
  activeTab: 'phone' | 'qr';
  setActiveTab: (tab: 'phone' | 'qr') => void;
  phone: string;
  setPhone: (val: string) => void;
  otp: string;
  setOtp: (val: string) => void;
  otpSent: boolean;
  setOtpSent: (val: boolean) => void;
  loading: boolean;
  errorMessage: string;
  demoNotice: string;
  qrDataUrl: string | null;
  pairingStatus: string;
  onRefreshQr: () => void;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  onFillDemo: () => void;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function LoginExperience({
  activeTab,
  setActiveTab,
  phone,
  setPhone,
  otp,
  setOtp,
  otpSent,
  setOtpSent,
  loading,
  errorMessage,
  demoNotice,
  qrDataUrl,
  pairingStatus,
  onRefreshQr,
  onSendOtp,
  onVerifyOtp,
  onFillDemo,
}: LoginExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ribbonGroupRef = useRef<SVGGElement>(null);
  const wedgeGroupRef = useRef<SVGGElement>(null);
  const outerRingRef = useRef<SVGCircleElement>(null);
  const innerRingRef = useRef<SVGCircleElement>(null);

  const tabListRef = useRef<HTMLDivElement>(null);
  const qrTabRef = useRef<HTMLButtonElement>(null);
  const phoneTabRef = useRef<HTMLButtonElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const scanBeamRef = useRef<HTMLDivElement>(null);
  const qrBracketsRef = useRef<HTMLDivElement>(null);
  const refreshIconRef = useRef<SVGSVGElement>(null);
  const phoneBoxRef = useRef<HTMLDivElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const prevTabRef = useRef<'phone' | 'qr'>(activeTab);
  const [hasMounted, setHasMounted] = useState(false);

  // Clean 6-digit array derived from otp string
  const otpDigits = Array.from({ length: 6 }, (_, i) => otp[i] || '');

  // 1. Initial Choreographed Architectural Entrance & Ambient Calibration Motion
  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

        // Hairline drafting axes expand crisply along grid edges
        tl.from('[data-axis-x]', {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.7,
          stagger: 0.06,
        })
          .from(
            '[data-axis-y]',
            {
              scaleY: 0,
              transformOrigin: 'center top',
              duration: 0.7,
            },
            0.05
          )
          // Masked typographic reveal (editorial clip-path, zero clumsy bounce)
          .from(
            '[data-clip-reveal]',
            {
              clipPath: 'inset(0 0 100% 0)',
              y: 18,
              opacity: 0.01,
              duration: 0.68,
              stagger: 0.08,
            },
            0.12
          )
          // SVG Shilpi ribbon stroke draw-in + sculptural fill reveal
          .from(
            '[data-ribbon-stroke]',
            {
              strokeDashoffset: 560,
              duration: 0.95,
              ease: 'power3.out',
            },
            0.08
          )
          .from(
            '[data-ribbon-fill]',
            {
              opacity: 0,
              scale: 0.94,
              transformOrigin: 'center center',
              duration: 0.6,
            },
            0.35
          )
          .from(
            '[data-wedge-float]',
            {
              opacity: 0,
              scale: 0.75,
              y: (i: number) => (i === 0 ? -18 : 18),
              transformOrigin: 'center center',
              duration: 0.65,
              stagger: 0.08,
            },
            0.28
          )
          // Auth column quiet arrival
          .from(
            '[data-auth-entrance]',
            {
              y: 14,
              opacity: 0,
              duration: 0.55,
              stagger: 0.06,
            },
            0.18
          );

        // Slow precision calibration rotation on architectural rings
        if (outerRingRef.current) {
          gsap.to(outerRingRef.current, {
            rotation: 360,
            transformOrigin: 'center center',
            duration: 38,
            repeat: -1,
            ease: 'none',
          });
        }
        if (innerRingRef.current) {
          gsap.to(innerRingRef.current, {
            rotation: -360,
            transformOrigin: 'center center',
            duration: 26,
            repeat: -1,
            ease: 'none',
          });
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from('[data-auth-entrance], [data-clip-reveal]', {
          opacity: 0,
          duration: 0.25,
          ease: 'power1.out',
        });
      });

      setHasMounted(true);
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // 2. Subtle Desktop Pointer Parallax on the Kinetic Ribbon Stage
  useEffect(() => {
    const stage = stageRef.current;
    const ribbon = ribbonGroupRef.current;
    const wedges = wedgeGroupRef.current;
    if (!stage || !ribbon || !wedges) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReduced || !hasFinePointer) return;

    const xRibbon = gsap.quickTo(ribbon, 'x', { duration: 0.7, ease: 'power3.out' });
    const yRibbon = gsap.quickTo(ribbon, 'y', { duration: 0.7, ease: 'power3.out' });
    const xWedge = gsap.quickTo(wedges, 'x', { duration: 0.9, ease: 'power3.out' });
    const yWedge = gsap.quickTo(wedges, 'y', { duration: 0.9, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      xRibbon(nx * 14);
      yRibbon(ny * 10);
      xWedge(nx * -22);
      yWedge(ny * -16);
    };

    const onLeave = () => {
      xRibbon(0);
      yRibbon(0);
      xWedge(0);
      yWedge(0);
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // 3. Shared Sliding Indicator + Mode-Reactive Artwork + Panel Choreography
  useIsomorphicLayoutEffect(() => {
    const activeBtn = activeTab === 'qr' ? qrTabRef.current : phoneTabRef.current;
    const indicator = tabIndicatorRef.current;

    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (activeBtn && indicator) {
        gsap.to(indicator, {
          x: activeBtn.offsetLeft - 4,
          width: activeBtn.offsetWidth,
          duration: reduced ? 0.15 : 0.42,
          ease: 'expo.out',
        });
      }

      // Morph left artwork geometry cleanly to mirror the selected login channel
      if (hasMounted && !reduced) {
        if (activeTab === 'qr') {
          gsap.to('[data-mode-bracket]', {
            scale: 1,
            opacity: 1,
            duration: 0.55,
            ease: 'expo.out',
          });
          gsap.to('[data-mode-wave]', {
            scaleX: 0.85,
            opacity: 0.28,
            duration: 0.55,
            ease: 'expo.out',
          });
        } else {
          gsap.to('[data-mode-bracket]', {
            scale: 1.09,
            opacity: 0.35,
            duration: 0.55,
            ease: 'expo.out',
          });
          gsap.to('[data-mode-wave]', {
            scaleX: 1.08,
            opacity: 0.9,
            duration: 0.55,
            ease: 'expo.out',
          });
        }
      }

      // Directional switch choreography inside the auth workspace
      if (hasMounted && panelContentRef.current) {
        const direction = activeTab === 'phone' && prevTabRef.current === 'qr' ? 16 : -16;
        const targets = panelContentRef.current.querySelectorAll('[data-panel-item]');
        if (targets.length > 0) {
          gsap.fromTo(
            targets,
            {
              opacity: 0,
              x: reduced ? 0 : direction,
            },
            {
              opacity: 1,
              x: 0,
              duration: reduced ? 0.18 : 0.36,
              stagger: reduced ? 0 : 0.04,
              ease: 'expo.out',
              clearProps: 'transform',
            }
          );
        }
      }

      prevTabRef.current = activeTab;
    }, rootRef);

    return () => ctx.revert();
  }, [activeTab, otpSent, hasMounted]);

  // 4. Optical Viewfinder Laser Sweep when QR Code is active and ready
  useEffect(() => {
    if (activeTab !== 'qr' || !qrDataUrl) return;
    const beam = scanBeamRef.current;
    const brackets = qrBracketsRef.current;
    if (!beam || !brackets) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        beam,
        { y: 12, opacity: 0.15 },
        {
          y: 164,
          opacity: 0.65,
          duration: 2.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }
      );

      gsap.fromTo(
        brackets,
        { scale: 1 },
        {
          scale: 1.022,
          duration: 2.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }
      );
    });

    return () => ctx.revert();
  }, [activeTab, qrDataUrl]);

  // Recalculate sliding tab indicator width on viewport resize
  useEffect(() => {
    const syncIndicator = () => {
      const activeBtn = activeTab === 'qr' ? qrTabRef.current : phoneTabRef.current;
      const indicator = tabIndicatorRef.current;
      if (activeBtn && indicator) {
        gsap.set(indicator, {
          x: activeBtn.offsetLeft - 4,
          width: activeBtn.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [activeTab]);

  // Auto-focus first empty OTP digit box when entering OTP step
  useEffect(() => {
    if (activeTab === 'phone' && otpSent) {
      const timer = window.setTimeout(() => {
        const firstEmpty = Math.min(otp.length, 5);
        otpInputRefs.current[firstEmpty]?.focus();
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, otpSent]);

  const handleRefreshWithSpin = () => {
    if (refreshIconRef.current) {
      gsap.fromTo(
        refreshIconRef.current,
        { rotation: 0 },
        { rotation: 360, duration: 0.55, ease: 'expo.out' }
      );
    }
    onRefreshQr();
  };

  const handleDemoFillPulse = () => {
    onFillDemo();
    if (phoneBoxRef.current) {
      gsap.fromTo(
        phoneBoxRef.current,
        { borderColor: '#e8276b', boxShadow: '0 0 0 4px rgba(232,39,107,0.16)' },
        {
          borderColor: 'rgba(18,18,20,0.14)',
          boxShadow: '0 0 0 0px rgba(232,39,107,0)',
          duration: 0.75,
          ease: 'power2.out',
        }
      );
    }
  };

  const handleOtpDigitChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = otpDigits.map((d, idx) => (idx === index ? '' : d)).join('');
      setOtp(next);
      return;
    }

    // Handle multi-digit paste cleanly across slots
    if (digitsOnly.length > 1) {
      const merged = digitsOnly.slice(0, 6);
      setOtp(merged);
      const focusTarget = Math.min(merged.length, 5);
      otpInputRefs.current[focusTarget]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = digitsOnly;
    setOtp(updated.join(''));

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      const focusIdx = Math.min(pasted.length - 1, 5);
      if (focusIdx >= 0) otpInputRefs.current[focusIdx]?.focus();
    }
  };

  const cleanDisplayPhone = phone.replace(/^\+?91\s*/, '').trim() || '9876543210';

  return (
    <div
      ref={rootRef}
      className="min-h-[100dvh] w-full bg-[#faf8f9] text-[#121214] grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] relative overflow-x-hidden"
    >
      {/* ============================================================= */}
      {/* LEFT ATELIER CANVAS: SCULPTURAL BRAND + KINETIC SVG GEOMETRY   */}
      {/* ============================================================= */}
      <section
        ref={stageRef}
        aria-label="Shilpi Studio Overview"
        className="relative flex flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:px-14 lg:py-12 overflow-hidden"
      >
        {/* Subtle hairline drafting frame inside canvas */}
        <div
          data-axis-x
          className="pointer-events-none hidden lg:block absolute top-10 left-14 right-14 h-px bg-black/[0.06]"
        />
        <div
          data-axis-x
          className="pointer-events-none hidden lg:block absolute bottom-10 left-14 right-14 h-px bg-black/[0.06]"
        />
        <div
          data-axis-y
          className="pointer-events-none hidden lg:block absolute top-10 bottom-10 right-0 w-px bg-black/[0.07]"
        />

        {/* Brand Header Row */}
        <header className="relative z-10 flex items-center justify-between lg:pt-4">
          <div data-clip-reveal className="flex items-center gap-3">
            {/* Crisp transparent vector SVG adaptation of Shilpi S-Ribbon Mark */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <defs>
                <linearGradient id="shilpiBrandGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ff4f76" />
                  <stop offset="55%" stopColor="#e8276b" />
                  <stop offset="100%" stopColor="#b80f4b" />
                </linearGradient>
              </defs>
              <path
                d="M14.5 11C10.5 19.5 14 27 24.5 30.8L39.5 36.2C47.5 39.2 50 45.5 45.5 54C52.5 46.5 52.5 36 41.5 30.8L26 24.4C18 21 15.5 16 14.5 11Z"
                fill="url(#shilpiBrandGrad)"
              />
              <path d="M40 16L54 9V25L40 16Z" fill="#e8276b" />
              <path d="M24 48L10 55V39L24 48Z" fill="#ff4f76" />
            </svg>

            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-lg font-extrabold tracking-[0.14em] text-[#121214]">
                SHILPI
              </span>
              <span className="hidden sm:inline text-xs font-medium text-[#52525b]">
                Studio Terminal
              </span>
            </div>
          </div>
        </header>

        {/* Centerpiece Kinetic SVG Atelier Geometry (hidden on very small phones to stay clean & compact) */}
        <div className="hidden lg:flex relative z-10 flex-1 items-center justify-center my-6">
          <svg
            viewBox="0 0 460 340"
            className="w-full max-w-[430px] h-auto select-none overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="sculptRibbonGrad" x1="125" y1="70" x2="335" y2="270" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff5b7f" />
                <stop offset="50%" stopColor="#e8276b" />
                <stop offset="100%" stopColor="#a50f45" />
              </linearGradient>
              <linearGradient id="axisFade" x1="0" y1="170" x2="460" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#121214" stopOpacity="0" />
                <stop offset="25%" stopColor="#121214" stopOpacity="0.1" />
                <stop offset="75%" stopColor="#121214" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#121214" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Precision Drafting Crosshairs */}
            <line x1="20" y1="170" x2="440" y2="170" stroke="url(#axisFade)" strokeWidth="1" />
            <line x1="230" y1="20" x2="230" y2="320" stroke="#121214" strokeOpacity="0.06" strokeWidth="1" />

            {/* Outer & Inner Rotating Calibration Rings */}
            <circle
              ref={outerRingRef}
              cx="230"
              cy="170"
              r="138"
              stroke="#121214"
              strokeOpacity="0.09"
              strokeWidth="1"
              strokeDasharray="3 9"
            />
            <circle
              ref={innerRingRef}
              cx="230"
              cy="170"
              r="102"
              stroke="#e8276b"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="18 14 4 14"
            />

            {/* Mode-Reactive Waveform Arcs (expand smoothly in Mobile Phone mode) */}
            <g data-mode-wave opacity="0.9">
              <path
                d="M78 170C120 120 175 120 230 170C285 220 340 220 382 170"
                stroke="#e8276b"
                strokeOpacity="0.28"
                strokeWidth="1.25"
              />
              <path
                d="M96 170C140 212 185 212 230 170C275 128 320 128 364 170"
                stroke="#121214"
                strokeOpacity="0.12"
                strokeWidth="1"
              />
            </g>

            {/* Mode-Reactive Optical Viewfinder Corner Brackets (lock tightly in QR mode) */}
            <g data-mode-bracket stroke="#121214" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="square">
              <path d="M126 94V72H148" />
              <path d="M312 72H334V94" />
              <path d="M334 246V268H312" />
              <path d="M148 268H126V246" />
            </g>

            {/* Central Sculpted Shilpi Ribbon (Draw-in Stroke + Translucent Fill + Pointer Depth) */}
            <g ref={ribbonGroupRef}>
              <path
                data-ribbon-fill
                d="M171 84C152 121 168 152 214 168L265 186C300 198 310 225 289 258C318 228 318 185 274 166L220 144C185 130 174 106 171 84Z"
                fill="url(#sculptRibbonGrad)"
              />
              <path
                data-ribbon-stroke
                d="M171 84C152 121 168 152 214 168L265 186C300 198 310 225 289 258C318 228 318 185 274 166L220 144C185 130 174 106 171 84Z"
                stroke="#121214"
                strokeOpacity="0.22"
                strokeWidth="1"
                strokeDasharray="560"
                strokeDashoffset="0"
              />
            </g>

            {/* Opposing Precision Triangles (Counter-parallax depth layer) */}
            <g ref={wedgeGroupRef}>
              <path
                data-wedge-float
                d="M276 112L322 86V138L276 112Z"
                fill="#e8276b"
              />
              <path
                data-wedge-float
                d="M184 228L138 254V202L184 228Z"
                fill="#ff5b7f"
              />
              <circle cx="322" cy="86" r="3" fill="#121214" />
              <circle cx="138" cy="254" r="3" fill="#121214" />
            </g>
          </svg>
        </div>

        {/* Bottom Editorial Statement (Zero Kicker / Zero Clutter Cards) */}
        <div className="relative z-10 mt-6 lg:mt-0 lg:pb-4 max-w-[34rem]">
          <h1
            data-clip-reveal
            className="font-display text-3xl sm:text-4xl xl:text-[2.95rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#121214]"
          >
            Your studio desk, synced in seconds.
          </h1>
          <p
            data-clip-reveal
            className="mt-3.5 text-sm sm:text-[15px] leading-relaxed text-[#52525b] max-w-[44ch]"
          >
            Pair directly from your Shilpi mobile app or verify your registered studio phone to manage bookings, dues, and WhatsApp bills.
          </p>
        </div>
      </section>

      {/* ============================================================= */}
      {/* RIGHT WORKSPACE: MINIMAL SIGN-IN STAGE (QR PAIR / PHONE OTP)  */}
      {/* ============================================================= */}
      <main className="bg-white lg:bg-white/95 border-t lg:border-t-0 border-black/[0.07] flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[390px]">
          {/* Heading directly leads without any eyebrow/kicker label */}
          <div data-auth-entrance>
            <h2 className="font-display text-[1.65rem] font-bold tracking-[-0.025em] text-[#121214]">
              {activeTab === 'qr'
                ? 'Pair this terminal'
                : otpSent
                ? 'Verify your number'
                : 'Sign in with phone'}
            </h2>
            <p className="mt-1.5 text-sm text-[#52525b] leading-relaxed">
              {activeTab === 'qr'
                ? 'Scan once from Shilpi Mobile to open your live studio workspace.'
                : otpSent
                ? `Enter the 6-digit code sent to +91 ${cleanDisplayPhone}.`
                : 'Use your registered artist number to receive a one-time code.'}
            </p>
          </div>

          {/* Bespoke GSAP Sliding Segmented Switcher */}
          <div
            ref={tabListRef}
            data-auth-entrance
            role="tablist"
            aria-label="Sign in method"
            className="mt-7 relative grid grid-cols-2 p-1 rounded-2xl bg-[#f3eff2] border border-black/[0.06]"
          >
            {/* GSAP-animated sliding active pill */}
            <div
              ref={tabIndicatorRef}
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-1 rounded-xl bg-white shadow-[0_2px_10px_rgba(18,18,20,0.08)] border border-black/[0.05] pointer-events-none"
              style={{ width: 'calc(50% - 4px)' }}
            />

            <button
              ref={qrTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === 'qr'}
              onClick={() => setActiveTab('qr')}
              className={`relative z-10 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'qr' ? 'text-[#121214]' : 'text-[#52525b] hover:text-[#121214]'
              }`}
            >
              <QrCode className={`w-3.5 h-3.5 ${activeTab === 'qr' ? 'text-[#e8276b]' : ''}`} />
              <span>QR Pair</span>
            </button>

            <button
              ref={phoneTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === 'phone'}
              onClick={() => setActiveTab('phone')}
              className={`relative z-10 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'phone' ? 'text-[#121214]' : 'text-[#52525b] hover:text-[#121214]'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'phone' ? 'text-[#e8276b]' : ''}`} />
              <span>Mobile Phone</span>
            </button>
          </div>

          {/* Choreographed Panel Content */}
          <div ref={panelContentRef} className="mt-7">
            {/* ===================================================== */}
            {/* OPTION A: QR SCAN PAIRING                             */}
            {/* ===================================================== */}
            {activeTab === 'qr' && (
              <div role="tabpanel" aria-label="QR Pair" className="space-y-6">
                {/* Optical Quiet Zone Frame */}
                <div data-panel-item className="flex flex-col items-center">
                  <div className="relative p-5 rounded-2xl bg-white border border-black/[0.08] shadow-[0_18px_40px_-18px_rgba(18,18,20,0.14)]">
                    {/* Animated optical corner brackets */}
                    <div
                      ref={qrBracketsRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-2"
                    >
                      <svg
                        viewBox="0 0 240 240"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full"
                      >
                        <path d="M2 22V2H22" stroke="#e8276b" strokeWidth="2" strokeLinecap="square" />
                        <path d="M218 2H238V22" stroke="#e8276b" strokeWidth="2" strokeLinecap="square" />
                        <path d="M238 218V238H218" stroke="#e8276b" strokeWidth="2" strokeLinecap="square" />
                        <path d="M22 238H2V218" stroke="#e8276b" strokeWidth="2" strokeLinecap="square" />
                      </svg>
                    </div>

                    {/* QR Canvas / Gateway Waiting State */}
                    <div className="relative w-[184px] h-[184px] flex items-center justify-center overflow-hidden rounded-lg bg-white">
                      {qrDataUrl ? (
                        <>
                          <img
                            src={qrDataUrl}
                            alt="Shilpi Studio Terminal Pairing QR Code"
                            className="w-[184px] h-[184px] object-contain"
                          />
                          {/* Optical GSAP Laser Hairline */}
                          <div
                            ref={scanBeamRef}
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-1 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#e8276b] to-transparent shadow-[0_0_8px_rgba(232,39,107,0.55)]"
                          />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center px-4 gap-2.5">
                          <ScanLine className="w-7 h-7 text-[#e8276b] animate-pulse" />
                          <span className="text-xs font-medium text-[#52525b] leading-snug">
                            {pairingStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtle Status & Refresh Row */}
                  <div className="w-full max-w-[230px] mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[#52525b] font-medium">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          qrDataUrl ? 'bg-emerald-500' : 'bg-[#e8276b] animate-pulse'
                        }`}
                      />
                      {qrDataUrl ? 'Ready to scan' : 'Generating'}
                    </span>

                    <button
                      type="button"
                      onClick={handleRefreshWithSpin}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#121214] hover:text-[#e8276b] transition-colors"
                    >
                      <RotateCw ref={refreshIconRef} className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Clean 3-Line Scannable Guide (No Cluttered Gray Box) */}
                <div
                  data-panel-item
                  className="pt-5 border-t border-black/[0.07] space-y-2.5 text-[13px] text-[#52525b]"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-3.5 h-3.5 text-[#e8276b] shrink-0" />
                    <span>Open the Shilpi app on your phone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScanLine className="w-3.5 h-3.5 text-[#e8276b] shrink-0" />
                    <span>
                      Open the menu and tap <strong className="font-semibold text-[#121214]">Link Web Terminal</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-3.5 h-3.5 text-[#e8276b] shrink-0" />
                    <span>Point your camera at the frame above</span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* OPTION B: MOBILE PHONE + SEGMENTED OTP                */}
            {/* ===================================================== */}
            {activeTab === 'phone' && (
              <div role="tabpanel" aria-label="Mobile Phone">
                {!otpSent ? (
                  <form onSubmit={onSendOtp} className="space-y-5">
                    <div data-panel-item>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="shilpi-phone-input"
                          className="text-xs font-semibold text-[#121214]"
                        >
                          Mobile Number
                        </label>
                        <button
                          type="button"
                          onClick={handleDemoFillPulse}
                          className="text-xs font-semibold text-[#a50f45] hover:text-[#e8276b] transition-colors"
                        >
                          Use demo account
                        </button>
                      </div>

                      <div
                        ref={phoneBoxRef}
                        className="h-12 rounded-xl bg-[#faf8f9] focus-within:bg-white border border-black/[0.12] focus-within:border-[#e8276b] focus-within:ring-4 focus-within:ring-[#e8276b]/10 flex items-center transition-colors"
                      >
                        <span className="px-3.5 h-full flex items-center font-mono text-xs font-semibold text-[#52525b] border-r border-black/[0.08] tabular-nums select-none">
                          +91
                        </span>
                        <input
                          id="shilpi-phone-input"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="flex-1 h-full bg-transparent px-3.5 font-mono text-sm font-semibold text-[#121214] placeholder-[#71717a] focus:outline-none tabular-nums"
                        />
                      </div>

                      {demoNotice && (
                        <p className="mt-2.5 text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{demoNotice}</span>
                        </p>
                      )}
                    </div>

                    {errorMessage && (
                      <div
                        data-panel-item
                        role="alert"
                        className="px-3.5 py-2.5 rounded-xl bg-[#ffeef4] border border-[#e8276b]/25 text-xs font-medium text-[#a50f45]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div data-panel-item>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group w-full h-12 rounded-xl bg-[#121214] hover:bg-[#e8276b] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                      >
                        <span>{loading ? 'Sending code...' : 'Continue with OTP'}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={onVerifyOtp} className="space-y-5">
                    <div data-panel-item>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[#121214]">
                          6-digit verification code
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-xs font-semibold text-[#a50f45] hover:text-[#e8276b] transition-colors"
                        >
                          Change number
                        </button>
                      </div>

                      {/* Segmented 6-Digit OTP Input */}
                      <div className="grid grid-cols-6 gap-2" role="group" aria-label="One-time verification code">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            maxLength={6}
                            aria-label={`Verification digit ${index + 1} of 6`}
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            className="h-12 w-full rounded-xl bg-[#faf8f9] focus:bg-white border border-black/[0.12] focus:border-[#e8276b] focus:ring-4 focus:ring-[#e8276b]/10 text-center font-mono text-lg font-bold text-[#121214] focus:outline-none transition-all tabular-nums"
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#52525b]">
                        <span>
                          Demo code: <strong className="font-mono text-[#121214]">528143</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtp('528143')}
                          className="font-semibold text-[#a50f45] hover:text-[#e8276b] transition-colors"
                        >
                          Fill demo code
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <div
                        data-panel-item
                        role="alert"
                        className="px-3.5 py-2.5 rounded-xl bg-[#ffeef4] border border-[#e8276b]/25 text-xs font-medium text-[#a50f45]"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div data-panel-item>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group w-full h-12 rounded-xl bg-[#e8276b] hover:bg-[#c71957] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-[0_10px_24px_-10px_rgba(232,39,107,0.55)] active:scale-[0.99]"
                      >
                        <span>{loading ? 'Verifying...' : 'Verify & Open Studio'}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Discreet Atelier Footer Line */}
          <footer
            data-auth-entrance
            className="mt-10 pt-5 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#52525b]"
          >
            <span>End-to-end synced session</span>
            <span className="font-mono text-[11px] text-[#71717a]">v1.0 Web</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
