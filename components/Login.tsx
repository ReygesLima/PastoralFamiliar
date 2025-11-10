
import React, { useState } from 'react';
import MemberForm from './MemberForm';
import { Member } from '../types';
import { LogoIcon } from './icons';

interface LoginProps {
    onLogin: (login: string, birthDate: string) => void;
    onRegister: (agentData: Member) => void;
    loginError: string | null;
    generalError: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, loginError, generalError }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [login, setLogin] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(login, birthDate);
    };
    
    const handleRegisterSave = (agentData: Member) => {
        onRegister(agentData);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-4xl">
                 <div className="flex flex-col items-center text-center mb-8">
                    <LogoIcon className="h-24 w-24 mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800">Pastoral Familiar</h1>
                    <p className="text-slate-600">Cadastro Paroquial</p>
                </div>
                
                 {generalError && (
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6 w-full max-w-md mx-auto">
                        <p className="text-red-700 font-semibold text-center">{generalError}</p>
                    </div>
                )}
                
                {isRegistering ? (
                    <div>
                        <MemberForm 
                            agentToEdit={null}
                            onSave={handleRegisterSave}
                            isFirstTimeRegister={true}
                        />
                        <div className="mt-6 text-center">
                            <button onClick={() => setIsRegistering(false)} className="font-medium text-blue-600 hover:text-blue-500">
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
                                    id="login" type="text" value={login} onChange={(e) => setLogin(e.target.value)} required
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                             <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">Data de Nascimento</label>
                                <input
                                    id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {loginError && <p className="text-sm text-red-600 text-center">{loginError}</p>}
                            <div>
                                <button type="submit" className="w-full px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Entrar
                                </button>
                            </div>
                        </form>
                         <div className="mt-6 text-center">
                            <button onClick={() => setIsRegistering(true)} className="font-medium text-blue-600 hover:text-blue-500">
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