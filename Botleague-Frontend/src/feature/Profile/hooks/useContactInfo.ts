import { useState, useCallback } from "react";
import { getProfile, updateEmail } from "../api/profile.api";

export default function useContactInfo() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingEmailInput, setPendingEmailInput] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadContactInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProfile();
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setPendingEmail(data.pendingEmail ?? null);
    } catch {
      setError("Failed to load contact info.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveEmail = useCallback(async () => {
    const trimmed = pendingEmailInput.trim();
    if (!trimmed) {
      setError("Email cannot be empty.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setError("This is already your current email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updateEmail(trimmed);
      setPendingEmail(trimmed);
      setIsEditingEmail(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to send verification email.");
    } finally {
      setIsLoading(false);
    }
  }, [pendingEmailInput, email]);

  return {
    phone,
    email,
    pendingEmail,
    pendingEmailInput,
    setPendingEmailInput,
    isEditingEmail,
    setIsEditingEmail,
    isLoading,
    error,
    success,
    loadContactInfo,
    handleSaveEmail,
  };
}