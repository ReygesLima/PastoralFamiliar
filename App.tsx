import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import Reports from './components/Reports';
import About from './components/About';
import ConfigPanel from './components/ConfigPanel';
import Login from './components/Login';
import { Member, View, Role } from './types';
import { supabase } from './lib/supabaseClient';

function App() {
    const [agents, setAgents] = useState<Member[]>([]);
    const [currentView, setCurrentView] = useState<View>('LIST');
    const [agentToEdit, setAgentToEdit] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [loggedInAgent, setLoggedInAgent] = useState<Member | null>(null);
    
    const getErrorMessage = (error: unknown): string => {
        if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
            return (error as any).message;
        }
        if (typeof error === 'string') {
            return error;
        }
        try {
            const stringified = JSON.stringify(error);
            if (stringified && stringified !== 'null' && stringified !== '{}') {
                return stringified;
            }
        } catch {}
        return 'Ocorreu um erro inesperado. Verifique o console para mais detalhes.';
    };
    
    async function checkDbConnection() {
        setLoading(true);
        setError(null);
        setShowConfigPanel(false);
        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').select('id').limit(1);
            if (supabaseError) throw supabaseError;
        } catch (err: any) {
            const message = getErrorMessage(err);
            console.error("Error checking DB connection:", message, err);
            setError(`Falha ao conectar ao banco de dados: ${message}.`);
            const isAuthError = message.includes('JWT') || message.includes('API key') || err.status === 401;
            const isTableError = (message.includes('relation') && message.includes('does not exist')) || message.includes('Could not find the table') || err.status === 404;
            if (isAuthError || isTableError) {
                 setShowConfigPanel(true);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkDbConnection();
    }, []);
    
    async function fetchDataForUser(user: Member) {
        setLoading(true);
        setError(null);
        try {
            if (user.role === Role.COORDENADOR) {
                const { data, error: supabaseError } = await supabase
                    .from('membros_pastoral')
                    .select('*')
                    .order('fullName', { ascending: true });
                if (supabaseError) throw supabaseError;
                setAgents(data || []);
            } else {
                setAgents([user]);
            }
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error fetching data for user:", message, err);
            setError(`Falha ao carregar dados: ${message}`);
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        if (loggedInAgent) {
            fetchDataForUser(loggedInAgent);
            setCurrentView('LIST');
        } else {
            setAgents([]);
            setLoginError(null);
        }
    }, [loggedInAgent]);
    
    const handleLogin = async (login: string, birthDate: string) => {
        setLoading(true);
        setLoginError(null);
        try {
            const { data, error: supabaseError } = await supabase
                .from('membros_pastoral')
                .select('*')
                .ilike('login', login)
                .eq('birthDate', birthDate)
                .single();
            if (supabaseError || !data) {
                throw new Error("Agente não encontrado ou dados incorretos.");
            }
            setLoggedInAgent(data);
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Login failed:", message);
            setLoginError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setLoggedInAgent(null);
    };
    
    const handleRegister = async (agentData: Member) => {
        const { id, ...restOfAgentData } = agentData;

        const dataToInsert = {
            ...restOfAgentData,
            login: restOfAgentData.login.toLowerCase(),
            role: Role.AGENTE,
            weddingDate: restOfAgentData.weddingDate || null,
            spouseName: restOfAgentData.spouseName || null,
            vehicleModel: restOfAgentData.vehicleModel || null,
            photo: restOfAgentData.photo || null,
            notes: restOfAgentData.notes || null,
        };
        
        setLoading(true);
        setError(null);
        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').insert(dataToInsert);
            if (supabaseError) {
                if(supabaseError.message.includes('duplicate key value violates unique constraint "membros_pastoral_login_key"')) {
                    throw new Error("Este login já está em uso. Por favor, escolha outro.");
                }
                throw supabaseError;
            }
            await handleLogin(agentData.login, agentData.birthDate);
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error registering agent:", message, err);
            setError(`Falha ao cadastrar: ${message}.`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveAgent = async (agentData: Member) => {
        if (!loggedInAgent) return;
        if (loggedInAgent.role === Role.AGENTE && agentData.id !== loggedInAgent.id) {
            setError("Você não tem permissão para editar outros agentes.");
            return;
        }

        const dataToUpsert = {
            ...agentData,
            login: agentData.login.toLowerCase(),
            weddingDate: agentData.weddingDate || null,
            spouseName: agentData.spouseName || null,
            vehicleModel: agentData.vehicleModel || null,
            photo: agentData.photo || null,
            notes: agentData.notes || null,
        };
        if (!dataToUpsert.id) {
          delete (dataToUpsert as Partial<typeof dataToUpsert>).id;
        }

        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').upsert(dataToUpsert);
            if (supabaseError) {
                 if(supabaseError.message.includes('duplicate key value violates unique constraint "membros_pastoral_login_key"')) {
                    throw new Error("Este login já está em uso. Por favor, escolha outro.");
                }
                throw supabaseError;
            }
            
            if (loggedInAgent.id === agentData.id) {
                setLoggedInAgent(agentData);
            } else {
                await fetchDataForUser(loggedInAgent);
            }

        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error saving agent:", message, err);
            setError(`Falha ao salvar o agente: ${message}`);
        } finally {
            setCurrentView('LIST');
            setAgentToEdit(null);
        }
    };

    const handleDeleteAgent = async (id: number) => {
        if (loggedInAgent?.role !== Role.COORDENADOR) {
            setError("Você não tem permissão para excluir agentes.");
            return;
        }
        if (window.confirm('Tem certeza que deseja excluir este agente?')) {
            try {
                const { error: supabaseError } = await supabase.from('membros_pastoral').delete().eq('id', id);
                if (supabaseError) throw supabaseError;
                setAgents(prevAgents => prevAgents.filter(m => m.id !== id));
            } catch (err) {
                const message = getErrorMessage(err);
                console.error("Error deleting agent:", message, err);
                setError(`Falha ao excluir o agente: ${message}`);
            }
        }
    };
    
    const handleEditAgent = (id: number) => {
        const agent = agents.find(m => m.id === id);
        if (agent) {
            setAgentToEdit(agent);
            setCurrentView('FORM');
        }
    };

    const handleAddNew = () => {
        setAgentToEdit(null);
        setCurrentView('FORM');
    };

    const handleCancel = () => {
        setAgentToEdit(null);
        setCurrentView('LIST');
    };

    const handleConfigSave = (url: string, key: string) => {
        localStorage.setItem('supabaseUrl', url);
        localStorage.setItem('supabaseKey', key);
        window.location.reload();
    };
    
    const renderContent = () => {
        if (loading && !loggedInAgent) {
            return (
                <div className="flex justify-center items-center h-screen">
                    <p className="text-slate-500 text-lg animate-pulse">Conectando ao banco de dados...</p>
                </div>
            );
        }

        if (showConfigPanel) {
            return <ConfigPanel errorMessage={error} onSave={handleConfigSave} />;
        }
        
        if (!loggedInAgent) {
            return <Login onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} generalError={error} />;
        }

        if (loggedInAgent.role === Role.COORDENADOR) {
            switch (currentView) {
                case 'LIST': return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} />;
                case 'FORM': return <MemberForm agentToEdit={agentToEdit} onSave={handleSaveAgent} onCancel={handleCancel} />;
                case 'REPORTS': return <Reports agents={agents} />;
                case 'ABOUT': return <About />;
                default: return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} />;
            }
        }

        if (loggedInAgent.role === Role.AGENTE) {
             if (currentView === 'ABOUT') return <About />;
            return <MemberForm agentToEdit={loggedInAgent} onSave={handleSaveAgent} isSelfEditing={true} />;
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            {loggedInAgent && <Header setCurrentView={setCurrentView} loggedInAgent={loggedInAgent} onLogout={handleLogout} />}
            <main className={loggedInAgent ? "container mx-auto p-4 sm:p-6 md:p-8" : ""}>
                {renderContent()}
            </main>
        </div>
    );
}

export default App;