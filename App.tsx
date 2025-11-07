
import React, { useState, useEffect } from 'react';
import { Member, View } from './types';
import { INITIAL_MEMBERS } from './constants';
import Header from './components/Header';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import Reports from './components/Reports';
import About from './components/About';

const App: React.FC = () => {
    const [members, setMembers] = useState<Member[]>(() => {
        try {
            const savedMembers = window.localStorage.getItem('pastoralFamiliarMembers');
            if (savedMembers) {
                return JSON.parse(savedMembers);
            }
        } catch (error) {
            console.error("Erro ao carregar membros do localStorage:", error);
        }
        return INITIAL_MEMBERS;
    });

    const [currentView, setCurrentView] = useState<View>('LIST');
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    useEffect(() => {
        try {
            window.localStorage.setItem('pastoralFamiliarMembers', JSON.stringify(members));
        } catch (error) {
            console.error("Erro ao salvar membros no localStorage:", error);
        }
    }, [members]);


    const handleSaveMember = (member: Member) => {
        if (member.id) {
            // Edit
            setMembers(members.map(m => (m.id === member.id ? member : m)));
        } else {
            // Add
            const newMember = { ...member, id: Date.now() };
            setMembers([...members, newMember]);
        }
        setCurrentView('LIST');
        setEditingMember(null);
    };

    const handleEditMember = (id: number) => {
        const memberToEdit = members.find(m => m.id === id);
        if (memberToEdit) {
            setEditingMember(memberToEdit);
            setCurrentView('FORM');
        }
    };
    
    const handleAddNewMember = () => {
        setEditingMember(null);
        setCurrentView('FORM');
    };

    const handleDeleteMember = (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este membro?')) {
            setMembers(members.filter(m => m.id !== id));
        }
    };
    
    const handleCancelForm = () => {
        setEditingMember(null);
        setCurrentView('LIST');
    };

    const renderContent = () => {
        switch (currentView) {
            case 'LIST':
                return <MemberList members={members} onEdit={handleEditMember} onDelete={handleDeleteMember} onAddNew={handleAddNewMember} />;
            case 'FORM':
                return <MemberForm memberToEdit={editingMember} onSave={handleSaveMember} onCancel={handleCancelForm}/>;
            case 'REPORTS':
                return <Reports members={members} />;
            case 'ABOUT':
                return <About />;
            default:
                return <MemberList members={members} onEdit={handleEditMember} onDelete={handleDeleteMember} onAddNew={handleAddNewMember} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <Header setCurrentView={setCurrentView} />
            <main className="p-4 sm:p-6 md:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
