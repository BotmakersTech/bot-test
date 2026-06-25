

import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";


export default function LoginPage() {
  

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome Back!"
        subtitle="Enter the Arena"
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}