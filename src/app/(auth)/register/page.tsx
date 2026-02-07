import { Suspense } from "react";
import { RegisterFormComponent } from "@/components/auth/register-form-component";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterFormComponent />
    </Suspense>
  );
}
