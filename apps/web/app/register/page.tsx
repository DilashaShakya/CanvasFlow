import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#FFFDF8] px-6 text-[#2A1810]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D9CBB8_1.15px,transparent_1.15px)] bg-[size:22px_22px]" />
      <div className="absolute left-10 top-14 h-24 w-24 rotate-[-12deg] rounded-[2rem] bg-[#F4C56A]/50 blur-sm" />
      <div className="absolute bottom-16 right-12 h-32 w-32 rounded-full bg-[#E58A3A]/20 blur-sm" />
      <div className="relative z-10 space-y-6">
        <AuthForm mode="register" />
        <div className="flex items-center justify-center gap-3 text-sm font-medium text-[#6B3F24]">
          <span>Want a quick demo?</span>
          <Link href="/dashboard">
            <Button variant="secondary" className="border-[#4B2B19]/25 bg-white text-[#4B2B19] hover:bg-[#FFF1D0]">
              Try guest mode
            </Button>
          </Link>
        </div>
        <div className="text-center text-sm font-medium text-[#6B3F24]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#8A552F] hover:text-[#D8943B]">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
