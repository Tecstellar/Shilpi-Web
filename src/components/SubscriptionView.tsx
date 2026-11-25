import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Crown,
  IndianRupee,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface SubscriptionViewProps {
  studioName?: string;
  isPremium?: boolean;
}

interface PlanOption {
  months: number;
  perMonth: number;
  badge: string;
  cadence: string;
}

const PLANS: PlanOption[] = [
  { months: 3, perMonth: 499, badge: 'Standard', cadence: 'billed quarterly' },
  { months: 6, perMonth: 449, badge: 'Save 10%', cadence: 'billed half-yearly' },
  { months: 12, perMonth: 399, badge: 'Best value', cadence: 'billed yearly' },
];

const FEATURES = [
  {
    title: 'Unlimited bookings & clients',
    body: 'No caps on orders, clients or packages.',
  },
  {
    title: 'WhatsApp confirmations & reminders',
    body: 'Send order, closing and payment messages in one tap.',
  },
  {
    title: 'Payments & balance tracking',
    body: 'Know exactly who owes what, every month.',
  },
  {
    title: 'My Gallery with Instagram links',
    body: 'Build a portfolio from your finished looks.',
  },
  {
    title: 'Expenses & profit reports',
    body: 'Monthly and annual sales, expenses and real profit.',
  },
  {
    title: 'Priority support',
    body: 'Reach us on WhatsApp — replies within a day.',
  },
];

const MONTH_SHORT_ARR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function fmtINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function computeRenewalDate(months: number): string {
  const dt = new Date();
  dt.setMonth(dt.getMonth() + months);
  const day = String(dt.getDate()).padStart(2, '0');
  const mon = MONTH_SHORT_ARR[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day} ${mon} ${year}`;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  studioName = 'Shilpi Studio',
  isPremium = false,
}) => {
  const [selectedPlanMonths, setSelectedPlanMonths] = useState<number>(12);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const currentPlan = PLANS.find((p) => p.months === selectedPlanMonths) || PLANS[2];
  const planTotal = currentPlan.perMonth * currentPlan.months;
  const gst = Math.round(planTotal - planTotal / 1.18);
  const saveAmount = 499 * currentPlan.months - planTotal;
  const renewsOn = useMemo(() => computeRenewalDate(currentPlan.months), [currentPlan.months]);

  return (
    <div className="space-y-5">
      {/* 1. Obsidian Shilpi Premium Hero Card */}
      <section className="bg-[#121214] text-white rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8276b]/20 text-[#ff8cb4] text-[10px] font-extrabold tracking-[0.12em] uppercase">
            <Crown className="w-3.5 h-3.5" />
            Shilpi Premium {isPremium ? '· Active' : ''}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {fmtINR(currentPlan.perMonth)}
            </p>
            <span className="text-sm font-semibold text-white/65">/ month</span>
          </div>
          <p className="text-xs text-white/70 max-w-xl">
            All prices include 18% GST. Pick a billing term — longer terms cost less per month.
          </p>
        </div>

        <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 min-w-[220px]">
          <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/60">
            Selected Term
          </span>
          <p className="font-display text-xl font-extrabold text-white mt-1 tabular-nums">
            {currentPlan.months} Months · {fmtINR(planTotal)}
          </p>
          <p className="text-[11px] text-[#ff8cb4] font-semibold mt-0.5">
            {saveAmount > 0 ? `Save ${fmtINR(saveAmount)} vs monthly` : 'Standard quarterly plan'}
          </p>
        </div>
      </section>

      {/* 2. Billing Term Radio Cards + Order Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Billing Term + Features */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-extrabold tracking-[0.11em] uppercase text-[#52525b]">
              Billing Term
            </h3>

            <div className="space-y-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanMonths === plan.months;
                const total = plan.perMonth * plan.months;
                return (
                  <button
                    key={plan.months}
                    type="button"
                    onClick={() => setSelectedPlanMonths(plan.months)}
                    className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#121214] text-white border-[#121214] shadow-lg'
                        : 'bg-white text-[#121214] border-black/[0.08] hover:border-[#e8276b]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#e8276b]' : 'border-black/25'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#e8276b]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-base font-extrabold">
                            {plan.months} months
                          </span>
                          <span
                            className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#e8276b] text-white'
                                : 'bg-[#ffeef4] text-[#a50f45]'
                            }`}
                          >
                            {plan.badge}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 tabular-nums ${
                            isSelected ? 'text-white/70' : 'text-[#52525b]'
                          }`}
                        >
                          {fmtINR(plan.perMonth)} / month · incl. GST
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display text-lg font-extrabold tabular-nums">
                        {fmtINR(total)}
                      </p>
                      <p
                        className={`text-[11px] ${
                          isSelected ? 'text-white/65' : 'text-[#52525b]'
                        }`}
                      >
                        {plan.cadence}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* What You Get Checklist */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-extrabold tracking-[0.11em] uppercase text-[#52525b]">
              What You Get
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-white rounded-2xl border border-black/[0.08] p-4 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#e8276b] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#121214]">{feat.title}</p>
                    <p className="text-[11px] text-[#52525b] mt-0.5 leading-relaxed">
                      {feat.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary & Checkout Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-black/[0.08] p-5 sm:p-6 space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#52525b]">
                  Order Summary
                </span>
                <h4 className="font-display text-lg font-extrabold text-[#121214] mt-0.5">
                  {studioName}
                </h4>
              </div>
              <Sparkles className="w-5 h-5 text-[#e8276b]" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#52525b] font-medium">
                  Shilpi Premium ({currentPlan.months} months)
                </span>
                <span className="font-extrabold text-[#121214] tabular-nums">
                  {fmtINR(planTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#52525b]">GST (18%) included</span>
                <span className="text-[#52525b] tabular-nums">{fmtINR(gst)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700">You save</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {saveAmount > 0 ? `${fmtINR(saveAmount)} vs monthly` : '—'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#ffeef4] border border-[#e8276b]/20 p-3.5 text-xs text-[#a50f45]">
              Renews on <span className="font-bold">{renewsOn}</span>. Cancel anytime — your data
              stays yours.
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSubmitted(false);
                setCheckoutOpen(true);
              }}
              className="w-full h-12 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-extrabold tracking-[0.08em] uppercase transition-colors flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              Pay {fmtINR(planTotal)} · {currentPlan.months} Months
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#52525b] text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#121214] shrink-0" />
              <span>UPI, card, net banking · GSTIN invoice emailed after payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. UPI / Checkout Modal */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sub-checkout-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 id="sub-checkout-title" className="font-display text-lg font-bold text-[#121214]">
                  Complete Subscription Payment
                </h3>
                <p className="text-xs text-[#52525b]">
                  {currentPlan.months} months · {fmtINR(planTotal)} (incl. 18% GST)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                aria-label="Close payment modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentSubmitted ? (
              <div className="py-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="font-display text-base font-bold text-[#121214]">
                  Payment Request Logged
                </p>
                <p className="text-xs text-[#52525b] leading-relaxed">
                  Complete your {fmtINR(planTotal)} UPI transfer to activate Shilpi Premium for{' '}
                  {studioName}. Your GST invoice will be emailed automatically.
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="w-full h-10 rounded-xl bg-[#121214] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#faf8f9] border border-black/[0.08] p-4 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#121214] text-white flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#121214]">Pay via UPI</p>
                    <p className="text-[11px] text-[#52525b] truncate">
                      UPI ID: <span className="font-semibold text-[#121214]">shilpi@icici</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSubmitted(true)}
                    className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors"
                  >
                    Confirm {fmtINR(planTotal)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
