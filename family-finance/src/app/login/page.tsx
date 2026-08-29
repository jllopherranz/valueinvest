"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/validations";

/**
 * Pantalla de acceso. Integra con Supabase Auth (email/contraseña + OAuth
 * Google). La llamada real a `supabase.auth.signInWithPassword` /
 * `signInWithOAuth` se conecta cuando hay credenciales configuradas.
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    } catch {
      setError("No se pudo conectar con el servidor de autenticación.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acceder</CardTitle>
          <CardDescription>Entra en Family Finance con tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <div className="relative text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">o</span>
          </div>

          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            Continuar con Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline">
              Ver demo del dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
