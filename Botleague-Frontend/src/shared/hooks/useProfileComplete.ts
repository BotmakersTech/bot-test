import { useSelector } from "react-redux";
import { User, Cake, Tag, Camera } from "lucide-react";
import type { RootState } from "../../app/store";
import type { MissingField } from "../components/ProfileIncompleteModal";

/**
 * Returns the list of required profile fields the current user hasn't filled in.
 * An empty array means the profile is complete and the user may create/join a team.
 */
export function useProfileComplete(): {
  isComplete:    boolean;
  missingFields: MissingField[];
} {
  const user = useSelector((s: RootState) => s.auth.user);

  const missingFields: MissingField[] = [];

  if (!user?.firstName?.trim() || !user?.lastName?.trim()) {
    missingFields.push({ key: "name",         label: "Full Name (First & Last)",  icon: User });
  }
  if (!user?.dateOfBirth) {
    missingFields.push({ key: "dob",          label: "Date of Birth",             icon: Cake });
  }
  if (!user?.userName?.trim()) {
    missingFields.push({ key: "username",     label: "Username",                  icon: Tag });
  }
  if (!user?.profilePhotoUrl) {
    missingFields.push({ key: "photo",        label: "Profile Picture",           icon: Camera });
  }

  return {
    isComplete:    missingFields.length === 0,
    missingFields,
  };
}

/**
 * Parses a backend `PROFILE_INCOMPLETE: ... Missing: A, B, C` message into the
 * same `MissingField[]` the modal renders, so a server-side rejection can drive
 * the exact same popup as the client-side gate. Returns null for any other error.
 */
export function parseProfileIncomplete(message?: string | null): MissingField[] | null {
  if (!message || !message.includes("PROFILE_INCOMPLETE")) return null;
  const after = message.split("Missing:")[1];
  if (!after) return [];
  const known: Record<string, MissingField> = {
    "full name":       { key: "name",     label: "Full Name (First & Last)", icon: User },
    "date of birth":   { key: "dob",      label: "Date of Birth",            icon: Cake },
    "username":        { key: "username", label: "Username",                 icon: Tag },
    "profile picture": { key: "photo",    label: "Profile Picture",          icon: Camera },
  };
  return after
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .map((s) => known[s])
    .filter((f): f is MissingField => !!f);
}
