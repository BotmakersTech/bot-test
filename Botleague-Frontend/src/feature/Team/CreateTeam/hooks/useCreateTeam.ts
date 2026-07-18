// hooks/useCreateTeam.ts

import { useState } from "react";

import {
  createTeam,
  type CreateTeamPayload,
} from "../api/createTeam.api";

import {
  uploadTeamLogo,
} from "../api/uploadTeamLogo.api";

import { useNavigate } from "react-router-dom";
import { useMinimalProfileComplete } from "../../../../shared/hooks/useProfileComplete";

// ======================================================
// HOOK
// ======================================================

export default function useCreateTeam() {

  const navigate = useNavigate();

  const { isComplete, missingFields } = useMinimalProfileComplete();

  // Controls the "complete your profile" gate modal for the create-team action
  const [showProfileGate, setShowProfileGate] = useState(false);

  // ======================================================
  // FORM STATE
  // ======================================================

  const [form, setForm] =
    useState<CreateTeamPayload>({

      teamName: "",

      description: "",

      institutionName: "",

      city: "",

      state: "",

      country: "India",
    });

  // ======================================================
  // LOGO STATE
  // ======================================================

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState("");

  // ======================================================
  // UI STATE
  // ======================================================

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setForm((prev) => ({

      ...prev,

      [e.target.name]: e.target.value,
    }));
  };

  // Same update as handleChange, but for callback-style inputs (e.g.
  // LocationSelects) that hand back a plain value instead of an event.
  const setField = (
    name: keyof CreateTeamPayload,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // LOGO UPLOAD
  // ======================================================

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setLogoFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setLogoPreview(previewUrl);
  };

  // ======================================================
  // VALIDATION
  // ======================================================

  const validateForm = () => {

    if (!form.teamName.trim()) {

      throw new Error(
        "Team name is required"
      );
    }

    if (!form.institutionName?.trim()) {

      throw new Error(
        "Institution name is required"
      );
    }
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async () => {

    // Minimum profile requirements gate — username + DOB must be set
    // before a team can be created (mirrors the join-team gate).
    if (!isComplete) {
      setShowProfileGate(true);
      return;
    }

    try {

      setIsLoading(true);

      setError(null);

      // validate
      validateForm();

      // =====================================
      // STEP 1 → CREATE TEAM
      // =====================================

      const createdTeam =
        await createTeam(form);

      console.log(
        "Created Team:",
        createdTeam.id
      );

      // =====================================
      // STEP 2 → UPLOAD LOGO
      // =====================================

      if (logoFile) {

        await uploadTeamLogo(

          createdTeam.id,

          logoFile
        );
      }

      // =====================================
      // SUCCESS
      // =====================================

      navigate("/my-team");

    } catch (err: any) {

      console.error(err);

      setError(

        err?.message ||

        err?.response?.data?.message ||

        "Failed to create team"
      );

    } finally {

      setIsLoading(false);
    }
  };

  // ======================================================
  // RETURN
  // ======================================================

  return {

    // form
    form,

    // logo
    logoFile,
    logoPreview,

    // ui
    isLoading,
    error,

    // actions
    handleChange,
    setField,
    handleLogoUpload,
    handleSubmit,

    // profile gate
    showProfileGate,
    missingFields,
    closeProfileGate: () => setShowProfileGate(false),
  };
}