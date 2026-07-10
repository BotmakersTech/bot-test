// src/feature/Profile/constants/avatars.ts
//
// Predefined avatar registry + resolution helper.
//
// A user's profile picture is stored server-side as ONE value in the same
// `profilePhotoUrl` field the existing upload flow already writes to:
//   - a real upload -> a full CDN URL (e.g. "https://media.botleague.in/users/...")
//   - a predefined avatar -> a sentinel string "avatar:<key>" (never a real URL,
//     since these are bundled frontend assets, not R2-hosted files)
//   - neither yet -> null
//
// resolveAvatarSrc() is the single place that turns that stored value into an
// <img src>. Every place in the app that renders a profile picture should go
// through it instead of using the raw value directly.

import brute from "../../../assets/Avatar/BRUTE.png";
import echo from "../../../assets/Avatar/ECHO.png";
import kira from "../../../assets/Avatar/KIRA.png";
import nova from "../../../assets/Avatar/NOVA.png";

export interface AvatarOption {
  key: string;
  label: string;
  src: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "brute", label: "Brute", src: brute },
  { key: "echo", label: "Echo", src: echo },
  { key: "kira", label: "Kira", src: kira },
  { key: "nova", label: "Nova", src: nova },
];

const AVATAR_SENTINEL_PREFIX = "avatar:";

export function isAvatarSentinel(value?: string | null): value is string {
  return !!value && value.startsWith(AVATAR_SENTINEL_PREFIX);
}

export function toAvatarSentinel(key: string): string {
  return `${AVATAR_SENTINEL_PREFIX}${key}`;
}

function avatarKeyFromSentinel(value: string): string {
  return value.slice(AVATAR_SENTINEL_PREFIX.length);
}

/**
 * Resolves a stored profilePhotoUrl value (real CDN URL, "avatar:<key>"
 * sentinel, or null/undefined) to a displayable image src, or null when
 * there's nothing to show. Callers render their own placeholder (initials,
 * a generic icon, etc.) when this returns null.
 */
export function resolveAvatarSrc(value?: string | null): string | null {
  if (!value) return null;
  if (isAvatarSentinel(value)) {
    const key = avatarKeyFromSentinel(value);
    return AVATAR_OPTIONS.find((a) => a.key === key)?.src ?? null;
  }
  return value;
}

/** Convenience: label for a selected avatar key, e.g. for a11y / captions. */
export function avatarLabelForKey(key: string): string | null {
  return AVATAR_OPTIONS.find((a) => a.key === key)?.label ?? null;
}
