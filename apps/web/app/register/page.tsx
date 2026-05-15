import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="space-y-6">
        <AuthForm mode="register" />
        <div className="flex items-center justify-center gap-3 text-sm text-[#C8AA82]">
          <span>Want a quick demo?</span>
          <Link href="/dashboard">
            <Button variant="secondary">Try guest mode</Button>
          </Link>
        </div>
        <div className="text-center text-sm text-[#C8AA82]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#F8E8C8] hover:text-[#D8943B]">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
