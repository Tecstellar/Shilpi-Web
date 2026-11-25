import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';

interface BookingDetailModalProps {
  booking: StudioBooking | null;
  onClose: () => void;
  businessName: string;
  onUpdateStatus?: (
    bookingId: string,
    status: 'Upcoming' | 'Completed' | 'Closed'
  ) => Promise<void> | void;
  onRecordPayment?: (
    bookingId: string,
    amountRupees: number,
    paymentMode?: string
  ) => Promise<void> | void;
}

const fmtINR = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  businessName,
  onUpdateStatus,
  onRecordPayment,
}) => {
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const total = booking.total || 0;
  const advance = booking.advance || 0;
  const balance = Math.max(0, booking.balanceDue ?? (total - advance));
  const isFinished = booking.status === 'Completed' || booking.status === 'Closed';

  const handleStatusChange = async (newStatus: 'Upcoming' | 'Completed' | 'Closed') => {
    if (!onUpdateStatus) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(booking.id, newStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRecordPayment) return;
    const amt = parseFloat(payAmount) || balance;
    if (amt <= 0) return;
    setIsSubmitting(true);
    try {
      await onRecordPayment(booking.id, amt, payMode);
      setShowPayModal(false);
      setPayAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
  const waReceiptText = encodeURIComponent(
    `Hi ${booking.client}, here is your booking details with ${businessName}:\n\n` +
      `Ref: ${booking.ref}\n` +
      `Date: ${booking.day} ${booking.month} ${booking.year} at ${booking.time} ${booking.meridiem}\n` +
      `Venue: ${booking.venue}\n` +
      `Total: ${fmtINR(total)}\n` +
      `Advance Paid: ${fmtINR(advance)}\n` +
      `Balance Due: ${balance > 0 ? fmtINR(balance) : 'Paid in Full'}\n\n` +
      `Thank you for choosing ${businessName}!`
  );

  const mapsQuery = encodeURIComponent(`${booking.venue}`);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-black/10 my-auto text-[#121214]"
      >
        {/* ===================================================================
            1. Black Ink Booking Pass Card Header (Matching Mobile App)
            =================================================================== */}
        <div className="bg-[#121214] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-8">
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/60 block">
              {booking.ref}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5 truncate">
              {booking.client}
            </h2>

            <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#e8276b]" />
                <span className="font-semibold text-white">
                  {booking.day} {booking.month} {booking.year}
                </span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#e8276b]" />
                <span>
                  {booking.time} {booking.meridiem}
                </span>
              </span>
            </div>

            {/* Status Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1.5 ${
                  booking.status === 'Closed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : booking.status === 'Completed'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-[#ffeef4] text-[#a50f45] border border-[#e8276b]/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{booking.status}</span>
              </span>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  balance > 0 ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                }`}
              >
                {balance > 0 ? `${fmtINR(balance)} Due` : 'Paid in Full'}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            2. Content Body: Client Contact, Venue, Packages & Ledger
            =================================================================== */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Contact & Location Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contact Card */}
            <div className="p-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#64748b] text-[10px] uppercase">Client Phone</span>
                {cleanPhone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${waReceiptText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#25D366] hover:opacity-80 p-1"
                      title="WhatsApp Chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-[#121214] hover:opacity-80 p-1"
                      title="Call Client"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#121214] tabular-nums">
                {booking.clientPhone || 'No phone number'}
              </p>
            </div>

            {/* Venue Card */}
            <div className="p-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#64748b] text-[10px] uppercase">Event Location</span>
                {booking.venue && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#e8276b] text-[10px] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#121214] flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#e8276b] shrink-0" />
                <span className="truncate">{booking.venue || 'Studio'}</span>
              </p>
            </div>
          </div>

          {/* Packages & Financial Breakdown Table */}
          <div className="rounded-xl border border-black/[0.08] overflow-hidden">
            <div className="bg-[#faf8f9] px-4 py-2.5 border-b border-black/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#64748b]">
                PACKAGES &amp; PAYMENT BREAKDOWN
              </span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  balance > 0 ? 'text-[#a50f45]' : 'text-emerald-700'
                }`}
              >
                {balance > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}
              </span>
            </div>

            <div className="divide-y divide-black/[0.05] p-1">
              {/* Service Items */}
              {booking.items && booking.items.length > 0 ? (
                booking.items.map((it, idx) => (
                  <div key={idx} className="px-3.5 py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#121214]">{it.name}</span>
                    <span className="font-bold text-[#121214] tabular-nums">
                      {fmtINR(it.price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-3.5 py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#121214]">Bridal Service</span>
                  <span className="font-bold text-[#121214] tabular-nums">{fmtINR(total)}</span>
                </div>
              )}

              {/* Travel charges if any */}
              {booking.travel > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#64748b]">Travel charges</span>
                  <span className="font-bold text-[#121214] tabular-nums">
                    {fmtINR(booking.travel)}
                  </span>
                </div>
              )}

              {/* Total Row */}
              <div className="px-3.5 py-2.5 bg-[#faf8f9]/60 flex items-center justify-between text-xs font-bold border-t border-black/[0.08]">
                <span className="text-[#121214]">Total Amount</span>
                <span className="text-sm font-extrabold text-[#121214] tabular-nums">
                  {fmtINR(total)}
                </span>
              </div>

              {/* Advance Paid */}
              <div className="px-3.5 py-2 flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Advance paid</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {fmtINR(advance)}
                </span>
              </div>

              {/* Balance Due */}
              <div className="px-3.5 py-2.5 bg-[#faf8f9]/60 flex items-center justify-between text-xs font-bold border-t border-black/[0.06]">
                <span className={balance > 0 ? 'text-[#a50f45]' : 'text-emerald-700'}>
                  Balance Due
                </span>
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    balance > 0 ? 'text-[#a50f45]' : 'text-emerald-700'
                  }`}
                >
                  {balance > 0 ? fmtINR(balance) : 'Paid in Full'}
                </span>
              </div>
            </div>
          </div>

          {/* Clear Due Input Sub-Section (If user clicked Record Payment) */}
          {showPayModal ? (
            <form
              onSubmit={handleClearDue}
              className="p-4 rounded-xl bg-[#ffeef4]/50 border border-[#e8276b]/30 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#a50f45] uppercase">
                  Record Due Payment
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="text-xs text-[#64748b] hover:text-[#121214]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={String(balance)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#e8276b]/30 text-xs font-bold text-[#121214] focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] mb-1">
                    Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#e8276b]/30 text-xs font-bold text-[#121214] focus:outline-none"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-[#e8276b] text-white text-xs font-bold hover:bg-[#a50f45] transition-colors"
              >
                {isSubmitting ? 'Recording...' : `Confirm Payment of ${fmtINR(parseFloat(payAmount) || balance)}`}
              </button>
            </form>
          ) : null}

          {/* Quick Actions Bar */}
          <div className="space-y-2 pt-2">
            {balance > 0 && !showPayModal && (
              <button
                type="button"
                onClick={() => {
                  setPayAmount(String(balance));
                  setShowPayModal(true);
                }}
                className="w-full h-11 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>Record Due Payment ({fmtINR(balance)})</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {/* WhatsApp Share Receipt */}
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${waReceiptText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-10 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Receipt</span>
                </a>
              )}

              {/* Status toggles */}
              {booking.status === 'Upcoming' && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleStatusChange('Completed')}
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Completed</span>
                </button>
              )}

              {booking.status !== 'Closed' && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleStatusChange('Closed')}
                  className="flex-1 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Close Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
