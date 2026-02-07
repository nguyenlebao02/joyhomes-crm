import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerFormComponent } from "@/components/customers/customer-form-component";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm khách hàng mới</h1>
          <p className="text-muted-foreground">
            Nhập thông tin khách hàng để thêm vào hệ thống
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CustomerFormComponent mode="create" />
      </Suspense>
    </div>
  );
}
