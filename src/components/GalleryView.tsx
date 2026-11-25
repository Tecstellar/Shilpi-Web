import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Instagram,
  MoreVertical,
  SquarePen,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

export interface StudioGalleryLook {
  id: string;
  title: string;
  place?: string | null;
  bookingId?: string | null;
  imageUrl: string;
  extraImages: string[];
  caption?: string | null;
  instagramHandle?: string | null;
  instagramUrl?: string | null;
  postedToInstagram: boolean;
  createdAt: string;
}

export interface StudioGalleryStreaks {
  completedOrders: number;
  galleryLooks: number;
  totalCards: number;
  postedLooks: number;
  weeklyStreak: number;
  tierName: string;
  nextTarget: number;
  progressPercent: number;
}

export interface GalleryLookPayload {
  title: string;
  place: string;
  imageUrl: string;
  extraImages: string[];
  caption: string;
  instagramHandle: string;
  instagramUrl: string;
  postedToInstagram: boolean;
}

interface GalleryViewProps {
  looks: StudioGalleryLook[];
  streaks: StudioGalleryStreaks;
  businessName: string;
  syncing?: boolean;
  onAddLook: (
    payload: GalleryLookPayload
  ) => Promise<{ success: boolean; look?: StudioGalleryLook; error?: string }>;
  onUpdateLook: (
    lookId: string,
    payload: Partial<GalleryLookPayload>
  ) => Promise<{ success: boolean; look?: StudioGalleryLook; error?: string }>;
  onDeleteLook: (lookId: string) => Promise<{ success: boolean; error?: string }>;
}

function getAllLookPhotos(look: StudioGalleryLook): string[] {
  const list: string[] = [];
  if (look.imageUrl?.trim()) list.push(look.imageUrl.trim());
  if (Array.isArray(look.extraImages)) {
    for (const uri of look.extraImages) {
      if (uri?.trim()) list.push(uri.trim());
    }
  }
  return list.slice(0, 5);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recently';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  looks,
  streaks,
  businessName,
  syncing = false,
  onAddLook,
  onUpdateLook,
  onDeleteLook,
}) => {
  // 3-dot vertical menu state
  const [openMenuLookId, setOpenMenuLookId] = useState<string | null>(null);

  // Direct slot photo upload state
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const [slotTarget, setSlotTarget] = useState<{ look: StudioGalleryLook; slotIndex: number } | null>(
    null
  );

  // Add / Edit Look Metadata Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLook, setEditingLook] = useState<StudioGalleryLook | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formInstaTag, setFormInstaTag] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Share Poster Modal (matches mobile Create & Share Post)
  const [shareLook, setShareLook] = useState<StudioGalleryLook | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [shareInstaTag, setShareInstaTag] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [sharingPost, setSharingPost] = useState(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<StudioGalleryLook | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!editModalOpen && !shareLook && !deleteTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!saving) {
          setEditModalOpen(false);
          setEditingLook(null);
        }
        if (!sharingPost) setShareLook(null);
        if (!deleting) {
          setDeleteTarget(null);
          setDeleteError('');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editModalOpen, shareLook, deleteTarget, saving, sharingPost, deleting]);

  const openCreateLookModal = () => {
    setEditingLook(null);
    setFormTitle('');
    setFormPlace('');
    setFormInstaTag('');
    setFormCaption('');
    setFormError('');
    setEditModalOpen(true);
  };

  const openEditLookModal = (look: StudioGalleryLook) => {
    setOpenMenuLookId(null);
    setEditingLook(look);
    setFormTitle(look.title);
    setFormPlace(look.place || '');
    setFormInstaTag(look.instagramHandle || '');
    setFormCaption(look.caption || '');
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveLookMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle) {
      setFormError('Please enter a look / client title.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editingLook) {
        const res = await onUpdateLook(editingLook.id, {
          title: trimmedTitle,
          place: formPlace.trim(),
          instagramHandle: formInstaTag.trim(),
          caption: formCaption.trim(),
        });
        if (!res.success) {
          setFormError(res.error || 'Could not update look.');
          return;
        }
      } else {
        const res = await onAddLook({
          title: trimmedTitle,
          place: formPlace.trim(),
          imageUrl: '',
          extraImages: [],
          caption: formCaption.trim(),
          instagramHandle: formInstaTag.trim(),
          instagramUrl: '',
          postedToInstagram: false,
        });
        if (!res.success) {
          setFormError(res.error || 'Could not create look card.');
          return;
        }
      }
      setEditModalOpen(false);
      setEditingLook(null);
    } finally {
      setSaving(false);
    }
  };

  const handleTapSlot = (look: StudioGalleryLook, slotIndex: number) => {
    setSlotTarget({ look, slotIndex });
    slotFileInputRef.current?.click();
  };

  const handleSlotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !slotTarget) return;

    try {
      const dataUrl = await compressImageFile(file);
      const { look, slotIndex } = slotTarget;
      const extras = [...(look.extraImages || [])];
      if (slotIndex === 0) {
        await onUpdateLook(look.id, { imageUrl: dataUrl });
      } else {
        while (extras.length < slotIndex) extras.push('');
        extras[slotIndex - 1] = dataUrl;
        const cleanedExtras = extras.slice(0, 4).filter((x) => Boolean(x && x.trim()));
        await onUpdateLook(look.id, { extraImages: cleanedExtras });
      }
    } finally {
      setSlotTarget(null);
    }
  };

  const handleTogglePosted = async (look: StudioGalleryLook) => {
    await onUpdateLook(look.id, { postedToInstagram: !look.postedToInstagram });
  };

  const handleOpenShareModal = (look: StudioGalleryLook) => {
    const defaultCaption =
      look.caption?.trim() ||
      `${look.title}${look.place ? ` · ${look.place}` : ''} ✨ Crafted by ${businessName}. #BridalMakeup #ShilpiStudio`;
    setShareLook(look);
    setShareCaption(defaultCaption);
    setShareInstaTag(look.instagramHandle || '');
    setCopiedShare(false);
  };

  const handleCopyAndMarkPosted = async (markPosted: boolean) => {
    if (!shareLook) return;
    setSharingPost(true);
    try {
      try {
        await navigator.clipboard.writeText(shareCaption);
        setCopiedShare(true);
      } catch {
        // Clipboard optional
      }

      if (markPosted || shareInstaTag !== (shareLook.instagramHandle || '') || shareCaption !== (shareLook.caption || '')) {
        await onUpdateLook(shareLook.id, {
          caption: shareCaption.trim(),
          instagramHandle: shareInstaTag.trim(),
          postedToInstagram: markPosted ? true : shareLook.postedToInstagram,
        });
      }

      if (markPosted) {
        setShareLook(null);
      }
    } finally {
      setSharingPost(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await onDeleteLook(deleteTarget.id);
      if (!res.success) {
        setDeleteError(res.error || 'Could not delete look.');
        return;
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const sharePhotos = useMemo(
    () => (shareLook ? getAllLookPhotos(shareLook) : []),
    [shareLook]
  );

  return (
    <div className="space-y-5">
      {/* Hidden input for direct slot photo upload */}
      <input
        ref={slotFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSlotFileChange}
        className="hidden"
      />

      {/* 1. Header Card (Matches mobile MY PORTFOLIO / Client Looks & Reviews + New Look) */}
      <section className="bg-[#121214] text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#e8276b]">
            My Portfolio
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
            Client Looks &amp; Reviews
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateLookModal}
            className="h-10 px-4 rounded-xl bg-[#e8276b] hover:bg-white hover:text-[#121214] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Look
          </button>
        </div>
      </section>

      {/* 2. Shilpi Streaks Card (Matches mobile Shilpi Streak · Tier + 3 Stats + Progress Bar) */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffeef4] text-[#a50f45]">
            <Flame className="w-3.5 h-3.5 text-[#e8276b]" />
            <span className="text-[11px] font-extrabold tracking-wide uppercase">
              Shilpi Streak · {streaks.tierName}
            </span>
          </div>
          <span className="text-xs font-bold text-[#121214] tabular-nums">
            {streaks.completedOrders}/{streaks.nextTarget} Orders
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-black/[0.08] py-1">
          <div className="text-center px-2">
            <p className="font-display text-xl sm:text-2xl font-extrabold text-[#121214] tabular-nums">
              {streaks.completedOrders}
            </p>
            <p className="text-[11px] font-medium text-[#52525b] mt-0.5">Completed Orders</p>
          </div>
          <div className="text-center px-2">
            <p className="font-display text-xl sm:text-2xl font-extrabold text-[#121214] tabular-nums">
              {streaks.galleryLooks}
            </p>
            <p className="text-[11px] font-medium text-[#52525b] mt-0.5">Looks Saved</p>
          </div>
          <div className="text-center px-2">
            <p className="font-display text-xl sm:text-2xl font-extrabold text-[#e8276b] tabular-nums">
              {streaks.weeklyStreak} wk
            </p>
            <p className="text-[11px] font-medium text-[#52525b] mt-0.5">Active Streak</p>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-[#faf8f9] border border-black/[0.06] overflow-hidden">
          <div
            style={{ width: `${Math.max(6, streaks.progressPercent)}%` }}
            className="h-full rounded-full bg-[#e8276b] transition-all duration-300"
          />
        </div>
      </section>

      {/* 3. Empty State or Look Cards List (Matches mobile 3-Slot + Extra Strip Look Cards) */}
      {looks.length === 0 ? (
        <section className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#121214]">No Portfolio Looks Yet</h3>
          <p className="text-xs text-[#52525b] mt-1.5 max-w-[48ch] mx-auto leading-relaxed">
            Add 3 to 5 photos of any finished client look (Finished Look + Details) to combine them into a branded Shilpi post for Instagram.
          </p>
          <button
            type="button"
            onClick={openCreateLookModal}
            className="mt-5 h-10 px-5 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            ADD FIRST CLIENT LOOK
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {looks.map((post) => {
            const detail1 = post.extraImages?.[0] || '';
            const detail2 = post.extraImages?.[1] || '';
            const detail3 = post.extraImages?.[2] || '';
            const detail4 = post.extraImages?.[3] || '';
            const photoCount = getAllLookPhotos(post).length;
            const isMenuOpen = openMenuLookId === post.id;

            return (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-black/[0.08] p-5 space-y-4 relative"
              >
                {/* Card Header: Title + Date/Place + Posted Toggle + 3-Dot Vertical Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold text-[#121214] truncate">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#52525b] mt-0.5 truncate">
                      {formatDateLabel(post.createdAt)}
                      {post.place ? ` · ${post.place}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePosted(post)}
                      className={`h-8 px-2.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border transition-colors ${
                        post.postedToInstagram
                          ? 'bg-[#e8276b] border-[#e8276b] text-white'
                          : 'bg-[#faf8f9] border-black/[0.1] text-[#121214] hover:border-[#e8276b]/50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Posted
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`More actions for ${post.title}`}
                        onClick={() => setOpenMenuLookId(isMenuOpen ? null : post.id)}
                        className="w-8 h-8 rounded-lg hover:bg-black/[0.06] flex items-center justify-center text-[#121214]"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setOpenMenuLookId(null)}
                          />
                          <div className="absolute right-0 top-9 z-30 w-36 rounded-xl bg-white border border-black/[0.08] shadow-xl py-1.5">
                            <button
                              type="button"
                              onClick={() => openEditLookModal(post)}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-[#121214] hover:bg-[#faf8f9] flex items-center gap-2"
                            >
                              <SquarePen className="w-3.5 h-3.5 text-[#52525b]" />
                              Edit Look
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuLookId(null);
                                setDeleteError('');
                                setDeleteTarget(post);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-[#e8276b] hover:bg-[#ffeef4] flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Look
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary 3-Slot Grid (Finished Look + Detail 1 + Detail 2) */}
                <div className="grid grid-cols-3 gap-2.5 h-64 overflow-hidden">
                  {/* Large Hero Slot */}
                  <button
                    type="button"
                    onClick={() => handleTapSlot(post, 0)}
                    className={`col-span-2 relative h-full w-full min-h-0 rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center p-2 ${
                      post.imageUrl
                        ? 'bg-[#121214] border-black/10'
                        : 'bg-[#faf8f9] border-dashed border-[#e8276b]/35 hover:border-[#e8276b]'
                    }`}
                  >
                    {post.imageUrl ? (
                      <>
                        <img
                          src={post.imageUrl}
                          alt={`${post.title} Finished Look`}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <span className="absolute top-2.5 left-2.5 z-10 pointer-events-none px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold tracking-wider">
                          FINISHED LOOK
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mb-2">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-[#121214]">Drop finished look</span>
                        <span className="text-[11px] text-[#52525b] mt-0.5">Click to upload photo</span>
                      </>
                    )}
                  </button>

                  {/* Right 2 Detail Slots */}
                  <div className="col-span-1 h-full min-h-0 grid grid-rows-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleTapSlot(post, 1)}
                      className={`relative h-full w-full min-h-0 rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center gap-1 ${
                        detail1
                          ? 'bg-[#121214] border-black/10'
                          : 'bg-[#faf8f9] border-dashed border-black/[0.15] hover:border-[#e8276b]'
                      }`}
                    >
                      {detail1 ? (
                        <>
                          <img
                            src={detail1}
                            alt="Detail 1"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                          <span className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                            DETAIL 1
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-[#e8276b]" />
                          <span className="text-[11px] font-semibold text-[#52525b]">Detail 1</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTapSlot(post, 2)}
                      className={`relative h-full w-full min-h-0 rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center gap-1 ${
                        detail2
                          ? 'bg-[#121214] border-black/10'
                          : 'bg-[#faf8f9] border-dashed border-black/[0.15] hover:border-[#e8276b]'
                      }`}
                    >
                      {detail2 ? (
                        <>
                          <img
                            src={detail2}
                            alt="Detail 2"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                          <span className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                            DETAIL 2
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-[#e8276b]" />
                          <span className="text-[11px] font-semibold text-[#52525b]">Detail 2</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional Extra Photos (Detail 3 & Detail 4 + Add Photo up to 5) */}
                {(detail3 || detail4 || photoCount < 5) && (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {detail3 && (
                      <button
                        type="button"
                        onClick={() => handleTapSlot(post, 3)}
                        className="relative w-24 h-20 rounded-xl overflow-hidden bg-[#121214] border border-black/10 shrink-0"
                      >
                        <img
                          src={detail3}
                          alt="Detail 3"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 z-10 pointer-events-none px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                          DETAIL 3
                        </span>
                      </button>
                    )}

                    {detail4 && (
                      <button
                        type="button"
                        onClick={() => handleTapSlot(post, 4)}
                        className="relative w-24 h-20 rounded-xl overflow-hidden bg-[#121214] border border-black/10 shrink-0"
                      >
                        <img
                          src={detail4}
                          alt="Detail 4"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 z-10 pointer-events-none px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                          DETAIL 4
                        </span>
                      </button>
                    )}

                    {photoCount < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = !post.imageUrl
                            ? 0
                            : !detail1
                            ? 1
                            : !detail2
                            ? 2
                            : !detail3
                            ? 3
                            : 4;
                          handleTapSlot(post, nextIdx);
                        }}
                        className="h-10 px-3.5 rounded-xl border border-dashed border-[#e8276b]/45 bg-[#ffeef4]/60 hover:bg-[#ffeef4] text-[#a50f45] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#e8276b]" />
                        Add Photo ({photoCount}/5)
                      </button>
                    )}
                  </div>
                )}

                {/* Count + Readiness Bar */}
                <div className="px-3 py-2 rounded-xl bg-[#faf8f9] border border-black/[0.06] text-xs font-semibold text-[#52525b]">
                  <span className="text-[#121214] tabular-nums">{photoCount}/5 photos</span> ·{' '}
                  {photoCount >= 3 ? (
                    <span className="text-emerald-700">Ready to combine &amp; post</span>
                  ) : (
                    <span>Add {3 - photoCount} more (min 3)</span>
                  )}
                </div>

                {/* Caption */}
                {post.caption ? (
                  <p className="text-xs text-[#121214]/80 leading-relaxed whitespace-pre-line">
                    {post.caption}
                  </p>
                ) : null}

                {/* Footer: Create & Share Post + Instagram Badge Pill */}
                <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenShareModal(post)}
                    className={`h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                      photoCount < 3
                        ? 'bg-[#121214]/75 hover:bg-[#121214] text-white'
                        : 'bg-[#e8276b] hover:bg-[#121214] text-white'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {post.postedToInstagram ? 'SHARE AGAIN / EDIT POST' : 'CREATE & SHARE POST'}
                  </button>

                  {(post.postedToInstagram || post.instagramHandle) && (
                    <button
                      type="button"
                      onClick={() => handleOpenShareModal(post)}
                      className="h-8 px-3 rounded-full bg-[#ffeef4] text-[#a50f45] text-[11px] font-bold inline-flex items-center gap-1.5 max-w-full truncate"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#e8276b] shrink-0" />
                      <span className="truncate">
                        {post.postedToInstagram ? 'POSTED TO INSTAGRAM' : 'TAG'}
                        {post.instagramHandle ? ` · ${post.instagramHandle}` : ''}
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add / Edit Look Metadata (Matches Mobile) */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!saving) {
              setEditModalOpen(false);
              setEditingLook(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-meta-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="gallery-meta-title" className="font-display text-lg font-bold text-[#121214]">
                  {editingLook ? 'Update look details' : 'Create a look card'}
                </h3>
                <p className="text-xs text-[#52525b] mt-0.5">
                  {editingLook ? 'Edit portfolio look metadata' : 'Add photos after creating the card'}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingLook(null);
                }}
                aria-label="Close modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLookMetadata} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="m-look-title" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                  Look / Client Title *
                </label>
                <input
                  id="m-look-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Priya Menon — Bridal Makeup"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label htmlFor="m-look-place" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                  Place / Venue
                </label>
                <input
                  id="m-look-place"
                  type="text"
                  value={formPlace}
                  onChange={(e) => setFormPlace(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label htmlFor="m-look-ig" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                  Instagram Tag (@handle)
                </label>
                <input
                  id="m-look-ig"
                  type="text"
                  value={formInstaTag}
                  onChange={(e) => setFormInstaTag(e.target.value)}
                  placeholder="e.g. @priya_weddings"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <label htmlFor="m-look-caption" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                  Caption / Review Notes
                </label>
                <textarea
                  id="m-look-caption"
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Bridal review, products used, or look story..."
                  className="w-full p-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingLook(null);
                  }}
                  className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingLook ? 'Update Look' : 'Create Look Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Branded Shilpi Share Poster Modal (Matches Mobile Share Modal) */}
      {shareLook && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !sharingPost && setShareLook(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-poster-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-black/10 max-h-[92vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between items-start pb-3 border-b border-black/[0.06]">
              <div>
                <h3 id="share-poster-title" className="font-display text-lg font-bold text-[#121214]">
                  Shilpi Branded Post
                </h3>
                <p className="text-xs text-[#52525b]">
                  Combined collage preview ready for Instagram
                </p>
              </div>
              <button
                type="button"
                disabled={sharingPost}
                onClick={() => setShareLook(null)}
                aria-label="Close share modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Branded Poster Collage Preview */}
            <div className="rounded-2xl bg-[#121214] p-4 text-white space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold tracking-wider uppercase text-[#e8276b]">
                  {businessName}
                </span>
                <span className="text-white/70">{shareLook.place || 'Studio'}</span>
              </div>

              {sharePhotos.length > 0 ? (
                <div className="space-y-2">
                  <div className="h-52 rounded-xl overflow-hidden bg-black">
                    <img
                      src={sharePhotos[0]}
                      alt={shareLook.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {sharePhotos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {sharePhotos.slice(1).map((src, i) => (
                        <div key={`poster-sub-${i}`} className="h-16 rounded-lg overflow-hidden bg-black">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-36 rounded-xl bg-white/5 flex flex-col items-center justify-center text-white/60 gap-1.5">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Upload photos in the card slots first</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-bold truncate">{shareLook.title}</span>
                {shareInstaTag && <span className="text-[#e8276b] font-semibold">{shareInstaTag}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="share-ig-tag" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                Instagram Tag
              </label>
              <input
                id="share-ig-tag"
                type="text"
                value={shareInstaTag}
                onChange={(e) => setShareInstaTag(e.target.value)}
                placeholder="@client_handle"
                className="w-full h-9 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b]"
              />
            </div>

            <div>
              <label htmlFor="share-caption-input" className="block text-[11px] font-bold uppercase tracking-wide text-[#121214] mb-1">
                Post Caption
              </label>
              <textarea
                id="share-caption-input"
                rows={3}
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={sharingPost}
                onClick={() => handleCopyAndMarkPosted(false)}
                className="h-10 rounded-xl border border-black/[0.12] bg-white hover:bg-[#faf8f9] text-xs font-semibold text-[#121214] inline-flex items-center justify-center gap-1.5"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Caption Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Caption
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={sharingPost}
                onClick={() => handleCopyAndMarkPosted(true)}
                className="h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {sharingPost ? 'Saving...' : 'Copy & Mark Posted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-look-confirm"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10"
          >
            <h3 id="delete-look-confirm" className="font-display text-base font-bold text-[#121214]">
              Delete &ldquo;{deleteTarget.title}&rdquo;?
            </h3>
            <p className="text-xs text-[#52525b] mt-1.5">
              This removes the look card and its photos from your synced studio portfolio.
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
                {deleting ? 'Deleting...' : 'Delete Look'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
