import { Suspense } from "react";
import { ResetPasswordFormComponent } from "@/components/auth/reset-password-form-component";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormComponent />
    </Suspense>
  );
}
