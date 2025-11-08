import React, { useState } from 'react';
import { View } from '../types';
import { LogoIcon, MenuIcon, CloseIcon } from './icons';

interface HeaderProps {
    setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { view: 'LIST', label: 'Listar Agentes', icon: 'fa-users' },
        { view: 'REPORTS', label: 'Relatórios', icon: 'fa-chart-pie' },
        { view: 'ABOUT', label: 'Sobre', icon: 'fa-info-circle' },
    ] as const;

    // FIX: Changed NavLink to be an explicit React.FC to solve TypeScript error with the 'key' prop.
    interface NavLinkProps {
        view: View;
        label: string;
        icon: string;
    }

    const NavLink: React.FC<NavLinkProps> = ({ view, label, icon }) => (
        <button
            onClick={() => {
                setCurrentView(view);
                setIsMenuOpen(false);
            }}
            className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors duration-200"
        >
            <i className={`fas ${icon} text-amber-500`}></i>
            <span>{label}</span>
        </button>
    );

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

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center space-x-2">
                        {/* FIX: Pass props explicitly to avoid TypeScript error with JSX spread and 'key' prop. */}
                        {navItems.map(item => <NavLink key={item.view} view={item.view} label={item.label} icon={item.icon} />)}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-blue-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200">
                    <nav className="flex flex-col p-4 space-y-2">
                        {/* FIX: Pass props explicitly to avoid TypeScript error with JSX spread and 'key' prop. */}
                        {navItems.map(item => <NavLink key={item.view} view={item.view} label={item.label} icon={item.icon} />)}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;