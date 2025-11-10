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
    const [errorLog, setErrorLog] = useState<string[]>([]);
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

    const logAndSetError = (message: string | null, context?: string) => {
        if (message) {
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} [${context || 'GERAL'}]: ${message}`;
            setErrorLog(prevLog => [...prevLog, logMessage]);
        }
        setError(message);
    };

    const handleDownloadLog = () => {
        if (errorLog.length === 0) {
            alert("Nenhum erro foi registrado na sessão atual.");
            return;
        }
        
        const url = localStorage.getItem('supabaseUrl') || '(não definida)';
        const logContent = [
            "Log de Erros - Pastoral Familiar App",
            "====================================",
            `Data: ${new Date().toLocaleString('pt-BR')}`,
            `URL Supabase Configurada: ${url}`,
            "====================================",
            ...errorLog
        ].join('\n');

        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const downloadUrl = URL.createObjectURL(blob);
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', 'pastoral_app_error_log.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
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
            logAndSetError(`Falha ao conectar ao banco de dados: ${message}.`, "DB_CONNECTION");
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
            logAndSetError(`Falha ao carregar dados: ${message}`, "FETCH_DATA");
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
        const triedCredentials = `Tentativa de login com: login='${login.trim().toUpperCase()}', data de nascimento='${birthDate}'`;
        logAndSetError(triedCredentials, "LOGIN_ATTEMPT");

        try {
            const cleanLogin = login.trim().toUpperCase();
            if (!cleanLogin || !birthDate) {
                throw new Error("Login e data de nascimento são obrigatórios.");
            }
            
            // Solução definitiva: Usa o formato ISO 8601 completo com fuso UTC para a consulta.
            // Isso elimina qualquer ambiguidade de fuso horário entre o cliente e o banco de dados.
            const startDate = new Date(birthDate + 'T00:00:00.000Z');
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);

            const { data, error: supabaseError } = await supabase
                .from('membros_pastoral')
                .select('*')
                .eq('login', cleanLogin)
                .gte('birthDate', startDate.toISOString())
                .lt('birthDate', endDate.toISOString());

            // Log the raw response from the database to help debug login issues
            const dbResponseLog = `Dados retornados pelo banco de dados: ${JSON.stringify(data, null, 2)}`;
            logAndSetError(dbResponseLog, 'DB_RESPONSE');
            console.log("Supabase query response:", data);


            if (supabaseError) {
                console.error(`Supabase login error: ${supabaseError.message}`, supabaseError);
                logAndSetError(`Erro retornado pelo Supabase: ${supabaseError.message}`, "SUPABASE_ERROR");
                throw new Error("Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.");
            }

            if (!data || data.length === 0) {
                console.error("Login failed: No agent found with the provided credentials.", triedCredentials);
                logAndSetError("Nenhum agente encontrado com as credenciais fornecidas.", "LOGIN_FAILURE");
                throw new Error("Login ou data de nascimento incorretos. Por favor, verifique os dados e tente novamente.");
            }
            
            if (data.length > 1) {
                console.error("Login failed: Multiple agents found with the same credentials. This indicates a data integrity issue.", triedCredentials);
                logAndSetError(`Inconsistência de dados: Múltiplos cadastros encontrados para o mesmo login e data de nascimento. Contate o administrador.`, "DATA_INTEGRITY_ERROR");
                throw new Error("Existem múltiplos cadastros com as mesmas credenciais. Por favor, contate o administrador do sistema.");
            }
            
            // Success, exactly one record found
            setLoggedInAgent(data[0]);

        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Login failed:", message);
            logAndSetError(message, "LOGIN");
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
            login: restOfAgentData.login.toUpperCase(),
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
            logAndSetError(`Falha ao cadastrar: ${message}.`, "REGISTER");
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveAgent = async (agentData: Member) => {
        if (!loggedInAgent) return;
        if (loggedInAgent.role === Role.AGENTE && agentData.id !== loggedInAgent.id) {
            logAndSetError("Você não tem permissão para editar outros agentes.", "SAVE_AGENT");
            return;
        }

        const dataToUpsert = {
            ...agentData,
            login: agentData.login.toUpperCase(),
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
            logAndSetError(`Falha ao salvar o agente: ${message}`, "SAVE_AGENT");
        } finally {
            setCurrentView('LIST');
            setAgentToEdit(null);
        }
    };

    const handleDeleteAgent = async (id: number) => {
        if (loggedInAgent?.role !== Role.COORDENADOR) {
            logAndSetError("Você não tem permissão para excluir agentes.", "DELETE_AGENT");
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
                logAndSetError(`Falha ao excluir o agente: ${message}`, "DELETE_AGENT");
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
            return <ConfigPanel errorMessage={error} onSave={handleConfigSave} errorLog={errorLog} onDownloadLog={handleDownloadLog} />;
        }
        
        if (!loggedInAgent) {
            return <Login onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} generalError={error} errorLog={errorLog} onDownloadLog={handleDownloadLog} />;
        }

        if (loggedInAgent.role === Role.COORDENADOR) {
            switch (currentView) {
                case 'LIST': return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} loggedInAgent={loggedInAgent} />;
                case 'FORM': return <MemberForm agentToEdit={agentToEdit} onSave={handleSaveAgent} onCancel={handleCancel} />;
                case 'REPORTS': return <Reports agents={agents} />;
                case 'ABOUT': return <About />;
                default: return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} loggedInAgent={loggedInAgent} />;
            }
        }

        if (loggedInAgent.role === Role.AGENTE) {
             switch (currentView) {
                case 'LIST': 
                    return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={() => {}} onAddNew={() => {}} loggedInAgent={loggedInAgent} />;
                case 'FORM':
                    return <MemberForm agentToEdit={agentToEdit} onSave={handleSaveAgent} onCancel={handleCancel} isSelfEditing={true} />;
                case 'ABOUT': 
                    return <About />;
                default: 
                    return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={() => {}} onAddNew={() => {}} loggedInAgent={loggedInAgent} />;
            }
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