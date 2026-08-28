'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";

function AcessoForm() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLiquida = searchParams.get('from') === 'liquida';

  useEffect(() => {
    if (fromLiquida) {
      fetch('/api/logout', { method: 'POST' });
    }
  }, [fromLiquida]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const apiEndpoint = fromLiquida ? '/api/validate-liquida-password' : '/api/validate-password';
      const cookieName = fromLiquida ? 'liquida_auth' : 'catalog_auth';
      const redirectPath = fromLiquida ? '/liquida' : '/';

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senha })
      });

      const data = await res.json();

      if (data.valid) {
        document.cookie = `${cookieName}=authorized; path=/; maxAge=3600`;
        router.push(redirectPath);
      } else {
        setErro('Senha incorreta');
        setLoading(false);
      }
    } catch {
      setErro('Erro ao validar a senha');
      setLoading(false);
    }
  };

  const title = fromLiquida ? 'Acesso à Liquida' : 'Acesso ao catálogo';
  const description = fromLiquida
    ? 'Entre com a senha para acessar a Liquida Santa Rosa.'
    : 'Entre com a senha para visualizar a seleção especial da Santa Rosa.';

  return (
    <main className="min-h-screen bg-[#f8f3f1] text-stone-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex justify-center">
              <Image
                src="/logo-h.svg"
                alt="Santa Rosa Acessórios"
                width={220}
                height={72}
                priority
                className="h-auto w-48"
              />
            </div>

            <div className="rounded-lg border border-red-950/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7 space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-950 text-white">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-semibold tracking-normal text-red-950">
                  {title}
                </h1>
                <p className="text-sm leading-6 text-stone-600">
                  {description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="senha-catalogo" className="text-sm font-medium text-stone-700">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      id="senha-catalogo"
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Digite a senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-12 border-stone-300 bg-stone-50 pr-12 text-base focus-visible:ring-red-950"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setMostrarSenha((current) => !current)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-800"
                      disabled={loading}
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {erro && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                    {erro}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full bg-red-950 text-white hover:bg-red-900"
                  disabled={loading}
                >
                  {loading ? 'Validando...' : 'Entrar'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-stone-500">
              Santa Rosa Acessórios
            </p>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <Image
            src="/banner-liquida-natal-26.png"
            alt="Catálogo Santa Rosa"
            fill
            priority
            className="object-contain"
          />
          <div className="absolute inset-0 bg-red-950/15" />
          <div className="absolute bottom-8 left-8 right-8 max-w-md text-red-900">
            <p className="text-sm font-medium uppercase tracking-[0.24em]">
              Catálogo Digital
            </p>
            <p className="mt-3 text-3xl font-semibold leading-tight">
              Semijoias banhadas a ouro 18K, hipoalergênicas e com garantia.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Acesso() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f3f1] flex items-center justify-center">Carregando...</div>}>
      <AcessoForm />
    </Suspense>
  );
}
