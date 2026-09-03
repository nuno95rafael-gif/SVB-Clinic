import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo-svb-icon.png"
            alt="SVB"
            width={64}
            height={64}
            className="mx-auto mb-3 h-16 w-16"
            priority
          />
          <h1 className="font-semibold text-xl">SVB Clinic</h1>
          <p className="text-sm text-foreground-soft mt-1">
            Entrar na plataforma de gestão clínica
          </p>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-xs text-foreground-faint">
          Acesso reservado a administradores e profissionais da clínica.{" "}
          <Link href="/recuperar-password" className="text-accent-ink underline">
            Esqueceu a password?
          </Link>
        </p>
      </div>
    </div>
  );
}
