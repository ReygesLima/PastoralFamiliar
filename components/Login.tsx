import React, { useState, useEffect, useRef } from 'react';
import MemberForm from './MemberForm';
import { Member } from '../types';
import { LogoIcon, DownloadIcon } from './icons';
import { useNotification } from '../contexts/NotificationContext';

interface LoginProps {
    onLogin: (login: string, birthDate: string) => void;
    onRegister: (agentData: Member) => Promise<boolean>;
    loading: boolean;
    errorLog: string[];
    onDownloadLog: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, loading, errorLog, onDownloadLog }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [login, setLogin] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const { addNotification } = useNotification();

    const loginInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isRegistering) {
            loginInputRef.current?.focus();
        }
    }, [isRegistering]);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        onLogin(login, birthDate);
    };

    const handleShowLogDownload = () => {
        addNotification({
            message: "Clique no botão de download para obter o log de erros e enviá-lo para o suporte técnico.",
            type: 'error',
            duration: 8000, 
        });
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-4xl">
                 <div className="flex flex-col items-center text-center mb-8">
                    <LogoIcon className="h-24 w-24 mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800">Pastoral Familiar</h1>
                    <p className="text-slate-600">Cadastro Paroquial</p>
                </div>
                
                {isRegistering ? (
                    <div>
                        <MemberForm 
                            agentToEdit={null}
                            onSave={onRegister}
                            isFirstTimeRegister={true}
                        />
                        <div className="mt-6 text-center">
                            <button onClick={() => setIsRegistering(false)} disabled={loading} className="font-medium text-blue-600 hover:text-blue-500 disabled:text-slate-400 disabled:cursor-not-allowed">
                                Já sou cadastrado
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Acessar meu Cadastro</h2>
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="login" className="block text-sm font-medium text-slate-700">Login</label>
                                <input
                                    ref={loginInputRef}
                                    id="login" type="text" value={login} onChange={(e) => setLogin(e.target.value)} required
                                    disabled={loading}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100"
                                />
                            </div>
                             <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">Data de Nascimento</label>
                                <input
                                    id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required
                                    disabled={loading}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-slate-100"
                                />
                            </div>
                           
                            <div>
                                <button type="submit" disabled={loading || !login || !birthDate} className="w-full px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-wait flex justify-center items-center">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Entrando...
                                        </>
                                    ) : 'Entrar'}
                                </button>
                            </div>
                             {errorLog.length > 0 && (
                                <div className="text-center pt-4 border-t border-slate-200">
                                    <p className="text-sm text-slate-500">Problemas para acessar?</p>
                                    <button
                                        type="button"
                                        onClick={onDownloadLog}
                                        className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-800 underline focus:outline-none flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                        Baixar log do erro para análise
                                    </button>
                                </div>
                            )}
                        </form>
                         <div className="mt-6 text-center">
                            <button onClick={() => setIsRegistering(true)} disabled={loading} className="font-medium text-blue-600 hover:text-blue-500 disabled:text-slate-400 disabled:cursor-not-allowed">
                                Fazer meu primeiro cadastro
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
