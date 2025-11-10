
import React, { useState } from 'react';
import { View, Member, Role } from '../types';
import { LogoIcon, MenuIcon, CloseIcon } from './icons';

interface HeaderProps {
    setCurrentView: (view: View) => void;
    loggedInAgent: Member;
    onLogout: () => void;
}

interface NavLinkProps {
    label: string;
    icon: string;
    onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors duration-200 w-full md:w-auto text-left"
    >
        <i className={`fas ${icon} text-amber-500`}></i>
        <span>{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ setCurrentView, loggedInAgent, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isCoordinator = loggedInAgent.role === Role.COORDENADOR;

    const coordinatorNavItems: { view: View; label: string; icon: string; }[] = [
        { view: 'LIST', label: 'Listar Agentes', icon: 'fa-users' },
        { view: 'REPORTS', label: 'Relatórios', icon: 'fa-chart-pie' },
    ];
    const agentNavItems: { view: View; label: string; icon: string; }[] = [
        { view: 'FORM', label: 'Meu Cadastro', icon: 'fa-user-edit' },
    ];
    const navItems: { view: View; label: string; icon: string }[] = [
        ...(isCoordinator ? coordinatorNavItems : []),
        ...(!isCoordinator ? agentNavItems : []),
        { view: 'ABOUT', label: 'Sobre', icon: 'fa-info-circle' },
    ];
    
    const handleNavClick = (view?: View, customOnClick?: () => void) => {
        if (customOnClick) {
            customOnClick();
        } else if (view) {
            setCurrentView(view);
        }
        setIsMenuOpen(false);
    };


    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center space-x-3">
                        <LogoIcon className="h-12 w-12" />
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Pastoral Familiar</h1>
                            <p className="text-xs text-slate-500">Cadastro Paroquial</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-2">
                        <span className="text-slate-600 text-sm mr-4">Olá, {loggedInAgent.fullName.split(' ')[0]}!</span>
                        {navItems.map(item => <NavLink key={item.view} onClick={() => handleNavClick(item.view)} label={item.label} icon={item.icon} />)}
                         <NavLink label="Sair" icon="fa-sign-out-alt" onClick={() => handleNavClick(undefined, onLogout)} />
                    </nav>

                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-blue-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200">
                    <nav className="flex flex-col p-4 space-y-2">
                        <span className="px-3 py-2 text-slate-800 font-semibold">Olá, {loggedInAgent.fullName.split(' ')[0]}!</span>
                        {navItems.map(item => <NavLink key={item.view} onClick={() => handleNavClick(item.view)} label={item.label} icon={item.icon} />)}
                         <div className="border-t my-2"></div>
                         <NavLink label="Sair" icon="fa-sign-out-alt" onClick={() => handleNavClick(undefined, onLogout)} />
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;