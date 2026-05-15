import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFFDF8] px-6 text-[#2A1810]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D9CBB8_1.15px,transparent_1.15px)] bg-[size:22px_22px]" />
      <div className="absolute left-12 top-16 h-24 w-24 rotate-[-12deg] rounded-[2rem] bg-[#F4C56A]/50 blur-sm" />
      <div className="absolute bottom-16 right-12 h-32 w-32 rounded-full bg-[#E58A3A]/20 blur-sm" />
      <div className="relative z-10 space-y-6">
        <AuthForm mode="login" />
        <div className="relative text-center text-sm font-medium text-[#6B3F24]">
          Need an account?{" "}
          <Link href="/register" className="font-bold text-[#8A552F] hover:text-[#D8943B]">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
