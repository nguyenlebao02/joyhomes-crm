import { Suspense } from "react";
import { LoginFormComponent } from "@/components/auth/login-form-component";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormComponent />
    </Suspense>
  );
}
