import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import "../../../styles/login.css";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Recover Access"
        subtitle="Re-enter the Arena and secure your account"
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthLayout>
  );
}