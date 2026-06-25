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

// ======================================================
// HOOK
// ======================================================

export default function useCreateTeam() {

  const navigate = useNavigate();

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

      country: "",
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
    handleLogoUpload,
    handleSubmit,
  };
}