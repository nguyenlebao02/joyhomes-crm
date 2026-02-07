import { Suspense } from "react";
import { ForgotPasswordFormComponent } from "@/components/auth/forgot-password-form-component";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordFormComponent />
    </Suspense>
  );
}
