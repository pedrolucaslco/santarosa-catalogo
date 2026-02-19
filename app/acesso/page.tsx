'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Acesso() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senha })
      });

      const data = await res.json();

      if (data.valid) {
        // Seta cookie
        document.cookie = "catalog_auth=authorized; path=/";
        router.push('/'); // volta para a rota base
      } else {
        setErro('Senha incorreta');
        setLoading(false);
      }
    } catch {
      setErro('Erro ao validar a senha');
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Acesso ao Catálogo</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="password"
          placeholder="Digite a senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="border p-2 rounded"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? 'Validando...' : 'Entrar'}
        </button>
      </form>
      {erro && <p className="text-red-600 mt-2">{erro}</p>}
    </div>
  );
}
