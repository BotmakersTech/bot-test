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
 * Narrower gate used specifically for create/join-team actions — only
 * username and date of birth are strictly required to form or join a team,
 * unlike the full profile (name + photo too) checked by useProfileComplete.
 */
export function useMinimalProfileComplete(): {
  isComplete:    boolean;
  missingFields: MissingField[];
} {
  const user = useSelector((s: RootState) => s.auth.user);

  const missingFields: MissingField[] = [];

  if (!user?.userName?.trim()) {
    missingFields.push({ key: "username", label: "Username",       icon: Tag });
  }
  if (!user?.dateOfBirth) {
    missingFields.push({ key: "dob",      label: "Date of Birth",  icon: Cake });
  }

  return {
    isComplete:    missingFields.length === 0,
    missingFields,
  };
}
