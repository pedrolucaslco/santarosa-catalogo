'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Acesso() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha === 'SENHA_DO_CLIENTE') {
      document.cookie = 'catalog_auth=authorized; path=/';
      router.refresh(); // atualiza a página
    } else {
      setErro('Senha incorreta');
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
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Entrar
        </button>
      </form>
      {erro && <p className="text-red-600 mt-2">{erro}</p>}
    </div>
  );
}
