import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="space-y-6">
        <AuthForm mode="login" />
        <div className="text-center text-sm text-[#C8AA82]">
          Need an account?{" "}
          <Link href="/register" className="text-[#F8E8C8] hover:text-[#D8943B]">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
