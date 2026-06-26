import React from "react";
import ProfileLayout from "../../../layouts/ProfileLayout";
import ProfileForm from "../components/ProfileForm";
import useProfile from "../hooks/useProfile";
import CategoryBadge from "../../../shared/components/CategoryBadge";
import GuardianForm from "../../Eligibility/components/GuardianForm";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import ShareButton from "../../../shared/components/ShareButton";
import "../../../styles/profile.css";

const ProfilePage: React.FC = () => {
  const p = useProfile();
  const { eligibility, reload: reloadEligibility } = useEligibility();

  const isMinor = eligibility ? (eligibility.age >= 0 && eligibility.age < 18) : false;

  return (
    <div>
      <ProfileLayout
        avatarSrc={p.profilePhotoUrl}
        onAvatarChange={p.handleAvatarChange}
        username={p.username}
        onUsernameChange={p.setUsername}
        botleagueId={p.botleagueId}
      >
        {/* Share public profile link */}
        {p.botleagueId && (
          <div style={{ marginBottom: "12px" }}>
            <ShareButton
              url={`${window.location.origin}/user/${p.botleagueId}`}
              label="Share Profile"
              size="sm"
            />
          </div>
        )}

        {/* Competition Category Badge */}
        {eligibility?.category && (
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <CategoryBadge category={eligibility.category} size="md" showAgeRange />
            {!eligibility.canRegister && eligibility.blockReason && (
              <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 500 }}>
                ⚠ {eligibility.blockReason}
              </span>
            )}
          </div>
        )}

        <ProfileForm
          firstName={p.firstName}
          setFirstName={p.setFirstName}

          lastName={p.lastName}
          setLastName={p.setLastName}

          teamName={p.teamName}

          dateOfBirth={p.dateOfBirth}
          setDateOfBirth={p.setDateOfBirth}

          city={p.city || ""}
          setCity={p.setCity}

          state={p.state || ""}
          setState={p.setState}

          country={p.country || ""}
          setCountry={p.setCountry}

          address={p.address}
          setAddress={p.setAddress}

          onSave={p.handleUpdate}
          isLoading={p.isLoading}

          errors={p.errors}
          clearError={p.clearError}
        />

        {/* Guardian Info — shown for users under 18 */}
        {(isMinor || (eligibility && eligibility.requiresGuardian)) && (
          <div style={{ marginTop: "24px" }}>
            <GuardianForm onSaved={reloadEligibility} />
          </div>
        )}
      </ProfileLayout>
    </div>
  );
};

export default ProfilePage;