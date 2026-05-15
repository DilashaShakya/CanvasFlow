"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import type { AuthUser } from "@canvasflow/shared";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OwlLogo } from "@/components/owl-logo";

const registerSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const loginSchema = registerSchema.omit({ displayName: true });

type AuthFormProps = {
  mode: "login" | "register" | "guest";
  redirectTo?: string;
};

export function AuthForm({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const schema = mode === "register" ? registerSchema : mode === "login" ? loginSchema : z.object({ displayName: z.string().min(2) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: mode === "guest" ? { displayName: "" } : mode === "register" ? { displayName: "", email: "", password: "" } : { email: "", password: "" },
  });
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setError(null);
      if (mode === "register") {
        await api.register(values as z.infer<typeof registerSchema>);
        form.reset();
        setAccountCreated(true);
        window.setTimeout(() => router.push("/login"), 1600);
        return;
      }

      const response =
        mode === "login"
            ? await api.login(values as z.infer<typeof loginSchema>)
            : await api.guest(values as { displayName: string });

      setSession(response.token, response.user as AuthUser);
      router.push(redirectTo as never);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    }
  }

  return (
    <>
      <Card className="relative isolate w-full max-w-md border-4 border-[#4B2B19] bg-[#FFFFFF] p-8 shadow-[10px_10px_0_#6B3F24]">
        <OwlLogo className="mb-6 [&_p:first-of-type]:text-[#3A2115] [&_p:last-of-type]:text-[#8A6A43]" />
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#2A1810]">
          {mode === "register" ? "Create your CanvasFlow account" : mode === "login" ? "Welcome back" : "Join as a guest"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#7B4A2D]">
          {mode === "guest"
            ? "Start collaborating instantly with a temporary identity."
            : mode === "register"
              ? "Create an account, then log in to start building sketchbook boards."
              : "Authenticate to create boards, invite collaborators, and recover your sessions."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {"displayName" in form.getValues() && (
            <div>
              <Input
                placeholder="Display name"
                className="border-[#C8AA82] bg-[#FFFDF8] text-[#2A1810] placeholder:text-[#9A673D] focus:border-[#A2663A]"
                {...form.register("displayName" as never)}
              />
              {errors.displayName?.message ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.displayName.message}</p> : null}
            </div>
          )}
          {"email" in form.getValues() && (
            <div>
              <Input
                placeholder="Email"
                type="email"
                className="border-[#C8AA82] bg-[#FFFDF8] text-[#2A1810] placeholder:text-[#9A673D] focus:border-[#A2663A]"
                {...form.register("email" as never)}
              />
              {errors.email?.message ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.email.message}</p> : null}
            </div>
          )}
          {"password" in form.getValues() && (
            <div>
              <div className="relative">
                <Input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  className="border-[#C8AA82] bg-[#FFFDF8] pr-12 text-[#2A1810] placeholder:text-[#9A673D] focus:border-[#A2663A]"
                  {...form.register("password" as never)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#7B4A2D] transition hover:bg-[#F3D9AA] hover:text-[#2A1810]"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password?.message ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.password.message}</p> : null}
            </div>
          )}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting || accountCreated}>
            {accountCreated
              ? "Redirecting..."
              : form.formState.isSubmitting
                ? "Working..."
                : mode === "register"
                  ? "Create account"
                  : mode === "login"
                    ? "Log in"
                    : "Continue as guest"}
          </Button>
        </form>
      </Card>

      {accountCreated ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2A1810]/35 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border-4 border-[#4B2B19] bg-white p-6 text-center text-[#2A1810] shadow-[10px_10px_0_#6B3F24]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A2663A]">Success</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Account created</h2>
            <p className="mt-2 text-sm leading-6 text-[#7B4A2D]">Your CanvasFlow account is ready. Redirecting you to log in...</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
