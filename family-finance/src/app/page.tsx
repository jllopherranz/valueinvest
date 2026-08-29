import Link from "next/link";
import { ArrowRight, LineChart, PiggyBank, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: Wallet, title: "Control total", desc: "Ingresos, gastos y reparto por persona en un solo lugar." },
  { icon: LineChart, title: "Patrimonio en vivo", desc: "Evolución del patrimonio neto y del ahorro mes a mes." },
  { icon: PiggyBank, title: "Objetivos claros", desc: "Fondo de emergencia, reformas, viajes e inversión." },
  { icon: ShieldCheck, title: "Privado y seguro", desc: "Datos cifrados, autenticación y copias automáticas." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <span className="text-lg font-bold">Family Finance</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="container flex flex-col items-center py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Vuestras finanzas familiares, con criterio profesional
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Controlad gastos, reparto proporcional, hipoteca y objetivos. Tomad decisiones
          financieras basadas en datos, no en intuición.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Ver dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Crear cuenta</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6">
            <f.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
