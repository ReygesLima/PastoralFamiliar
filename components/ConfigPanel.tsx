import React, { useState } from 'react';

interface ConfigPanelProps {
    errorMessage: string | null;
    onSave: (url: string, key: string) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ errorMessage, onSave }) => {
    const [url, setUrl] = useState(localStorage.getItem('supabaseUrl') || '');
    const [key, setKey] = useState(localStorage.getItem('supabaseKey') || '');
    const [showKey, setShowKey] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url && key) {
            onSave(url, key);
        }
    };

    const isTableError = errorMessage?.includes('relation') || errorMessage?.includes('Could not find the table');

    return (
        <div className="flex flex-col justify-center items-center py-10">
            <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 text-center">Configuração de Acesso</h2>
                <p className="text-slate-500 text-center mt-2 mb-6">
                    Não foi possível conectar ao banco de dados. Isso geralmente ocorre por uma chave de API inválida ou por falta de permissões (RLS).
                </p>

                {isTableError && (
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-6">
                        <h4 className="font-bold text-amber-800">Dica: Tabela não encontrada</h4>
                        <p className="text-amber-700 text-sm mt-1">
                            O erro indica que a tabela <code className="bg-amber-100 p-1 rounded text-xs font-mono">membros_pastoral</code> não foi encontrada. 
                            Verifique no seu painel do Supabase (em "Table Editor") se a tabela foi criada e se o nome corresponde <span className="font-bold">exatamente</span>.
                        </p>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
                        <p className="text-red-700 font-semibold">Detalhes do Erro:</p>
                        <p className="text-red-600 text-sm mt-1 font-mono">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="supabaseUrl" className="block text-sm font-medium text-slate-700 mb-1">
                            Supabase URL
                        </label>
                        <input
                            id="supabaseUrl"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://exemplo.supabase.co"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="supabaseKey" className="block text-sm font-medium text-slate-700 mb-1">
                            Supabase Anon Key
                        </label>
                         <div className="relative">
                            <input
                                id="supabaseKey"
                                type={showKey ? 'text' : 'password'}
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="eyJhbGciOiJI..."
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
                                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                            >
                                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                     <p className="text-xs text-slate-500">
                        Você pode encontrar essas informações no seu painel do Supabase, em <span className="font-semibold">Project Settings &gt; API</span>.
                        Certifique-se também de que a <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Row Level Security (RLS)</a> está habilitada e configurada para permitir leitura na tabela <code className="bg-slate-100 p-1 rounded text-xs">membros_pastoral</code>.
                    </p>

                    <button
                        type="submit"
                        disabled={!url || !key}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Salvar e Tentar Novamente
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConfigPanel;