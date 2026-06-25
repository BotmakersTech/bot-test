import { useState, type SetStateAction } from "react";

import Modal from "../../../../shared/components/Modal";
import InputField from "../../../../shared/components/InputField";
import PrimaryBtn from "../../../../shared/components/PrimaryBtn";

import useTeamMembership from "../hooks/useTeamMembership";

interface InviteMemberModalProps {
  onClose: () => void;
  teamCode: string;
}

const TEAM_ROLES = [
  "MEMBER",
];

export default function InviteMemberModal({
  onClose,
  teamCode,
}: InviteMemberModalProps) {

  const {
    inviteMember,
    inviteLoading,
  } = useTeamMembership(teamCode);

  const [botleagueId, setBotleagueId] =
    useState("");

  const [role, setRole] =
    useState("MEMBER");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // =========================================
  // SEND INVITE
  // =========================================

  const handleSendInvite = async () => {

    try {

      setErrorMessage("");

      setSuccessMessage("");

      if (!botleagueId.trim()) {

        setErrorMessage(
          "BotLeague ID is required"
        );

        return;
      }

      // =====================================
      // API CALL
      // =====================================

      await inviteMember(
        
        botleagueId,
    
        
      );

      // =====================================
      // SUCCESS
      // =====================================

      setSuccessMessage(
        `Invite sent to ${botleagueId}`
      );

      setTimeout(() => {

        onClose();

      }, 1800);

    } catch (err: any) {

      setErrorMessage(
        err?.message ||
        "Failed to send invite"
      );
    }
  };

  return (

    <Modal
      title="Invite Team Member"
      onClose={onClose}
    >

      {/* =====================================
          SUCCESS STATE
      ===================================== */}

      {successMessage && (

        <div
          style={{
            background:
              "rgba(74, 222, 128, 0.12)",

            border:
              "1px solid rgba(74, 222, 128, 0.35)",

            color: "#4ade80",

            padding: "14px 16px",

            borderRadius: "14px",

            marginBottom: "18px",

            fontSize: "0.95rem",

            fontWeight: 600,
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {/* =====================================
          ERROR STATE
      ===================================== */}

      {errorMessage && (

        <div
          style={{
            background:
              "rgba(239, 68, 68, 0.12)",

            border:
              "1px solid rgba(239, 68, 68, 0.3)",

            color: "#f87171",

            padding: "14px 16px",

            borderRadius: "14px",

            marginBottom: "18px",

            fontSize: "0.92rem",

            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* =====================================
          BOTLEAGUE ID
      ===================================== */}

      <InputField
        label="BotLeague User ID"
        placeholder="BLU2600001"
        value={botleagueId}
        onChange={(e: { target: { value: SetStateAction<string>; }; }) =>
          setBotleagueId(e.target.value)
        }
      />

      {/* =====================================
          ROLE SELECT
      ===================================== */}

      <div
        style={{
          marginBottom: "22px",
        }}
      >

        <label
          style={{
            display: "block",

            color: "#9ca3af",

            fontSize: "0.78rem",

            fontWeight: 700,

            marginBottom: "8px",

            letterSpacing: "0.08em",

            textTransform: "uppercase",
          }}
        >
          Team Role
        </label>

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          style={{
            width: "100%",

            background:
              "rgba(15, 23, 42, 0.75)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius: "14px",

            padding: "14px 16px",

            color: "#fff",

            fontSize: "0.95rem",

            outline: "none",

            transition: "0.2s ease",
          }}
        >

          {TEAM_ROLES.map((teamRole) => (

            <option
              key={teamRole}
              value={teamRole}
              style={{
                background: "#111827",
              }}
            >
              {teamRole}
            </option>
          ))}
        </select>
      </div>

      {/* =====================================
          ACTION BUTTON
      ===================================== */}

      <PrimaryBtn
        onClick={handleSendInvite}
        disabled={
          !botleagueId.trim() ||
          inviteLoading
        }
      >

        {inviteLoading
          ? "Sending Invite..."
          : "Send Invite"}

      </PrimaryBtn>

    </Modal>
  );
}