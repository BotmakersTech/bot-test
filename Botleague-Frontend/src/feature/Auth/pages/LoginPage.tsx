

import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";


export default function LoginPage() {
  

  return (
    <AuthLayout variant="login">
      <AuthCard title="Welcome Back!" variant="login">
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}