import React, { useState } from "react";
import { updateUsername } from "../feature/Profile/api/profile.api";
import ProfileHeader from "../feature/Profile/components/ProfileHeader";
import AvatarPickerModal from "../feature/Profile/components/AvatarPickerModal";
import airplaneDecoration from "../assets/Auth/flight.svg";
import "../styles/profile.css";

interface Props {
  children: React.ReactNode;
  avatarSrc?: string | null;
  rawAvatarValue?: string | null;
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSelectAvatar?: (avatarKey: string) => Promise<void>;
  isAvatarModalOpen?: boolean;
  onOpenAvatarModal?: () => void;
  onCloseAvatarModal?: () => void;
  username?: string;
  onUsernameChange?: (val: string) => void;
  botleagueId?: string;
}

export default function ProfileLayout({
  children,
  avatarSrc,
  rawAvatarValue,
  onAvatarChange,
  onSelectAvatar,
  isAvatarModalOpen,
  onOpenAvatarModal,
  onCloseAvatarModal,
  username,
  onUsernameChange,
  botleagueId,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleUsernameClick = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsSaving(true);
      if (username) {
        await updateUsername(username);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Username update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page-shell">
      <img src={airplaneDecoration} alt="" aria-hidden="true" className="profile-bg-plane profile-bg-plane-a" />
      <img src={airplaneDecoration} alt="" aria-hidden="true" className="profile-bg-plane profile-bg-plane-b" />
      <img src={airplaneDecoration} alt="" aria-hidden="true" className="profile-bg-plane profile-bg-plane-c" />

      <div className="profile-outline-star profile-page-star-a" aria-hidden="true" />
      <div className="profile-outline-star profile-page-star-b" aria-hidden="true" />

      <div className="profile-content-wrap">
        <h1 className="profile-page-title">Edit Profile</h1>

        <ProfileHeader
          avatarSrc={avatarSrc}
          onOpenAvatarPicker={() => onOpenAvatarModal?.()}
          username={username ?? ""}
          onUsernameChange={(val) => onUsernameChange?.(val)}
          isEditingUsername={isEditing}
          isSavingUsername={isSaving}
          onUsernameEditClick={handleUsernameClick}
          botleagueId={botleagueId ?? ""}
        />

        {isAvatarModalOpen && onAvatarChange && onSelectAvatar && (
          <AvatarPickerModal
            currentValue={rawAvatarValue}
            onClose={() => onCloseAvatarModal?.()}
            onSelectAvatar={onSelectAvatar}
            onUploadFile={onAvatarChange}
          />
        )}

        {children}
      </div>
    </div>
  );
}
