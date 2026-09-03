import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { SpineIllustration } from "./spine-illustration";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
        style={{
          background:
            "linear-gradient(160deg, #071f3d 0%, #0d5ba8 55%, #3a9bdb 100%)",
        }}
      >
        <div className="absolute inset-0">
          <SpineIllustration />
        </div>

        <div className="relative z-10 flex items-center gap-2.5 px-12 pt-10">
          <Image
            src="/logo-svb-icon.png"
            alt="SVB"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md"
            priority
          />
          <span className="font-semibold text-white">SVB Clinic</span>
        </div>

        <div className="relative z-10 px-12 pb-14">
          <h2 className="max-w-sm font-semibold text-[28px] leading-tight text-white">
            Cuidado clínico com o registo certo em cada consulta.
          </h2>
          <p className="mt-3 max-w-sm text-[14.5px] text-white/75">
            Agenda, história clínica, mapa corporal e evolução da dor — tudo
            num só lugar, pensado para quiropraxia.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <Image
              src="/logo-svb-icon.png"
              alt="SVB"
              width={56}
              height={56}
              className="mx-auto mb-3 h-14 w-14 lg:hidden"
              priority
            />
            <h1 className="font-semibold text-xl">Entrar</h1>
            <p className="text-sm text-foreground-soft mt-1">
              Aceda à plataforma de gestão da SVB Clinic.
            </p>
          </div>
          <LoginForm next={next} />
          <p className="mt-6 text-center text-xs text-foreground-faint lg:text-left">
            Acesso reservado a administradores e profissionais da clínica.{" "}
            <Link href="/recuperar-password" className="text-accent-ink underline">
              Esqueceu a password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
