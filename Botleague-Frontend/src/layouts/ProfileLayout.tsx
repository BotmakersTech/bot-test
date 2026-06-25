import React, { useRef, useState } from "react";
import insta from "../assets/Instagram.png";
import youtube from "../assets/Youtube.png";
import { updateUsername } from "../feature/Profile/api/profile.api";



interface Props {
  children: React.ReactNode;

  avatarSrc?: string | null;
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick?: () => void;

  username?: string;
  onUsernameChange?: (val: string) => void;

  botleagueId?: string;
}

export default function ProfileLayout({
  children,
  avatarSrc,
  onAvatarChange,
  username,
  onUsernameChange,
  botleagueId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
console.log(username, "username in layout");
  const handleUsernameClick = async () => {
    // 👉 First click = enable editing
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // 👉 Second click = save
    try {
      setIsSaving(true);

      if (username) {
        await updateUsername(username); // ✅ correct API call
        console.log("Username updated:", username);
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Username update failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-root">
      <div className="profile-card">

        {/* LEFT PANEL */}
        <aside className="profile-aside">

          <div className="identity-card">

           

            {/* Avatar */}
            <div
  className="avatar-wrapper"
 
>
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder" />
              )}
            
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />

            {/* Username */}
            <div className="username-edit-wrapper">
              <input
                type="text"
                value={username || ""}
                placeholder="Username"
                onChange={(e) => onUsernameChange?.(e.target.value)}
                className="username-input"
                disabled={!isEditing}
              />

              <button
                className="edit-username-btn"
                onClick={handleUsernameClick}
                disabled={isSaving}
              >
                {isSaving ? "..." : isEditing ? "Save" : "✎"}
              </button>
            </div>

            {/* Botleague ID */}
            <p className="botleague-id">
              Botleague Id : {botleagueId || "N/A"}
            </p>

            {/* Status */}
            <span className="status-badge">
              <span className="status-dot" />
              Active
            </span>

            {/* Update Avatar */}
            <button
              className="update-pic-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Update Profile Pic
            </button>
          </div>

          {/* Social */}
          <div className="social-card">
            <div className="social-banner" />

            <div className="social-footer">
              <span className="follow-text">Follow us on</span>

              <a className="social-icon instagram">
                <img src={insta} alt="Instagram" />
              </a>

              <a className="social-icon youtube">
                <img src={youtube} alt="YouTube" />
              </a>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="profile-main">
          <h1 className="page-title">My Profile</h1>
          {children}
        </main>

      </div>
    </div>
  );
}