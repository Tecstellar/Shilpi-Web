import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Edit2,
  FolderInput,
  FolderPlus,
  Layers,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import ShilpiEditVectorIcon from './ShilpiEditVectorIcon';

export interface StudioPackage {
  id: string;
  name: string;
  serviceType: string;
  description?: string | null;
  durationMinutes: number;
  priceRupees: number;
  isActive: boolean;
  category?: string;
}

export interface PackagePayload {
  name: string;
  serviceType: string;
  description: string;
  durationMinutes: number;
  priceRupees: number;
  isActive: boolean;
  category?: string;
}

interface PackagesViewProps {
  packages: StudioPackage[];
  syncing?: boolean;
  onAddPackage: (
    payload: PackagePayload
  ) => Promise<{ success: boolean; pkg?: StudioPackage; error?: string }>;
  onUpdatePackage: (
    packageId: string,
    payload: PackagePayload
  ) => Promise<{ success: boolean; pkg?: StudioPackage; error?: string }>;
  onDeletePackage: (
    packageId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const DEFAULT_CATEGORIES = ['Makeup', 'Hair Styling', 'Saree Draping', 'Bridal'];

function normalizeCategoryName(cat?: string | null): string {
  if (!cat) return 'Makeup';
  const trimmed = cat.trim();
  if (!trimmed) return 'Makeup';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function extractCategoryFromPackage(pkg: StudioPackage): string {
  if (pkg.category) return normalizeCategoryName(pkg.category);
  if (pkg.description && pkg.description.startsWith('category:')) {
    const raw = pkg.description.replace(/^category:\s*/i, '').trim();
    if (raw) return normalizeCategoryName(raw);
  }
  const st = (pkg.serviceType || 'bridal').toLowerCase();
  if (st === 'makeup') return 'Makeup';
  if (st === 'hair') return 'Hair Styling';
  if (st === 'bridal') return 'Bridal';
  if (st === 'mehendi') return 'Mehendi';
  if (st === 'skincare') return 'Skincare';
  if (st === 'combo') return 'Combos';
  return normalizeCategoryName(st);
}

function mapCategoryToServiceType(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('makeup')) return 'makeup';
  if (lower.includes('hair')) return 'hair';
  if (lower.includes('mehendi')) return 'mehendi';
  if (lower.includes('skin')) return 'skincare';
  if (lower.includes('combo')) return 'combo';
  return 'bridal';
}

function fmtINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  syncing = false,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
}) => {
  // Slider State for Add Mode: 'category' | 'service' | null
  const [activeAddMode, setActiveAddMode] = useState<'category' | 'service' | null>(null);

  // Search query
  const [search, setSearch] = useState('');

  // Custom Categories list maintained in component state + derived from packages
  const [customCategories, setCustomCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Add Category Form State
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Add Service Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('Makeup');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [showInlineNewCatInput, setShowInlineNewCatInput] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  // 3-Dot Category Menu Modal State
  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null);
  const [renameCategoryModalOpen, setRenameCategoryModalOpen] = useState(false);
  const [renameCategoryInput, setRenameCategoryInput] = useState('');
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<string | null>(null);
  const [moveServicesTargetCategory, setMoveServicesTargetCategory] = useState<string>('');

  // 3-Dot Service Item Menu Modal State
  const [activeServiceMenuPkg, setActiveServiceMenuPkg] = useState<StudioPackage | null>(null);

  // Edit Service Modal State
  const [editTargetPkg, setEditTargetPkg] = useState<StudioPackage | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Move Service Modal State
  const [moveTargetPkg, setMoveTargetPkg] = useState<StudioPackage | null>(null);
  const [moveDestinationCategory, setMoveDestinationCategory] = useState('');
  const [movingService, setMovingService] = useState(false);

  // Delete Service Confirm Modal State
  const [deleteTargetPkg, setDeleteTargetPkg] = useState<StudioPackage | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  // Collect all unique categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    customCategories.forEach((c) => set.add(normalizeCategoryName(c)));
    packages.forEach((p) => set.add(extractCategoryFromPackage(p)));
    return Array.from(set);
  }, [customCategories, packages]);

  // Group packages by category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, StudioPackage[]>();
    allCategories.forEach((cat) => map.set(cat, []));

    packages.forEach((pkg) => {
      const cat = extractCategoryFromPackage(pkg);
      const list = map.get(cat) || [];
      list.push(pkg);
      map.set(cat, list);
    });

    const q = search.trim().toLowerCase();
    const result: Array<{ name: string; items: StudioPackage[] }> = [];

    map.forEach((items, name) => {
      let filteredItems = items;
      if (q) {
        filteredItems = items.filter(
          (i) => i.name.toLowerCase().includes(q) || name.toLowerCase().includes(q)
        );
      }
      if (!q || filteredItems.length > 0 || name.toLowerCase().includes(q)) {
        result.push({ name, items: filteredItems });
      }
    });

    return result;
  }, [allCategories, packages, search]);

  // Handler: Create Category
  const handleCreateCategory = (nameToCreate?: string) => {
    const raw = (nameToCreate !== undefined ? nameToCreate : categoryNameInput).trim();
    if (!raw) {
      setCategoryError('Please enter a category name.');
      return;
    }
    const normalized = normalizeCategoryName(raw);
    if (allCategories.some((c) => c.toLowerCase() === normalized.toLowerCase())) {
      setCategoryError(`Category "${normalized}" already exists.`);
      return;
    }
    setCustomCategories((prev) => [...prev, normalized]);
    setSelectedCategory(normalized);
    setCategoryNameInput('');
    setCategoryError('');
    setShowInlineNewCatInput(false);
    setInlineCatName('');
    setActiveAddMode(null);
  };

  // Handler: Add Service
  const handleSaveService = async () => {
    const name = serviceName.trim();
    const priceNum = parseInt(servicePrice.replace(/[^0-9]/g, ''), 10);
    if (!name) {
      setServiceError('Please enter service name.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setServiceError('Please enter a valid price in rupees.');
      return;
    }

    setSubmittingService(true);
    setServiceError('');
    try {
      const serviceType = mapCategoryToServiceType(selectedCategory);
      const payload: PackagePayload = {
        name,
        priceRupees: priceNum,
        serviceType,
        description: `category: ${selectedCategory}`,
        durationMinutes: 60,
        isActive: true,
        category: selectedCategory,
      };

      const res = await onAddPackage(payload);
      if (!res.success) {
        setServiceError(res.error || 'Failed to save service.');
        return;
      }

      setServiceName('');
      setServicePrice('');
      setActiveAddMode(null);
    } catch {
      setServiceError('Network error while saving service.');
    } finally {
      setSubmittingService(false);
    }
  };

  // Handler: Open Edit Service Modal
  const handleOpenEdit = (pkg: StudioPackage) => {
    setActiveServiceMenuPkg(null);
    setEditTargetPkg(pkg);
    setEditCategory(extractCategoryFromPackage(pkg));
    setEditName(pkg.name);
    setEditPrice(String(pkg.priceRupees || ''));
    setEditError('');
  };

  // Handler: Save Edit Service
  const handleSaveEdit = async () => {
    if (!editTargetPkg) return;
    const name = editName.trim();
    const priceNum = parseInt(editPrice.replace(/[^0-9]/g, ''), 10);
    if (!name) {
      setEditError('Please enter package name.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditError('Please enter a valid price.');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    try {
      const serviceType = mapCategoryToServiceType(editCategory);
      const res = await onUpdatePackage(editTargetPkg.id, {
        name,
        priceRupees: priceNum,
        serviceType,
        description: `category: ${editCategory}`,
        durationMinutes: editTargetPkg.durationMinutes || 60,
        isActive: editTargetPkg.isActive,
        category: editCategory,
      });

      if (!res.success) {
        setEditError(res.error || 'Failed to update package.');
        return;
      }
      setEditTargetPkg(null);
    } catch {
      setEditError('Error while saving changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handler: Move Service To Another Category
  const handleMoveService = async () => {
    if (!moveTargetPkg || !moveDestinationCategory) return;
    setMovingService(true);
    try {
      const serviceType = mapCategoryToServiceType(moveDestinationCategory);
      await onUpdatePackage(moveTargetPkg.id, {
        name: moveTargetPkg.name,
        priceRupees: moveTargetPkg.priceRupees,
        serviceType,
        description: `category: ${moveDestinationCategory}`,
        durationMinutes: moveTargetPkg.durationMinutes || 60,
        isActive: moveTargetPkg.isActive,
        category: moveDestinationCategory,
      });
      setMoveTargetPkg(null);
      setMoveDestinationCategory('');
    } catch (err) {
      console.error(err);
    } finally {
      setMovingService(false);
    }
  };

  // Handler: Confirm Delete Service
  const handleConfirmDeleteService = async () => {
    if (!deleteTargetPkg) return;
    setDeletingService(true);
    try {
      await onDeletePackage(deleteTargetPkg.id);
      setDeleteTargetPkg(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingService(false);
    }
  };

  // Handler: Rename Category
  const handleSaveRenameCategory = async () => {
    if (!activeCategoryMenu) return;
    const trimmed = renameCategoryInput.trim();
    if (!trimmed) return;
    const normalized = normalizeCategoryName(trimmed);

    // Update in customCategories list
    setCustomCategories((prev) =>
      prev.map((c) => (c.toLowerCase() === activeCategoryMenu.toLowerCase() ? normalized : c))
    );

    // Update all packages currently in this category
    const affected = packages.filter(
      (p) => extractCategoryFromPackage(p).toLowerCase() === activeCategoryMenu.toLowerCase()
    );
    for (const p of affected) {
      const serviceType = mapCategoryToServiceType(normalized);
      await onUpdatePackage(p.id, {
        name: p.name,
        priceRupees: p.priceRupees,
        serviceType,
        description: `category: ${normalized}`,
        durationMinutes: p.durationMinutes || 60,
        isActive: p.isActive,
        category: normalized,
      });
    }

    setRenameCategoryModalOpen(false);
    setActiveCategoryMenu(null);
    setRenameCategoryInput('');
  };

  // Handler: Delete Category
  const handleConfirmDeleteCategory = async (moveServices: boolean) => {
    if (!deleteCategoryTarget) return;

    const affected = packages.filter(
      (p) => extractCategoryFromPackage(p).toLowerCase() === deleteCategoryTarget.toLowerCase()
    );

    if (moveServices && moveServicesTargetCategory) {
      // Move all services to the chosen target category
      const serviceType = mapCategoryToServiceType(moveServicesTargetCategory);
      for (const p of affected) {
        await onUpdatePackage(p.id, {
          name: p.name,
          priceRupees: p.priceRupees,
          serviceType,
          description: `category: ${moveServicesTargetCategory}`,
          durationMinutes: p.durationMinutes || 60,
          isActive: p.isActive,
          category: moveServicesTargetCategory,
        });
      }
    } else {
      // Delete all services in this category
      for (const p of affected) {
        await onDeletePackage(p.id);
      }
    }

    // Remove from category list
    setCustomCategories((prev) =>
      prev.filter((c) => c.toLowerCase() !== deleteCategoryTarget.toLowerCase())
    );
    setDeleteCategoryTarget(null);
    setActiveCategoryMenu(null);
    setMoveServicesTargetCategory('');
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          Top Action Toolbar: Segmented Slider Pills for "Add Category" & "Add Service"
          ========================================================================= */}
      <section className="bg-white rounded-xl border border-black/[0.07] p-3 sm:p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented Slider Pill Switcher */}
          <div className="inline-flex items-center p-1 bg-[#f4f2f3] rounded-xl border border-black/[0.06] shadow-inner max-w-fit">
            <button
              type="button"
              onClick={() => setActiveAddMode((prev) => (prev === 'category' ? null : 'category'))}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeAddMode === 'category'
                  ? 'bg-white text-[#121214] shadow-sm border border-black/[0.06]'
                  : 'text-[#64748b] hover:text-[#121214]'
              }`}
            >
              <FolderPlus className={`w-3.5 h-3.5 ${activeAddMode === 'category' ? 'text-[#e8276b]' : 'text-current'}`} />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Category</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeAddMode === 'service') {
                  setActiveAddMode(null);
                } else {
                  if (allCategories.length > 0 && !allCategories.includes(selectedCategory)) {
                    setSelectedCategory(allCategories[0]);
                  }
                  setActiveAddMode('service');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeAddMode === 'service'
                  ? 'bg-white text-[#121214] shadow-sm border border-black/[0.06]'
                  : 'text-[#64748b] hover:text-[#121214]'
              }`}
            >
              <Plus className={`w-3.5 h-3.5 ${activeAddMode === 'service' ? 'text-[#e8276b]' : 'text-current'}`} />
              <span className="hidden sm:inline">Add Service</span>
              <span className="sm:hidden">Service</span>
            </button>
          </div>

          {/* Search Box & Sync Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#121214]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#faf8f9] border border-black/[0.08] text-xs font-medium text-[#121214] placeholder:text-[#121214]/40 focus:outline-none focus:border-[#e8276b]"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            Inline Form Card: Add Category Mode
            ========================================================================= */}
        {activeAddMode === 'category' && (
          <div className="mt-5 p-5 rounded-2xl bg-[#faf8f9] border border-black/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#121214] flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#e8276b]" />
                <span>Create New Category</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCategoryNameInput('');
                  setCategoryError('');
                  setActiveAddMode(null);
                }}
                className="text-[#64748b] hover:text-[#121214] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="mb-3 p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                {categoryError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryNameInput}
                  onChange={(e) => {
                    setCategoryNameInput(e.target.value);
                    if (categoryError) setCategoryError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="e.g. Saree Draping, Mehendi Art, Pre-Bridal Skin, Nails"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b] focus:ring-1 focus:ring-[#e8276b]"
                  autoFocus
                />
              </div>

              <div className="sm:col-span-1 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryNameInput('');
                    setCategoryError('');
                    setActiveAddMode(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateCategory()}
                  className="flex-1 h-11 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  CREATE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            Inline Form Card: Add Service Mode
            ========================================================================= */}
        {activeAddMode === 'service' && (
          <div className="mt-5 p-5 rounded-2xl bg-[#faf8f9] border border-black/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#121214] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#e8276b]" />
                <span>Add New Service Package</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setServiceName('');
                  setServicePrice('');
                  setServiceError('');
                  setActiveAddMode(null);
                }}
                className="text-[#64748b] hover:text-[#121214] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {serviceError && (
              <div className="mb-4 p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                {serviceError}
              </div>
            )}

            {/* 1. Category Selector Pills */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-[#64748b] uppercase">
                  Select Category <span className="text-[#e8276b]">*</span>
                </label>
                {!showInlineNewCatInput && (
                  <button
                    type="button"
                    onClick={() => setShowInlineNewCatInput(true)}
                    className="text-[11px] font-bold text-[#e8276b] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Category</span>
                  </button>
                )}
              </div>

              {showInlineNewCatInput ? (
                <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-xl border border-[#e8276b]/30">
                  <input
                    type="text"
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    placeholder="Enter new category name..."
                    className="flex-1 h-9 px-3 rounded-lg bg-[#faf8f9] text-xs font-medium focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (inlineCatName.trim()) {
                        handleCreateCategory(inlineCatName);
                      }
                    }}
                    className="px-3 h-9 rounded-lg bg-[#e8276b] text-white text-xs font-bold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineNewCatInput(false);
                      setInlineCatName('');
                    }}
                    className="px-2 h-9 text-xs text-[#64748b]"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => {
                  const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSel
                          ? 'bg-[#121214] text-white shadow-sm'
                          : 'bg-white text-[#64748b] hover:text-[#121214] border border-black/[0.08]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Service Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Service Name <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => {
                    setServiceName(e.target.value);
                    if (serviceError) setServiceError('');
                  }}
                  placeholder="e.g. HD Airbrush Base, Heritage Poola Jada"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b] focus:ring-1 focus:ring-[#e8276b]"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Price (₹) <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  type="text"
                  value={servicePrice}
                  onChange={(e) => {
                    setServicePrice(e.target.value.replace(/[^0-9]/g, ''));
                    if (serviceError) setServiceError('');
                  }}
                  placeholder="e.g. 5000"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-black/[0.1] text-sm font-semibold tabular-nums text-[#121214] focus:outline-none focus:border-[#e8276b] focus:ring-1 focus:ring-[#e8276b]"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setServiceName('');
                  setServicePrice('');
                  setServiceError('');
                  setActiveAddMode(null);
                }}
                className="px-5 h-10 rounded-xl border border-black/[0.1] bg-white text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={submittingService}
                onClick={handleSaveService}
                className="px-6 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingService ? 'ADDING...' : 'ADD SERVICE'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          Package Category Groups: Long Category Container with 5-Box Grid
          ========================================================================= */}
      {groupedCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.07] p-10 text-center">
          <Layers className="w-10 h-10 text-[#121214]/20 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#121214] mb-1">No services found</h3>
          <p className="text-xs text-[#52525b] mb-4">
            Create your first category or service using the controls above.
          </p>
          <button
            type="button"
            onClick={() => setActiveAddMode('service')}
            className="px-4 py-2 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-semibold transition-colors"
          >
            Add New Service
          </button>
        </div>
      ) : (
        groupedCategories.map((group) => (
          <section key={group.name} className="space-y-3 mb-6">
            {/* Compact Category Header Row - Fitted Pill Container (Not full-width bar) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Category Title Pill - Fits Content Nicely */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121214] text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8276b] shrink-0" />
                <h4 className="text-xs font-extrabold tracking-wide uppercase">
                  {group.name}
                </h4>
                <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-[9.5px] font-bold text-white/90 tabular-nums">
                  {group.items.length}
                </span>
              </div>

              {/* Right: Quick Add + Category 3-Dot Options Menu */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(group.name);
                    setActiveAddMode('service');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-black/[0.1] hover:border-[#e8276b] hover:text-[#e8276b] text-[11px] font-bold text-[#121214] transition-colors shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-[#e8276b]" />
                  <span>Add Service</span>
                </button>

                {/* 3-Dot Horizontal Options Action Button for Category */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategoryMenu((prev) => (prev === group.name ? null : group.name));
                    }}
                    aria-label={`Category options for ${group.name}`}
                    className="w-7 h-7 rounded-lg bg-white border border-black/[0.1] hover:bg-[#faf8f9] flex items-center justify-center text-[#52525b] hover:text-[#121214] transition-colors shadow-2xs"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu for Category */}
                  {activeCategoryMenu === group.name && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 bg-white rounded-xl shadow-2xl border border-black/10 py-1.5 z-30 text-[#121214] animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategoryMenu(null);
                          setRenameCategoryInput(group.name);
                          setRenameCategoryModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-[#faf8f9] flex items-center gap-2.5 transition-colors"
                      >
                        <ShilpiEditVectorIcon color="#121214" size={14} />
                        <span>Rename Category</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategoryMenu(null);
                          setDeleteCategoryTarget(group.name);
                          const otherCats = allCategories.filter(
                            (c) => c.toLowerCase() !== group.name.toLowerCase()
                          );
                          setMoveServicesTargetCategory(otherCats[0] || '');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#e8276b] hover:bg-[#ffeef4] flex items-center gap-2.5 transition-colors border-t border-black/[0.05]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Category</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5-Box Package Grid matching CustomersView box dimensions */}
            {group.items.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-black/[0.07] text-center">
                <p className="text-xs text-[#64748b] mb-2.5">No services in this category yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(group.name);
                    setActiveAddMode('service');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.1] text-xs font-bold text-[#121214] hover:bg-[#121214] hover:text-white transition-colors"
                >
                  + Add Service to {group.name}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {group.items.map((item, idx) => {
                  const initial = (item.name.trim().charAt(0) || 'S').toUpperCase();
                  const isMenuOpen = activeServiceMenuPkg?.id === item.id;

                  return (
                    <div key={item.id || `${group.name}-${item.name}-${idx}`} className="relative group">
                      <div className="w-full h-full bg-white rounded-2xl border border-black/[0.07] hover:border-[#e8276b]/55 hover:shadow-md p-4 text-left transition-all flex flex-col justify-between min-h-[148px]">
                        {/* Top: Icon Badge & Duration / Category Tag */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3 pr-7">
                            <div className="w-9 h-9 rounded-full bg-[#ffeef4] text-[#e8276b] group-hover:bg-[#e8276b] group-hover:text-white transition-colors flex items-center justify-center text-sm font-bold shrink-0">
                              {initial}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              {item.durationMinutes ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#faf8f9] border border-black/[0.06] text-[#52525b] text-[10px] font-semibold tabular-nums">
                                  {item.durationMinutes}m
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ffeef4] text-[#e8276b] text-[10px] font-bold">
                                  Popular
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Service Name & Category - Shorter & Responsive */}
                          <p className="font-semibold text-xs sm:text-[13px] text-[#121214] truncate group-hover:text-[#e8276b] transition-colors leading-snug" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-[#52525b] mt-0.5 truncate">
                            {group.name}
                          </p>
                        </div>

                        {/* Bottom Row: Studio Rate & Price */}
                        <div className="pt-3 mt-3 border-t border-black/[0.05] flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-medium text-[#52525b]">
                            Studio Rate
                          </span>
                          <span className="font-bold text-sm text-[#e8276b] tabular-nums">
                            {fmtINR(item.priceRupees)}
                          </span>
                        </div>
                      </div>

                      {/* 3-Dot Vertical Menu Button for Service */}
                      <button
                        type="button"
                        aria-label={`Options for ${item.name}`}
                        onClick={() => {
                          setActiveServiceMenuPkg((prev) => (prev?.id === item.id ? null : item));
                        }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg hover:bg-black/[0.06] flex items-center justify-center text-[#52525b] hover:text-[#121214] transition-colors z-10"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu for Service Item */}
                      {isMenuOpen && (
                        <div className="absolute right-3 top-10 w-52 bg-white rounded-xl shadow-2xl border border-black/10 py-1.5 z-40 text-[#121214] animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-[#faf8f9] flex items-center gap-2.5 transition-colors"
                          >
                            <ShilpiEditVectorIcon color="#121214" size={14} />
                            <div>
                              <p className="font-bold">Edit Package</p>
                              <p className="text-[10px] text-[#64748b]">Update name, price, or category</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveServiceMenuPkg(null);
                              setMoveTargetPkg(item);
                              const otherCats = allCategories.filter(
                                (c) => c.toLowerCase() !== group.name.toLowerCase()
                              );
                              setMoveDestinationCategory(otherCats[0] || '');
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-[#faf8f9] flex items-center gap-2.5 transition-colors border-t border-black/[0.05]"
                          >
                            <FolderInput className="w-3.5 h-3.5 text-[#e8276b]" />
                            <div>
                              <p className="font-bold">Move Category</p>
                              <p className="text-[10px] text-[#64748b]">Transfer to another category</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveServiceMenuPkg(null);
                              setDeleteTargetPkg(item);
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-[#e8276b] hover:bg-[#ffeef4] flex items-center gap-2.5 transition-colors border-t border-black/[0.05]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <div>
                              <p className="font-bold">Delete Package</p>
                              <p className="text-[10px] text-[#a50f45]">Remove from service list</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))
      )}

      {/* =========================================================================
          MODAL 1: Rename Category Modal
          ========================================================================= */}
      {renameCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#121214] mb-1">Rename Category</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Enter a new name for category <strong className="text-[#121214]">{activeCategoryMenu}</strong>.
            </p>

            <input
              type="text"
              value={renameCategoryInput}
              onChange={(e) => setRenameCategoryInput(e.target.value)}
              placeholder="e.g. Bridal Artistry"
              className="w-full h-11 px-4 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b] mb-5 font-semibold"
              autoFocus
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setRenameCategoryModalOpen(false);
                  setActiveCategoryMenu(null);
                }}
                className="flex-1 h-11 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRenameCategory}
                className="flex-1 h-11 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Delete Category Modal
          ========================================================================= */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#121214] mb-1">
              Delete &quot;{deleteCategoryTarget}&quot; Category?
            </h3>
            <p className="text-xs text-[#64748b] mb-4">
              Choose what happens to the services inside this category.
            </p>

            {allCategories.filter((c) => c.toLowerCase() !== deleteCategoryTarget.toLowerCase()).length > 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.06]">
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1.5">
                  Move services to another category:
                </label>
                <select
                  value={moveServicesTargetCategory}
                  onChange={(e) => setMoveServicesTargetCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-black/[0.1] text-xs font-bold text-[#121214]"
                >
                  {allCategories
                    .filter((c) => c.toLowerCase() !== deleteCategoryTarget.toLowerCase())
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {moveServicesTargetCategory && (
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteCategory(true)}
                  className="w-full h-11 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold transition-colors"
                >
                  Move Services to {moveServicesTargetCategory} & Delete Category
                </button>
              )}
              <button
                type="button"
                onClick={() => handleConfirmDeleteCategory(false)}
                className="w-full h-11 rounded-xl bg-[#e8276b] hover:bg-[#a50f45] text-white text-xs font-bold transition-colors"
              >
                Delete Category & All Services Inside
              </button>
              <button
                type="button"
                onClick={() => setDeleteCategoryTarget(null)}
                className="w-full h-10 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Edit Package Modal
          ========================================================================= */}
      {editTargetPkg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] mb-4">
              <h3 className="text-base font-bold text-[#121214]">Edit Package</h3>
              <button
                type="button"
                onClick={() => setEditTargetPkg(null)}
                className="text-[#64748b] hover:text-[#121214] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs font-bold text-[#121214] focus:outline-none focus:border-[#e8276b]"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748b] uppercase mb-1">
                  Price (₹)
                </label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full h-11 px-4 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm font-semibold tabular-nums text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditTargetPkg(null)}
                  className="flex-1 h-11 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                  className="flex-1 h-11 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: Move Service to Another Category Modal
          ========================================================================= */}
      {moveTargetPkg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mb-3">
              <FolderInput className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#121214] mb-1">Move to Another Category</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Transfer <strong className="text-[#121214]">{moveTargetPkg.name}</strong> to:
            </p>

            <select
              value={moveDestinationCategory}
              onChange={(e) => setMoveDestinationCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs font-bold text-[#121214] focus:outline-none focus:border-[#e8276b] mb-5"
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMoveTargetPkg(null)}
                className="flex-1 h-11 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={movingService}
                onClick={handleMoveService}
                className="flex-1 h-11 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {movingService ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: Delete Service Confirm Modal
          ========================================================================= */}
      {deleteTargetPkg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#121214] mb-1">Delete Service?</h3>
            <p className="text-xs text-[#64748b] mb-4">
              Are you sure you want to delete <strong className="text-[#121214]">{deleteTargetPkg.name}</strong> ({fmtINR(deleteTargetPkg.priceRupees)})? This cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetPkg(null)}
                className="flex-1 h-11 rounded-xl border border-black/[0.1] text-xs font-bold text-[#64748b] hover:text-[#121214] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingService}
                onClick={handleConfirmDeleteService}
                className="flex-1 h-11 rounded-xl bg-[#e8276b] hover:bg-[#a50f45] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deletingService ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesView;
