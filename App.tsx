import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import Reports from './components/Reports';
import About from './components/About';
import ConfigPanel from './components/ConfigPanel'; // Importar o novo componente
import { Member, View } from './types';
import { supabase } from './lib/supabaseClient';
import { INITIAL_AGENTS } from './constants';

function App() {
    const [agents, setAgents] = useState<Member[]>([]);
    const [currentView, setCurrentView] = useState<View>('LIST');
    const [agentToEdit, setAgentToEdit] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDbEmpty, setIsDbEmpty] = useState(false);
    const [showConfigPanel, setShowConfigPanel] = useState(false); // Novo estado

    // Função robusta para extrair a mensagem de erro
    const getErrorMessage = (error: unknown): string => {
        // Prioridade 1: Erros com uma propriedade 'message' (padrão de Error e Supabase)
        if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
            return (error as any).message;
        }
        
        // Prioridade 2: Se o próprio erro for uma string
        if (typeof error === 'string') {
            return error;
        }

        // Fallback: Tentar transformar o erro em uma string JSON
        try {
            const stringified = JSON.stringify(error);
            // Evitar retornar 'null' ou '{}' que não são informativos
            if (stringified && stringified !== 'null' && stringified !== '{}') {
                return stringified;
            }
        } catch {
            // Ignorar erros de stringify (ex: referências circulares)
        }

        // Último recurso
        return 'Ocorreu um erro inesperado. Verifique o console para mais detalhes.';
    };

    async function fetchAgents() {
        setLoading(true);
        setError(null);
        setIsDbEmpty(false);
        setShowConfigPanel(false); // Reseta o painel de config a cada tentativa
        try {
            const { data, error: supabaseError } = await supabase
                .from('membros_pastoral')
                .select('*')
                .order('fullName', { ascending: true });

            if (supabaseError) {
                throw supabaseError;
            }

            if (data && data.length === 0) {
                setIsDbEmpty(true);
            } else {
                setAgents(data || []);
            }

        } catch (err: any) {
            const message = getErrorMessage(err);
            console.error("Error fetching agents:", message, err);
            setError(`Falha ao carregar os agentes: ${message}.`);
            
            // Verifica se é um erro de autenticação/RLS/tabela não encontrada para mostrar o painel de configuração
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
        fetchAgents();
    }, []);
    
    const seedDatabase = async () => {
        setLoading(true);
        setError(null);
        try {
            const agentsToInsert = INITIAL_AGENTS.map(({ id, ...rest }) => rest);
            const { error: insertError } = await supabase.from('membros_pastoral').insert(agentsToInsert);

            if (insertError) {
                throw insertError;
            }
            await fetchAgents();

        } catch (err) {
             const message = getErrorMessage(err);
             console.error("Error seeding database:", message, err);
            setError(`Falha ao popular o banco de dados: ${message}. Verifique as permissões de INSERT na sua tabela 'membros_pastoral'.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAgent = async (agentData: Member) => {
        const dataToUpsert = { ...agentData };

        if (!dataToUpsert.id) {
            delete (dataToUpsert as Partial<Member>).id;
        }

        try {
            const { error: supabaseError } = await supabase
                .from('membros_pastoral')
                .upsert(dataToUpsert);
            
            if (supabaseError) {
                throw supabaseError;
            }

            await fetchAgents();

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
        if (window.confirm('Tem certeza que deseja excluir este agente?')) {
            try {
                const { error: supabaseError } = await supabase
                    .from('membros_pastoral')
                    .delete()
                    .eq('id', id);

                if (supabaseError) {
                    throw supabaseError;
                }

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
        window.location.reload(); // Recarrega a página para usar as novas credenciais
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <p className="text-slate-500 text-lg animate-pulse">Conectando ao banco de dados...</p>
                </div>
            );
        }

        if (showConfigPanel) {
            return <ConfigPanel errorMessage={error} onSave={handleConfigSave} />;
        }

        if (error) {
             return (
                <div className="flex flex-col justify-center items-center py-20 bg-red-50 p-6 rounded-lg border border-red-200">
                    <p className="text-red-700 text-xl font-bold">Ocorreu um Erro</p>
                    <p className="text-red-600 mt-2 text-center">{error}</p>
                    <button onClick={fetchAgents} className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        if (isDbEmpty) {
            return (
                <div className="flex flex-col justify-center items-center py-20 bg-white p-8 rounded-lg shadow-sm text-center">
                    <h2 className="text-2xl font-bold text-slate-700">Bem-vindo!</h2>
                    <p className="text-slate-500 mt-2">Seu banco de dados de agentes está vazio.</p>
                    <p className="text-slate-500 mt-1">Deseja adicionar alguns dados de exemplo para começar?</p>
                    <button onClick={seedDatabase} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-semibold">
                        Povoar com Dados Iniciais
                    </button>
                </div>
            );
        }

        switch (currentView) {
            case 'LIST':
                return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} />;
            case 'FORM':
                return <MemberForm agentToEdit={agentToEdit} onSave={handleSaveAgent} onCancel={handleCancel} />;
            case 'REPORTS':
                return <Reports agents={agents} />;
            case 'ABOUT':
                return <About />;
            default:
                return <MemberList agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} onAddNew={handleAddNew} />;
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <Header setCurrentView={setCurrentView} />
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
                {renderContent()}
            </main>
        </div>
    );
}

export default App;