"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { AuthUser } from "@canvasflow/shared";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OwlLogo } from "@/components/owl-logo";

const registerSchema = z.object({
  displayName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
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

  const schema = mode === "register" ? registerSchema : mode === "login" ? loginSchema : z.object({ displayName: z.string().min(2) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: mode === "guest" ? { displayName: "" } : mode === "register" ? { displayName: "", email: "", password: "" } : { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setError(null);
      const response =
        mode === "register"
          ? await api.register(values as z.infer<typeof registerSchema>)
          : mode === "login"
            ? await api.login(values as z.infer<typeof loginSchema>)
            : await api.guest(values as { displayName: string });

      setSession(response.token, response.user as AuthUser);
      router.push(redirectTo as never);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <OwlLogo className="mb-6" />
      <h1 className="text-2xl font-semibold text-[#FFF5DF]">
        {mode === "register" ? "Create your CanvasFlow account" : mode === "login" ? "Welcome back" : "Join as a guest"}
      </h1>
      <p className="mt-2 text-sm text-[#C8AA82]">
        {mode === "guest"
          ? "Start collaborating instantly with a temporary identity."
          : "Authenticate to create boards, invite collaborators, and recover your sessions."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {"displayName" in form.getValues() && <Input placeholder="Display name" {...form.register("displayName" as never)} />}
        {"email" in form.getValues() && <Input placeholder="Email" type="email" {...form.register("email" as never)} />}
        {"password" in form.getValues() && <Input placeholder="Password" type="password" {...form.register("password" as never)} />}

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Working..." : mode === "register" ? "Create account" : mode === "login" ? "Log in" : "Continue as guest"}
        </Button>
      </form>
    </Card>
  );
}
