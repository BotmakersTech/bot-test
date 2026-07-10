import { Camera, Pencil, User } from "lucide-react";

interface ProfileHeaderProps {
  avatarSrc?: string | null;
  onOpenAvatarPicker: () => void;
  username: string;
  onUsernameChange: (value: string) => void;
  isEditingUsername: boolean;
  isSavingUsername?: boolean;
  onUsernameEditClick: () => void;
  botleagueId: string;
  recruitmentStatus?: string;
}

export default function ProfileHeader({
  avatarSrc,
  onOpenAvatarPicker,
  username,
  onUsernameChange,
  isEditingUsername,
  isSavingUsername = false,
  onUsernameEditClick,
  botleagueId,
  recruitmentStatus = "Active",
}: ProfileHeaderProps) {
  const displayName = username?.trim() || "JETT";

  return (
    <section className="profile-hero-card">
      <div className="profile-avatar-panel">
        <button
          type="button"
          className="profile-avatar-shell profile-avatar-shell-btn"
          onClick={onOpenAvatarPicker}
          title="Change avatar"
          aria-label="Change avatar"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-empty">
              <User size={82} strokeWidth={1.3} />
            </div>
          )}
        </button>

        <button
          type="button"
          className="profile-camera-btn"
          title="Change avatar"
          aria-label="Change avatar"
          onClick={onOpenAvatarPicker}
        >
          <Camera size={21} strokeWidth={2.2} />
        </button>
      </div>

      <div className="profile-identity-panel">
        <div className="profile-outline-star profile-outline-star-a" aria-hidden="true" />
        <div className="profile-outline-star profile-outline-star-b" aria-hidden="true" />

        <div className="profile-name-row">
          {isEditingUsername ? (
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Username"
              autoFocus
              className="profile-name-input"
            />
          ) : (
            <h1 className="profile-name">{displayName}</h1>
          )}

          <span className="profile-status-pill">
            <span />
            {recruitmentStatus}
          </span>

          <button
            type="button"
            className="profile-pencil-btn"
            onClick={onUsernameEditClick}
            disabled={isSavingUsername}
            title={isEditingUsername ? "Save username" : "Edit username"}
            aria-label={isEditingUsername ? "Save username" : "Edit username"}
          >
            {isSavingUsername ? "..." : isEditingUsername ? "Save" : <Pencil size={22} fill="currentColor" />}
          </button>
        </div>

        <div className="profile-id-block">
          <p>BOTLEAGUE ID</p>
          <strong>{botleagueId || "1234567"}</strong>
        </div>

        <div className="profile-actions">
          <button type="button" className="profile-action-primary" onClick={onOpenAvatarPicker}>
            Change Avatar
          </button>
          <button type="button" className="profile-action-outline" onClick={onUsernameEditClick}>
            Edit Profile
          </button>
        </div>
      </div>
    </section>
  );
}
