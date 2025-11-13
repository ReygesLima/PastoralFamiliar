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
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import { LogoIcon } from './components/icons';

function AppContent() {
    const [agents, setAgents] = useState<Member[]>([]);
    const [currentView, setCurrentView] = useState<View>('LIST');
    const [agentToEdit, setAgentToEdit] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorLog, setErrorLog] = useState<string[]>([]);
    const [showConfigPanel, setShowConfigPanel] = useState(false);
    const [loggedInAgent, setLoggedInAgent] = useState<Member | null>(null);
    const { addNotification } = useNotification();
    
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

    const logAndNotifyError = (message: string | null, context?: string) => {
        if (message) {
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} [${context || 'GERAL'}]: ${message}`;
            setErrorLog(prevLog => [...prevLog, logMessage]);
            addNotification({ message, type: 'error' });
        }
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
        setShowConfigPanel(false);
        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').select('id').limit(1);
            if (supabaseError) throw supabaseError;
        } catch (err: any) {
            const message = getErrorMessage(err);
            console.error("Error checking DB connection:", message, err);
            logAndNotifyError(`Falha ao conectar ao banco de dados: ${message}.`, "DB_CONNECTION");
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
        try {
            if (user.role === Role.COORDENADOR) {
                const { data, error: supabaseError } = await supabase
                    .from('membros_pastoral')
                    .select('*')
                    .order('fullName', { ascending: true });
                if (supabaseError) throw supabaseError;
                setAgents(data as Member[] || []);
            } else {
                setAgents([user]);
            }
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error fetching data for user:", message, err);
            logAndNotifyError(`Falha ao carregar dados: ${message}`, "FETCH_DATA");
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
        }
    }, [loggedInAgent]);
    
    const handleLogin = async (login: string, birthDate: string) => {
        setLoading(true);
        const triedCredentials = `Tentativa de login com: login='${login.trim()}', data de nascimento='${birthDate}'`;
    
        try {
            const cleanLogin = login.trim();
            if (!cleanLogin || !birthDate) {
                throw new Error("Login e data de nascimento são obrigatórios.");
            }
    
            const { data, error: rpcError } = await supabase.rpc('login_agente', {
                p_login: cleanLogin,
                p_birth_date: birthDate
            });
    
            if (rpcError) {
                console.error(`Supabase RPC login error: ${rpcError.message}`, rpcError);
                if(rpcError.message.includes("function login_agente does not exist")){
                     throw new Error("A função de login não foi encontrada no banco de dados. Por favor, execute o script do arquivo 'database.sql' no SQL Editor do Supabase.");
                }
                throw new Error("Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.");
            }
    
            const resultData = data as Member[];
            if (!resultData || resultData.length === 0) {
                throw new Error("Login ou data de nascimento incorretos. Dica: Se os dados estiverem corretos, verifique se as políticas de segurança (RLS) do Supabase permitem a leitura da tabela 'membros_pastoral'.");
            }
    
            if (resultData.length > 1) {
                throw new Error("Existem múltiplos cadastros com as mesmas credenciais. Por favor, contate o administrador do sistema.");
            }
    
            const agent = resultData[0];
            addNotification({ message: `Bem-vindo, ${agent.fullName.split(' ')[0]}!`, type: 'success' });
            setLoggedInAgent(agent);
    
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Login failed:", message, triedCredentials);
            logAndNotifyError(message, "LOGIN");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setLoggedInAgent(null);
    };
    
    const handleRegister = async (agentData: Member): Promise<boolean> => {
        const { id, ...restOfAgentData } = agentData;

        const dataToInsert = {
            ...restOfAgentData,
            role: Role.AGENTE,
            weddingDate: restOfAgentData.weddingDate || null,
            spouseName: restOfAgentData.spouseName || null,
            vehicleModel: restOfAgentData.vehicleModel || null,
            photo: restOfAgentData.photo || null,
            notes: restOfAgentData.notes || null,
        };
        
        setLoading(true);
        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').insert(dataToInsert);
            if (supabaseError) {
                if(supabaseError.message.includes('duplicate key value violates unique constraint "membros_pastoral_login_key"')) {
                    throw new Error("Este login já está em uso. Por favor, escolha outro.");
                }
                throw supabaseError;
            }
            // Não chama o handleLogin diretamente, mas sim o que está por trás dele
            await handleLogin(agentData.login, agentData.birthDate);
            return true;
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error registering agent:", message, err);
            logAndNotifyError(`Falha ao cadastrar: ${message}.`, "REGISTER");
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveAgent = async (agentData: Member): Promise<boolean> => {
        if (!loggedInAgent) return false;
        if (loggedInAgent.role === Role.AGENTE && agentData.id !== loggedInAgent.id) {
            logAndNotifyError("Você não tem permissão para editar outros agentes.", "SAVE_AGENT");
            return false;
        }
        
        setLoading(true);
        
        const { id, ...restOfData } = agentData;
        const dataForDb = {
            ...restOfData,
            weddingDate: restOfData.weddingDate || null,
            spouseName: restOfData.spouseName || null,
            vehicleModel: restOfData.vehicleModel || null,
            photo: restOfData.photo || null,
            notes: restOfData.notes || null,
        };
    
        try {
            let resultError;
    
            if (id) {
                const { error } = await supabase.from('membros_pastoral').update(dataForDb).eq('id', id);
                resultError = error;
            } else {
                const { error } = await supabase.from('membros_pastoral').insert(dataForDb);
                resultError = error;
            }
    
            if (resultError) {
                if (resultError.message.includes('duplicate key value violates unique constraint "membros_pastoral_login_key"')) {
                    throw new Error("Este login já está em uso. Por favor, escolha outro.");
                }
                throw resultError;
            }
    
            if (loggedInAgent.id === agentData.id) {
                setLoggedInAgent(agentData);
            }
            
            if (loggedInAgent.role === Role.COORDENADOR) {
                await fetchDataForUser(loggedInAgent);
            }
            addNotification({ message: 'Agente salvo com sucesso!', type: 'success' });
            return true;
    
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error saving agent:", message, err);
            logAndNotifyError(`Falha ao salvar o agente: ${message}`, "SAVE_AGENT");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAgent = async (id: number) => {
        if (loggedInAgent?.role !== Role.COORDENADOR) {
            logAndNotifyError("Você não tem permissão para excluir agentes.", "DELETE_AGENT");
            return;
        }
        
        try {
            const { error: supabaseError } = await supabase.from('membros_pastoral').delete().eq('id', id);
            if (supabaseError) throw supabaseError;
            setAgents(prevAgents => prevAgents.filter(m => m.id !== id));
            addNotification({ message: 'Agente excluído com sucesso!', type: 'success' });
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Error deleting agent:", message, err);
            logAndNotifyError(`Falha ao excluir o agente: ${message}`, "DELETE_AGENT");
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
        if (loading && !loggedInAgent && !showConfigPanel) {
            return (
                <div className="flex flex-col justify-center items-center h-screen bg-slate-100">
                    <LogoIcon className="h-24 w-24 mb-4 animate-pulse" />
                    <h2 className="text-xl font-semibold text-slate-600">Aguarde...</h2>
                    <p className="text-slate-500 mt-2">Estamos preparando tudo para você.</p>
                </div>
            );
        }

        if (showConfigPanel) {
            const firstError = errorLog.length > 0 ? errorLog[0].split(': ')[1] : null;
            return <ConfigPanel errorMessage={firstError} onSave={handleConfigSave} errorLog={errorLog} onDownloadLog={handleDownloadLog} />;
        }
        
        if (!loggedInAgent) {
            return <Login onLogin={handleLogin} onRegister={handleRegister} loading={loading} errorLog={errorLog} onDownloadLog={handleDownloadLog} />;
        }

        if (loggedInAgent.role === Role.COORDENADOR) {
            switch (currentView) {
                case 'LIST': return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} loggedInAgent={loggedInAgent} />;
                case 'FORM': return <MemberForm key={agentToEdit?.id || 'new'} agentToEdit={agentToEdit} onSave={handleSaveAgent} onCancel={handleCancel} />;
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
                    return <MemberForm agentToEdit={loggedInAgent} onSave={handleSaveAgent} onCancel={() => setCurrentView('LIST')} isSelfEditing={true} />;
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


function App() {
    return (
        <NotificationProvider>
            <NotificationContainer />
            <AppContent />
        </NotificationProvider>
    );
}

export default App;