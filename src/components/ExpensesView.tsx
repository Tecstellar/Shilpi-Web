import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Car,
  Layers,
  MoreVertical,
  Package,
  Palette,
  SquarePen,
  Plus,
  Receipt,
  Scissors,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';

export type ExpenseCategoryKey =
  | 'cosmetics'
  | 'hair_products'
  | 'travel'
  | 'saree_materials'
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'marketing'
  | 'other';

export interface StudioExpense {
  id: string;
  title: string;
  category: ExpenseCategoryKey;
  categoryLabel: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
}

export interface StudioExpensePayload {
  title: string;
  category: ExpenseCategoryKey;
  amount: number;
  expenseDate: string;
  notes?: string;
}

interface ExpensesViewProps {
  expenses: StudioExpense[];
  syncing?: boolean;
  onAddExpense: (
    payload: StudioExpensePayload
  ) => Promise<{ success: boolean; error?: string }>;
  onUpdateExpense: (
    expenseId: string,
    payload: StudioExpensePayload
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteExpense: (expenseId: string) => Promise<{ success: boolean; error?: string }>;
}

const EXPENSE_CATEGORY_OPTIONS: Array<{ key: ExpenseCategoryKey; label: string }> = [
  { key: 'cosmetics', label: 'Makeup products' },
  { key: 'hair_products', label: 'Hair products' },
  { key: 'travel', label: 'Travel' },
  { key: 'saree_materials', label: 'Saree materials' },
  { key: 'salary', label: 'Staff' },
  { key: 'other', label: 'Other' },
];

const CATEGORY_META: Record<
  ExpenseCategoryKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    barColor: string;
  }
> = {
  cosmetics: {
    label: 'Makeup products',
    icon: Palette,
    badgeBg: 'bg-[#ffeef4]',
    badgeText: 'text-[#a50f45]',
    barColor: '#e8276b',
  },
  hair_products: {
    label: 'Hair products',
    icon: Scissors,
    badgeBg: 'bg-[#fdf2f8]',
    badgeText: 'text-[#9d174d]',
    barColor: '#be185d',
  },
  travel: {
    label: 'Travel',
    icon: Car,
    badgeBg: 'bg-[#f4f4f5]',
    badgeText: 'text-[#121214]',
    barColor: '#121214',
  },
  saree_materials: {
    label: 'Saree materials',
    icon: Layers,
    badgeBg: 'bg-[#fff7ed]',
    badgeText: 'text-[#9a3412]',
    barColor: '#ea580c',
  },
  salary: {
    label: 'Staff',
    icon: Users,
    badgeBg: 'bg-[#eff6ff]',
    badgeText: 'text-[#1d4ed8]',
    barColor: '#2563eb',
  },
  rent: {
    label: 'Studio Rent',
    icon: Package,
    badgeBg: 'bg-[#f4f4f5]',
    badgeText: 'text-[#121214]',
    barColor: '#52525b',
  },
  utilities: {
    label: 'Utilities',
    icon: Sparkles,
    badgeBg: 'bg-[#f4f4f5]',
    badgeText: 'text-[#121214]',
    barColor: '#52525b',
  },
  marketing: {
    label: 'Marketing',
    icon: TrendingUp,
    badgeBg: 'bg-[#ffeef4]',
    badgeText: 'text-[#a50f45]',
    barColor: '#e8276b',
  },
  other: {
    label: 'Other',
    icon: Package,
    badgeBg: 'bg-[#f4f4f5]',
    badgeText: 'text-[#52525b]',
    barColor: '#71717a',
  },
};

const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function toIsoDateLocal(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function fmtINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatDayMonth(isoDate: string): { dayMonth: string; year: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ''));
  if (!m) return { dayMonth: isoDate || '—', year: '' };
  const yr = m[1];
  const moIdx = Math.max(0, Math.min(11, Number(m[2]) - 1));
  const dy = Number(m[3]);
  return { dayMonth: `${dy} ${SHORT_MONTHS[moIdx]}`, year: yr };
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  syncing = false,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthLong = LONG_MONTHS[currentMonthIdx];
  const currentMonthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const todayIso = toIsoDateLocal(now);
  const yesterdayIso = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return toIsoDateLocal(d);
  }, [now.getFullYear(), now.getMonth(), now.getDate()]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExpenseCategoryKey>('all');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StudioExpense | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryKey>('cosmetics');
  const [amountText, setAmountText] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<StudioExpense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const monthExpenses = useMemo(
    () =>
      expenses.filter((e) => String(e.expenseDate || '').startsWith(currentMonthPrefix)),
    [expenses, currentMonthPrefix]
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [monthExpenses]
  );

  const allTimeSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const avgMonthExpense = useMemo(
    () => (monthExpenses.length > 0 ? Math.round(totalSpent / monthExpenses.length) : 0),
    [totalSpent, monthExpenses.length]
  );

  const categorySums = useMemo(() => {
    return EXPENSE_CATEGORY_OPTIONS.map((opt) => {
      const matching = monthExpenses.filter((e) => e.category === opt.key);
      const amount = matching.reduce((sum, e) => sum + (e.amount || 0), 0);
      return {
        key: opt.key,
        name: opt.label,
        amount,
        count: matching.length,
        sharePct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    }).filter(
      (c) =>
        c.amount > 0 ||
        ['cosmetics', 'hair_products', 'travel', 'saree_materials', 'salary', 'other'].includes(c.key)
    );
  }, [monthExpenses, totalSpent]);

  const maxCatAmount = Math.max(1, ...categorySums.map((c) => c.amount));
  const highestAmount = Math.max(0, ...categorySums.map((c) => c.amount));
  const topCategory = useMemo(
    () => categorySums.find((c) => c.amount > 0 && c.amount === highestAmount) || null,
    [categorySums, highestAmount]
  );

  const visibleExpenses = useMemo(
    () =>
      selectedCategory === 'all'
        ? expenses
        : expenses.filter((e) => e.category === selectedCategory),
    [expenses, selectedCategory]
  );

  useEffect(() => {
    if (!modalOpen && !deleteTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!saving) {
          setModalOpen(false);
          setEditingExpense(null);
        }
        if (!deleting) {
          setDeleteTarget(null);
          setDeleteError('');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, deleteTarget, saving, deleting]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('cosmetics');
    setAmountText('');
    setExpenseDate(todayIso);
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (exp: StudioExpense) => {
    setOpenMenuId(null);
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category || 'cosmetics');
    setAmountText(String(exp.amount || ''));
    setExpenseDate(String(exp.expenseDate || todayIso).slice(0, 10));
    setNotes(exp.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericAmount = parseFloat(amountText.replace(/,/g, '').trim());

    if (!trimmedTitle) {
      setFormError('Please enter what you spent on (e.g. Airbrush foundation).');
      return;
    }
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter an expense amount greater than ₹0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate.trim())) {
      setFormError('Please choose a valid date.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload: StudioExpensePayload = {
        title: trimmedTitle,
        category,
        amount: Math.round(numericAmount),
        expenseDate: expenseDate.trim(),
        notes: notes.trim() || undefined,
      };
      const res = editingExpense
        ? await onUpdateExpense(editingExpense.id, payload)
        : await onAddExpense(payload);

      if (!res.success) {
        setFormError(res.error || 'Could not save expense.');
        return;
      }
      setModalOpen(false);
      setEditingExpense(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await onDeleteExpense(deleteTarget.id);
      if (!res.success) {
        setDeleteError(res.error || 'Could not delete expense.');
        return;
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Atelier Spend Bento Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Primary Obsidian Spend Hero Card */}
        <div className="lg:col-span-6 bg-[#121214] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-[0.12em] uppercase text-white/80">
                <Wallet className="w-3 h-3 text-[#e8276b]" />
                {currentMonthLong} {currentYear} · Spend
              </div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums mt-2.5">
                {fmtINR(totalSpent)}
              </p>
              <p className="text-xs text-white/60 mt-1 tabular-nums">
                All-time studio spend: <span className="text-white/90 font-semibold">{fmtINR(allTimeSpent)}</span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="h-10 px-4 rounded-xl bg-[#e8276b] hover:bg-white hover:text-[#121214] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Log Expense
              </button>
            </div>
          </div>

          {/* Stacked Category Share Strip */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px] text-white/65">
              <span>Monthly Category Mix</span>
              <span className="tabular-nums font-semibold text-white/90">
                {monthExpenses.length} {monthExpenses.length === 1 ? 'receipt' : 'receipts'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden flex gap-0.5 p-0.5">
              {totalSpent === 0 ? (
                <div className="h-full w-full rounded-full bg-white/15" />
              ) : (
                categorySums
                  .filter((c) => c.amount > 0)
                  .map((c) => {
                    const meta = CATEGORY_META[c.key] || CATEGORY_META.other;
                    const widthPct = Math.max(4, Math.round((c.amount / totalSpent) * 100));
                    return (
                      <div
                        key={c.key}
                        style={{ width: `${widthPct}%`, backgroundColor: meta.barColor }}
                        title={`${c.name}: ${fmtINR(c.amount)} (${c.sharePct}%)`}
                        className="h-full rounded-full transition-all duration-300"
                      />
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Top Spend Category Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/[0.08] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#52525b]">
              Top Category
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ffeef4] text-[#e8276b] flex items-center justify-center">
              {(() => {
                const TopIcon = topCategory
                  ? (CATEGORY_META[topCategory.key] || CATEGORY_META.other).icon
                  : Sparkles;
                return <TopIcon className="w-4 h-4" />;
              })()}
            </div>
          </div>

          {topCategory ? (
            <div>
              <p className="font-display text-lg font-extrabold text-[#121214] truncate">
                {topCategory.name}
              </p>
              <p className="font-display text-2xl font-extrabold text-[#e8276b] tabular-nums mt-0.5">
                {fmtINR(topCategory.amount)}
              </p>
              <p className="text-[11px] font-semibold text-[#52525b] mt-1 tabular-nums">
                {topCategory.sharePct}% of {currentMonthLong} spend
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-base font-bold text-[#121214]">No spend yet</p>
              <p className="text-xs text-[#52525b] mt-1">
                Log your first {currentMonthLong} receipt to see category leaders.
              </p>
            </div>
          )}
        </div>

        {/* Average Ticket & Ledger Count Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/[0.08] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#52525b]">
              Avg Receipt · {currentMonthLong}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#f4f4f5] text-[#121214] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="font-display text-2xl font-extrabold text-[#121214] tabular-nums">
              {fmtINR(avgMonthExpense)}
            </p>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#52525b] mt-2 pt-2 border-t border-black/[0.06] tabular-nums">
              <span>This month: {monthExpenses.length}</span>
              <span>Total: {expenses.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Category Mini-Cards */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#52525b]">
            Category Cards · Click to Filter
          </h3>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-[#e8276b] hover:text-[#121214] transition-colors"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {categorySums.map((cat) => {
            const meta = CATEGORY_META[cat.key] || CATEGORY_META.other;
            const CatIcon = meta.icon;
            const pct =
              cat.amount > 0 ? Math.max(8, Math.round((cat.amount / maxCatAmount) * 100)) : 0;
            const isSelected = selectedCategory === cat.key;
            const isTop = cat.amount > 0 && cat.amount === highestAmount;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.key)}
                className={`text-left rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#121214] text-white border-[#121214] shadow-md'
                    : 'bg-white text-[#121214] border-black/[0.08] hover:border-[#e8276b]/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/15 text-white' : `${meta.badgeBg} ${meta.badgeText}`
                    }`}
                  >
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                      isSelected
                        ? 'bg-white/15 text-white'
                        : isTop
                        ? 'bg-[#ffeef4] text-[#a50f45]'
                        : 'bg-[#f4f4f5] text-[#52525b]'
                    }`}
                  >
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div>
                  <p
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-white/80' : 'text-[#52525b]'
                    }`}
                  >
                    {cat.name}
                  </p>
                  <p className="font-display text-base font-extrabold tabular-nums mt-0.5">
                    {fmtINR(cat.amount)}
                  </p>
                </div>

                <div
                  className={`h-1.5 w-full rounded-full overflow-hidden ${
                    isSelected ? 'bg-white/15' : 'bg-[#faf8f9] border border-black/[0.05]'
                  }`}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isSelected ? '#e8276b' : meta.barColor,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Expense Voucher Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#52525b]">
            {selectedCategory === 'all'
              ? `Expense Cards · ${visibleExpenses.length}`
              : `${(CATEGORY_META[selectedCategory] || CATEGORY_META.other).label} · ${visibleExpenses.length}`}
          </h3>
        </div>

        {visibleExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] py-12 px-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="font-display text-sm font-bold text-[#121214]">
              {selectedCategory === 'all'
                ? 'No expenses logged yet'
                : 'No expenses in this category'}
            </p>
            <p className="text-xs text-[#52525b] mt-1 max-w-[44ch] mx-auto">
              {selectedCategory === 'all'
                ? 'Track makeup products, hair kits, travel, and staff costs so your monthly profit is accurate.'
                : 'Click "Show All Categories" or log a new expense under this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleExpenses.map((exp) => {
              const { dayMonth, year } = formatDayMonth(exp.expenseDate);
              const isMenuOpen = openMenuId === exp.id;
              const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
              const CatIcon = meta.icon;

              return (
                <article
                  key={exp.id}
                  className="bg-white rounded-2xl border border-black/[0.08] hover:border-[#e8276b]/35 hover:shadow-md transition-all flex flex-col justify-between relative"
                >
                  {/* Top Color Accent Bar */}
                  <div
                    style={{ backgroundColor: meta.barColor }}
                    className="h-1 w-full rounded-t-2xl"
                  />

                  <div className="p-4 sm:p-5 space-y-3 flex-1">
                    {/* Card Header: Category Pill + 3-Dot Vertical Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.badgeBg} ${meta.badgeText}`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                        {exp.categoryLabel || meta.label}
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label={`Expense actions for ${exp.title}`}
                          onClick={() => setOpenMenuId(isMenuOpen ? null : exp.id)}
                          className="w-8 h-8 rounded-lg hover:bg-black/[0.05] flex items-center justify-center text-[#52525b] hover:text-[#121214]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-9 z-30 w-40 rounded-xl bg-white border border-black/[0.08] shadow-xl py-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(exp)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-[#121214] hover:bg-[#faf8f9] flex items-center gap-2"
                              >
                                <SquarePen className="w-3.5 h-3.5 text-[#52525b]" />
                                Edit Expense
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteError('');
                                  setDeleteTarget(exp);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-[#e8276b] hover:bg-[#ffeef4] flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Expense
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title & Notes */}
                    <div>
                      <h4 className="font-display text-base font-bold text-[#121214] line-clamp-1">
                        {exp.title}
                      </h4>
                      <p className="text-xs text-[#52525b] mt-1 line-clamp-2 min-h-[2rem]">
                        {exp.notes ? exp.notes : 'Studio expense voucher'}
                      </p>
                    </div>
                  </div>

                  {/* Perforated Receipt-Style Card Footer */}
                  <div className="border-t border-dashed border-black/[0.1] bg-[#faf8f9] px-4 sm:px-5 py-3 rounded-b-2xl flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52525b] tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#e8276b]" />
                      <span>
                        {dayMonth} {year}
                      </span>
                    </div>

                    <p className="font-display text-lg font-extrabold text-[#121214] tabular-nums">
                      {fmtINR(exp.amount)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Log / Edit Expense Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="expense-modal-title" className="font-display text-lg font-bold text-[#121214]">
                  {editingExpense ? 'Edit Expense' : 'Log Studio Expense'}
                </h3>
                <p className="text-xs text-[#52525b]">
                  Syncs with your monthly studio profit &amp; reports
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                aria-label="Close expense modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="exp-title" className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Expense Title <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  id="exp-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., MAC Studio Fix & Lashes"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCategory(opt.key)}
                      className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-colors text-left ${
                        category === opt.key
                          ? 'bg-[#ffeef4] border-[#e8276b] text-[#a50f45]'
                          : 'bg-[#faf8f9] border-black/[0.08] text-[#52525b] hover:text-[#121214]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="exp-amount" className="block text-xs font-semibold text-[#121214] mb-1.5">
                    Amount (₹) <span className="text-[#e8276b]">*</span>
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    min="1"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    placeholder="2500"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] tabular-nums focus:outline-none focus:border-[#e8276b]"
                  />
                </div>

                <div>
                  <label htmlFor="exp-date" className="block text-xs font-semibold text-[#121214] mb-1.5">
                    Date <span className="text-[#e8276b]">*</span>
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseDate(todayIso)}
                  className={`h-7 px-3 rounded-lg text-[11px] font-semibold ${
                    expenseDate === todayIso
                      ? 'bg-[#121214] text-white'
                      : 'bg-[#faf8f9] text-[#52525b] border border-black/[0.07]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseDate(yesterdayIso)}
                  className={`h-7 px-3 rounded-lg text-[11px] font-semibold ${
                    expenseDate === yesterdayIso
                      ? 'bg-[#121214] text-white'
                      : 'bg-[#faf8f9] text-[#52525b] border border-black/[0.07]'
                  }`}
                >
                  Yesterday
                </button>
              </div>

              <div>
                <label htmlFor="exp-notes" className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  id="exp-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Vendor name, invoice ref, or kit details..."
                  className="w-full p-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-expense-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10"
          >
            <h3 id="delete-expense-title" className="font-display text-base font-bold text-[#121214]">
              Remove &ldquo;{deleteTarget.title}&rdquo;?
            </h3>
            <p className="text-xs text-[#52525b] mt-1.5">
              This deletes the {fmtINR(deleteTarget.amount)} expense from your studio ledger.
            </p>
            {deleteError && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#a50f45] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
