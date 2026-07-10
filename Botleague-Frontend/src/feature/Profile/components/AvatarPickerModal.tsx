// src/feature/Profile/components/AvatarPickerModal.tsx
//
// Popup opened from the Profile page's avatar/camera icon. Lets the user
// either pick one of the predefined avatars or upload a custom photo
// (reusing the existing upload flow via onUploadFile) — shown as a 5th
// tile in the same row. Doesn't touch the upload implementation itself,
// just offers it alongside the predefined choices.

import { useRef, useState } from "react";
import { AVATAR_OPTIONS, isAvatarSentinel } from "../constants/avatars";

interface AvatarPickerModalProps {
  /** Current stored value (real URL, "avatar:<key>" sentinel, or null). */
  currentValue?: string | null;
  onClose: () => void;
  /** Persists a predefined avatar selection. */
  onSelectAvatar: (avatarKey: string) => Promise<void>;
  /** Existing upload handler — same one the old direct file input used. */
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/*
 * Sizing reference: 1530px-wide screen -> .apm-card is 1300px, avatar
 * tiles are 240x240. Both scale down fluidly via clamp() for narrower
 * viewports instead of jumping at fixed breakpoints.
 */
const CSS = `
  .apm-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(20, 22, 35, 0.55);
    backdrop-filter: blur(3px);
  }

  .apm-card {
    position: relative;
    width: clamp(320px, 85vw, 1300px);
    background: #ffffff;
    border: 1.5px solid #6f8ef2;
    border-radius: 22px;
    padding: clamp(20px, 2vw, 36px) clamp(20px, 3vw, 48px) clamp(24px, 2.5vw, 40px);
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 24px 60px rgba(20, 30, 80, 0.25);
  }

  .apm-corner {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 2.5px solid #4f6bee;
  }
  .apm-corner-tl { top: -1.5px; left: -1.5px; border-right: 0; border-bottom: 0; border-top-left-radius: 18px; }
  .apm-corner-tr { top: -1.5px; right: -1.5px; border-left: 0; border-bottom: 0; border-top-right-radius: 18px; }

  .apm-title {
    margin: 0 0 clamp(20px, 2.5vw, 34px);
    text-align: center;
    color: #111114;
    font-size: clamp(1.3rem, 2vw, 1.8rem);
    font-weight: 800;
  }

  .apm-row {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: clamp(8px, 1.3vw, 20px);
    flex-wrap: nowrap;
    margin-bottom: clamp(22px, 2.5vw, 34px);
  }

  /*
   * Each tile takes an equal share of the row's available width instead of
   * a fixed/clamped size, so 5 tiles + gaps can never exceed the card width
   * — no independent size math to keep in sync with the card, no overflow,
   * no scrollbar needed. max-width caps it at the 1530px-reference size.
   */
  .apm-tile {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    max-width: 240px;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .apm-avatar-frame {
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
  }

  /* Selected: gradient ring, weight 7, inside position — the "inside"
     stroke is faked with a padding-box white fill layered under a
     border-box gradient fill, both clipped to the border area. */
  .apm-avatar-frame.selected {
    border: 7px solid transparent;
    background:
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(135deg, #0162D1, #8C6CFF) border-box;
  }

  .apm-tile:hover .apm-avatar-frame:not(.selected) {
    border: 7px solid transparent;
    background:
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(135deg, rgba(1,98,209,0.45), rgba(140,108,255,0.45)) border-box;
  }

  .apm-avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: #e5e7eb;
  }

  .apm-avatar-name {
    font-family: "Sarpanch", "Inter", system-ui, sans-serif;
    font-weight: 600;
    font-size: clamp(1rem, 1.4vw, 2rem);
    line-height: normal;
    letter-spacing: 0;
    text-align: center;
    text-transform: uppercase;
    background: linear-gradient(135deg, #0162D1, #8C6CFF);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .apm-upload-frame {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #9ca0ab;
    color: #ffffff;
    font-size: clamp(0.65rem, 0.9vw, 0.9rem);
    font-weight: 700;
    text-align: center;
    line-height: 1.3;
    padding: 0 10%;
    transition: background 0.15s;
  }

  .apm-tile:hover .apm-upload-frame { background: #868b98; }

  .apm-error {
    color: #dc2626;
    font-size: 0.82rem;
    text-align: center;
    margin: -14px 0 18px;
  }

  .apm-actions {
    display: flex;
    justify-content: center;
  }

  .apm-done-btn {
    min-width: 160px;
    border: none;
    border-radius: 999px;
    padding: 12px 32px;
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    background: linear-gradient(135deg, #0162D1, #8C6CFF);
    box-shadow: 0 4px 14px rgba(79, 108, 234, 0.35);
    cursor: pointer;
  }
  .apm-done-btn:hover { filter: brightness(1.05); }
  .apm-done-btn:disabled { opacity: 0.65; cursor: default; }
`;

export default function AvatarPickerModal({
  currentValue,
  onClose,
  onSelectAvatar,
  onUploadFile,
}: AvatarPickerModalProps) {
  const initialKey = isAvatarSentinel(currentValue)
    ? currentValue.slice("avatar:".length)
    : null;

  const [pendingKey, setPendingKey] = useState<string | null>(initialKey);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setError(null);
    setIsUploading(true);
    try {
      await onUploadFile(e);
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = async () => {
    if (!pendingKey) {
      onClose();
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSelectAvatar(pendingKey);
      onClose();
    } catch {
      setError("Couldn't save your avatar. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="apm-overlay" onClick={onClose}>
      <style>{CSS}</style>
      <div className="apm-card" onClick={(e) => e.stopPropagation()}>
        <span className="apm-corner apm-corner-tl" aria-hidden="true" />
        <span className="apm-corner apm-corner-tr" aria-hidden="true" />

        <h2 className="apm-title">Select your Avatar</h2>

        <div className="apm-row">
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = pendingKey === avatar.key;
            return (
              <button
                type="button"
                key={avatar.key}
                className="apm-tile"
                onClick={() => setPendingKey(avatar.key)}
              >
                <span className={selected ? "apm-avatar-frame selected" : "apm-avatar-frame"}>
                  <img src={avatar.src} alt={avatar.label} className="apm-avatar-img" />
                </span>
                <span className="apm-avatar-name">{avatar.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            className="apm-tile"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            <span className="apm-avatar-frame">
              <span className="apm-upload-frame">
                {isUploading ? "Uploading…" : "Add your own image"}
              </span>
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUploadChange}
              disabled={isUploading}
              style={{ display: "none" }}
            />
          </button>
        </div>

        {error && <p className="apm-error">{error}</p>}

        <div className="apm-actions">
          <button
            type="button"
            className="apm-done-btn"
            onClick={handleDone}
            disabled={isSaving || isUploading}
          >
            {isSaving ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
