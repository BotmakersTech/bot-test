import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { verifyEmail } from "../api/profile.api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

console.log("token from url:", token);

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Invalid verification link");
      setIsLoading(false);
      return;
    }

    const handleVerifyEmail = async () => {
      try {
        setIsLoading(true);

        const res = await verifyEmail(token);

        console.log("Email verification success:", res);

        setSuccess(true);

        // Redirect back to the profile page — this link is only ever sent
        // from the "change email" flow on an already-logged-in profile, so
        // there's nothing to log in to. If the session in this tab isn't
        // valid (e.g. link opened on a different device), ProtectedRoute
        // itself falls back to /login.
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 2000);

      } catch (err: unknown) {
        const isResponseError =
          typeof err === "object" &&
          err !== null &&
          "response" in err;

        const responseData = isResponseError
          ? (err as {
              response?: {
                data?: {
                  message?: string;
                  error?: string;
                };
              };
            }).response?.data
          : undefined;

        console.log("Email verification error:", responseData);

        setError(
          responseData?.message ||
          responseData?.error ||
          "Email verification failed"
        );

      } finally {
        setIsLoading(false);
      }
    };

    handleVerifyEmail();
  }, [navigate, searchParams]);

  // 🔥 UI STATES

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Verifying your email...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-500">
          Verification Failed
        </h1>

        <p className="text-gray-600">{error}</p>

        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-green-600">
          Email Verified Successfully
        </h1>

        <p className="text-gray-600">
          Redirecting to your profile...
        </p>
      </div>
    );
  }

  return null;
}