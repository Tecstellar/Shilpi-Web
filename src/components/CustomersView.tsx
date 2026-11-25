import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  MessageCircle,
  MoreVertical,
  SquarePen,
  Phone,
  Search,
  Star,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';

export interface StudioClient {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  isVip?: boolean;
  isActive?: boolean;
  bookingsCount?: number;
}

interface CustomersViewProps {
  clients: StudioClient[];
  bookings: StudioBooking[];
  businessName: string;
  syncing?: boolean;
  onAddClient: (payload: {
    name: string;
    phone: string;
    notes: string;
  }) => Promise<{ success: boolean; client?: StudioClient; error?: string }>;
  onUpdateClient?: (
    clientId: string,
    payload: { name: string; phone: string; notes: string }
  ) => Promise<{ success: boolean; client?: StudioClient; error?: string }>;
  onToggleActive?: (clientId: string, nextActive: boolean) => Promise<void>;
  onToggleVip?: (clientId: string, nextVip: boolean) => Promise<void>;
  onCreateBookingForClient: (client: { name: string; phone: string }) => void;
}

function normalizePhoneKey(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(-10);
  return digits;
}

const fmtINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const CustomersView: React.FC<CustomersViewProps> = ({
  clients,
  bookings,
  businessName,
  syncing = false,
  onAddClient,
  onUpdateClient,
  onToggleActive,
  onToggleVip,
  onCreateBookingForClient,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'booked' | 'inactive'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [openMenuClientId, setOpenMenuClientId] = useState<string | null>(null);

  // Add / Edit Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+91 ');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Enrich each client with real booking history, total sales & balance due
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const cPhoneKey = normalizePhoneKey(c.phone);
      const cNameNorm = c.name.trim().toLowerCase();

      const clientBookings = bookings.filter((b) => {
        if (b.clientId && b.clientId === c.id) return true;
        const bPhoneKey = normalizePhoneKey(b.clientPhone);
        if (cPhoneKey && bPhoneKey && cPhoneKey === bPhoneKey) return true;
        return b.client.trim().toLowerCase() === cNameNorm;
      });

      const totalSales = clientBookings.reduce((sum, b) => sum + (b.total || 0), 0);
      const totalBalance = clientBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
      const count = Math.max(clientBookings.length, c.bookingsCount || 0);

      return {
        ...c,
        clientBookings,
        count,
        totalSales,
        totalBalance,
      };
    });
  }, [clients, bookings]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedClients.filter((c) => {
      if (filter === 'inactive') {
        if (c.isActive !== false) return false;
      } else if (c.isActive === false) {
        return false;
      }
      if (filter === 'vip' && !c.isVip) return false;
      if (filter === 'booked' && c.count === 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    });
  }, [enrichedClients, search, filter]);

  const selectedClient = useMemo(
    () => enrichedClients.find((c) => c.id === selectedClientId) || null,
    [enrichedClients, selectedClientId]
  );

  const openAddContactModal = () => {
    setEditingClientId(null);
    setFormName('');
    setFormPhone('+91 ');
    setFormNotes('');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditContactModal = (client: StudioClient) => {
    setOpenMenuClientId(null);
    setEditingClientId(client.id);
    setFormName(client.name);
    setFormPhone(client.phone || '+91 ');
    setFormNotes(client.notes || '');
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveContact = async (alsoCreateBooking: boolean) => {
    const trimmedName = formName.trim();
    const digits = formPhone.replace(/\D/g, '');
    if (!trimmedName) {
      setFormError('Please enter customer name.');
      return;
    }
    if (digits.length < 10) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingClientId) {
        if (!onUpdateClient) {
          setFormError('Update handler is not configured.');
          return;
        }
        const result = await onUpdateClient(editingClientId, {
          name: trimmedName,
          phone: formPhone.trim(),
          notes: formNotes.trim(),
        });
        if (!result.success) {
          setFormError(result.error || 'Could not update contact.');
          return;
        }
        setShowAddModal(false);
        setEditingClientId(null);
        return;
      }

      const result = await onAddClient({
        name: trimmedName,
        phone: formPhone.trim(),
        notes: formNotes.trim(),
      });

      if (!result.success) {
        setFormError(result.error || 'Could not save contact.');
        return;
      }

      setShowAddModal(false);
      const savedName = result.client?.name || trimmedName;
      const savedPhone = result.client?.phone || formPhone.trim();

      if (alsoCreateBooking) {
        onCreateBookingForClient({ name: savedName, phone: savedPhone });
      } else if (result.client?.id) {
        setSelectedClientId(result.client.id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar: Search, Filter Pills & Add Contact Icon */}
      <section className="bg-white rounded-2xl border border-black/[0.07] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#121214]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, phone, or notes..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#faf8f9] border border-black/[0.08] text-sm text-[#121214] placeholder:text-[#121214]/40 focus:outline-none focus:border-[#e8276b]"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#faf8f9] p-1 rounded-xl border border-black/[0.06]">
            {(
              [
                {
                  id: 'all',
                  label: `All (${enrichedClients.filter((c) => c.isActive !== false).length})`,
                },
                { id: 'vip', label: 'VIP' },
                { id: 'booked', label: 'With Bookings' },
                {
                  id: 'inactive',
                  label: `Inactive (${enrichedClients.filter((c) => c.isActive === false).length})`,
                },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#121214] text-white'
                      : 'text-[#52525b] hover:text-[#121214]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          {/* Add Customer Button */}
          <button
            type="button"
            onClick={openAddContactModal}
            aria-label="Add customer"
            title="Add customer"
            className="h-10 px-4 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white flex items-center gap-2 text-xs font-bold transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </section>

      {/* 5-Box Customer Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
          <p className="text-sm font-semibold text-[#121214]">No matching customers found</p>
          <p className="text-xs text-[#52525b] mt-1 mb-4">
            Add a customer to your synced studio directory.
          </p>
          <button
            type="button"
            onClick={openAddContactModal}
            className="px-4 py-2 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold transition-colors"
          >
            + Add Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {filteredClients.map((client) => {
            const initial = (client.name.trim().charAt(0) || 'C').toUpperCase();
            const isInactive = client.isActive === false;
            const isMenuOpen = openMenuClientId === client.id;
            return (
              <div key={client.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`group w-full h-full bg-white rounded-2xl border border-black/[0.07] hover:border-[#e8276b]/55 hover:shadow-md p-4 text-left transition-all flex flex-col justify-between min-h-[148px] ${
                    isInactive ? 'opacity-65 bg-[#faf8f9]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 pr-7">
                      <div className="w-9 h-9 rounded-full bg-[#ffeef4] text-[#e8276b] group-hover:bg-[#e8276b] group-hover:text-white transition-colors flex items-center justify-center text-sm font-bold shrink-0">
                        {initial}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {isInactive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/[0.06] text-[#52525b] text-[10px] font-bold">
                            Inactive
                          </span>
                        ) : null}
                        {client.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffeef4] text-[#e8276b] text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-[#e8276b]" />
                            VIP
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="font-semibold text-sm text-[#121214] truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-[#52525b] mt-0.5 truncate tabular-nums">
                      {client.phone}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-black/[0.05] flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-medium text-[#52525b]">
                      {client.count} {client.count === 1 ? 'booking' : 'bookings'}
                    </span>
                    <span className="font-bold text-[#121214] tabular-nums">
                      {fmtINR(client.totalSales)}
                    </span>
                  </div>
                </button>

                {/* Three-dot vertical menu */}
                <button
                  type="button"
                  aria-label={`More actions for ${client.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuClientId(isMenuOpen ? null : client.id);
                  }}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg hover:bg-black/[0.06] flex items-center justify-center text-[#52525b] hover:text-[#121214] transition-colors z-10"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuClientId(null);
                      }}
                    />
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-3 top-11 z-30 w-40 rounded-xl bg-white border border-black/[0.08] shadow-xl py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => openEditContactModal(client)}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-[#121214] hover:bg-[#faf8f9] flex items-center gap-2 transition-colors"
                      >
                        <SquarePen className="w-3.5 h-3.5 text-[#52525b]" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setOpenMenuClientId(null);
                          if (onToggleActive) {
                            await onToggleActive(client.id, isInactive);
                          }
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 transition-colors ${
                          isInactive
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-[#e8276b] hover:bg-[#ffeef4]'
                        }`}
                      >
                        {isInactive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Set Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Set Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-black/10 overflow-hidden max-h-[88vh] flex flex-col">
            {/* Dark Hero Header */}
            <div className="bg-[#121214] text-white p-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#e8276b] text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {(selectedClient.name.trim().charAt(0) || 'C').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">{selectedClient.name}</h3>
                  <p className="text-xs text-white/70 tabular-nums mt-0.5">
                    {selectedClient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onToggleVip && (
                  <button
                    type="button"
                    onClick={() => onToggleVip(selectedClient.id, !selectedClient.isVip)}
                    className={`px-2.5 h-8 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      selectedClient.isVip
                        ? 'bg-[#e8276b] text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${selectedClient.isVip ? 'fill-white' : ''}`}
                    />
                    <span>VIP</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedClientId(null)}
                  aria-label="Close customer details"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Quick Contact Actions */}
              <div className="flex items-center gap-2.5">
                <a
                  href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedClient.name}, greetings from ${businessName}!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-9 rounded-xl bg-[#faf8f9] border border-black/[0.08] hover:border-[#e8276b]/50 text-xs font-semibold text-[#121214] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#e8276b]" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${selectedClient.phone.replace(/\s+/g, '')}`}
                  className="flex-1 h-9 rounded-xl bg-[#faf8f9] border border-black/[0.08] hover:border-[#e8276b]/50 text-xs font-semibold text-[#121214] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#121214]" />
                  <span>Call</span>
                </a>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#faf8f9] border border-black/[0.05]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52525b] block">
                    Bookings
                  </span>
                  <span className="text-base font-bold text-[#121214] tabular-nums">
                    {selectedClient.count}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#faf8f9] border border-black/[0.05]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52525b] block">
                    Total Sales
                  </span>
                  <span className="text-base font-bold text-[#121214] tabular-nums">
                    {fmtINR(selectedClient.totalSales)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#ffeef4]/60 border border-[#e8276b]/15">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#a50f45] block">
                    Balance Due
                  </span>
                  <span className="text-base font-bold text-[#e8276b] tabular-nums">
                    {fmtINR(selectedClient.totalBalance)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedClient.notes ? (
                <div className="p-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.06]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#52525b] block mb-1">
                    Notes
                  </span>
                  <p className="text-xs text-[#121214] leading-relaxed">
                    {selectedClient.notes}
                  </p>
                </div>
              ) : null}

              {/* Booking History */}
              <div>
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#52525b] mb-2">
                  Booking History ({selectedClient.clientBookings.length})
                </h4>
                {selectedClient.clientBookings.length === 0 ? (
                  <p className="text-xs text-[#52525b] py-4 text-center bg-[#faf8f9] rounded-xl border border-black/[0.05]">
                    No bookings recorded for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedClient.clientBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-[#faf8f9] border border-black/[0.06] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                b.status === 'Upcoming' ? 'bg-[#e8276b]' : 'bg-emerald-500'
                              }`}
                            />
                            <p className="text-xs font-bold text-[#121214] truncate">
                              {b.items.map((i) => i.name).join(' + ') || 'Studio Booking'}
                            </p>
                          </div>
                          <p className="text-[11px] text-[#52525b] mt-0.5 pl-4">
                            {b.day} {b.month} {b.year} · {b.time} {b.meridiem} · {b.venue}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#121214] tabular-nums">
                            {fmtINR(b.total)}
                          </p>
                          <p className="text-[10px] text-[#52525b]">
                            {b.balanceDue > 0 ? `Due ${fmtINR(b.balanceDue)}` : 'Paid'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/[0.07] bg-[#faf8f9] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedClientId(null)}
                className="px-4 h-10 rounded-xl border border-black/[0.1] bg-white text-xs font-semibold text-[#121214]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = { name: selectedClient.name, phone: selectedClient.phone };
                  setSelectedClientId(null);
                  onCreateBookingForClient(target);
                }}
                className="px-4 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Create Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10">
            <div className="flex justify-between items-center pb-4 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-bold text-[#121214]">
                  {editingClientId ? 'Edit Contact' : 'Add Contact'}
                </h3>
                <p className="text-xs text-[#52525b]">
                  {editingClientId
                    ? 'Update customer details in your studio directory'
                    : 'Save a customer to your synced studio directory'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingClientId(null);
                }}
                aria-label="Close contact modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Name <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Meera Krishnan"
                  className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Phone <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] tabular-nums focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Skin tone, saree drape preference, or event notes..."
                  className="w-full p-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b] resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {editingClientId ? (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingClientId(null);
                      }}
                      className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white hover:bg-[#faf8f9] text-xs font-semibold text-[#121214] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSaveContact(false)}
                      className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSaveContact(false)}
                      className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white hover:bg-[#faf8f9] text-xs font-semibold text-[#121214] transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSaveContact(true)}
                      className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save & Create Booking'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
