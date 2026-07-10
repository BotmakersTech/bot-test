import React from "react";
import ProfileLayout from "../../../layouts/ProfileLayout";
import ProfileForm from "../components/ProfileForm";
import useProfile from "../hooks/useProfile";
import GuardianForm from "../../Eligibility/components/GuardianForm";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import "../../../styles/profile.css"

const ProfilePage: React.FC = () => {
  const p = useProfile();
  const { eligibility, reload: reloadEligibility } = useEligibility();

  const isMinor = eligibility ? (eligibility.age >= 0 && eligibility.age < 18) : false;

  return (
    <div>
      <ProfileLayout
        avatarSrc={p.profilePhotoUrl}
        rawAvatarValue={p.rawProfilePhotoValue}
        onAvatarChange={p.handleAvatarChange}
        onSelectAvatar={p.handleSelectAvatar}
        isAvatarModalOpen={p.isAvatarModalOpen}
        onOpenAvatarModal={p.openAvatarModal}
        onCloseAvatarModal={p.closeAvatarModal}
        username={p.username}
        onUsernameChange={p.setUsername}
        botleagueId={p.botleagueId}
      >
        
        {/* Competition Category Badge
        {eligibility?.category && (
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <CategoryBadge category={eligibility.category} size="md" showAgeRange />
            {!eligibility.canRegister && eligibility.blockReason && (
              <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 500 }}>
                ⚠ {eligibility.blockReason}
              </span>
            )}
          </div>
        )} */}

        <ProfileForm
          firstName={p.firstName}
          setFirstName={p.setFirstName}
          lastName={p.lastName}
          setLastName={p.setLastName}
          phone={p.phone}
          setPhone={p.setPhone}
          email={p.email}
          pendingEmailInput={p.pendingEmailInput}
          setPendingEmailInput={p.setPendingEmailInput}
          saveEmail={p.saveEmail}
          dateOfBirth={p.dateOfBirth}
          setDateOfBirth={p.setDateOfBirth}
          address={p.address}
          setAddress={p.setAddress}
          onSave={p.handleUpdate}
          isLoading={p.isLoading}
          saveSuccess={p.saveSuccess}
          errors={p.errors}
        />

        {/* Guardian Info — shown for users under 18 */}
        {(isMinor || (eligibility && eligibility.requiresGuardian)) && (
          <div className="mt-6">
            <GuardianForm onSaved={reloadEligibility} />
          </div>
        )}
      </ProfileLayout>
    </div>
  );
};

export default ProfilePage;
