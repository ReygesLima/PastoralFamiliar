import React, { useState, useMemo } from 'react';
import { Member, MaritalStatus, Role, Sector } from '../types';
import { EditIcon, DeleteIcon, AddIcon, UserIcon, DownloadIcon, FileIcon } from './icons';
import jsPDF from 'jspdf';

interface MemberListProps {
    agents: Member[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddNew: () => void;
}

const MemberCard: React.FC<{ agent: Member; onEdit: (id: number) => void; onDelete: (id: number) => void; }> = ({ agent, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex items-center space-x-4 mb-4">
                     <div className="flex-shrink-0">
                        {agent.photo ? (
                            <img className="h-16 w-16 rounded-full object-cover" src={agent.photo} alt={agent.fullName} />
                        ) : (
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 text-blue-600 h-16 w-16 flex items-center justify-center">
                                <UserIcon className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{agent.fullName}</h3>
                        <p className="text-sm text-amber-600 font-semibold">{agent.role}</p>
                    </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                    <p><i className="fas fa-sitemap mr-2 text-slate-400"></i> {agent.sector}</p>
                    <p><i className="fas fa-church mr-2 text-slate-400"></i> {agent.parish} / {agent.community}</p>
                    <p><i className="fas fa-phone mr-2 text-slate-400"></i> {agent.phone}</p>
                    <p><i className="fas fa-map-marker-alt mr-2 text-slate-400"></i> {agent.city}, {agent.state}</p>
                    <p><i className="fas fa-ring mr-2 text-slate-400"></i> {agent.maritalStatus}</p>
                </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-2">
                <button onClick={() => onEdit(agent.id)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200" aria-label={`Editar ${agent.fullName}`}>
                    <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(agent.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200" aria-label={`Excluir ${agent.fullName}`}>
                    <DeleteIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};


const MemberList: React.FC<MemberListProps> = ({ agents, onEdit, onDelete, onAddNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterMaritalStatus, setFilterMaritalStatus] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const sectors = Object.values(Sector);
    const roles = Object.values(Role);

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const searchMatch = agent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                agent.phone.includes(searchTerm);
            const sectorMatch = filterSector === '' || agent.sector === filterSector;
            const maritalStatusMatch = filterMaritalStatus === '' || agent.maritalStatus === filterMaritalStatus;
            const roleMatch = filterRole === '' || agent.role === filterRole;

            return searchMatch && sectorMatch && maritalStatusMatch && roleMatch;
        });
    }, [agents, searchTerm, filterSector, filterMaritalStatus, filterRole]);

    const handleExportCSV = () => {
        if (filteredAgents.length === 0) {
            alert("Não há agentes para exportar com os filtros selecionados.");
            return;
        }
    
        const headers = [
            "Nome Completo", "Data de Nascimento", "Estado Civil", "Nome do Cônjuge", "Data de Casamento",
            "Telefone", "E-mail", "CEP", "Endereço", "Bairro", "Cidade", "UF",
            "Possui Veículo", "Modelo do Veículo", "Paróquia", "Comunidade", "Setor", 
            "Função", "Data de Ingresso", "Observações"
        ];
    
        const rows = filteredAgents.map(agent => [
            `"${agent.fullName.replace(/"/g, '""')}"`,
            agent.birthDate,
            agent.maritalStatus,
            `"${agent.spouseName?.replace(/"/g, '""') || ''}"`,
            agent.weddingDate || '',
            agent.phone,
            agent.email,
            agent.cep,
            `"${agent.street.replace(/"/g, '""')}"`,
            `"${agent.neighborhood.replace(/"/g, '""')}"`,
            `"${agent.city.replace(/"/g, '""')}"`,
            agent.state,
            agent.hasVehicle ? 'Sim' : 'Não',
            `"${agent.vehicleModel?.replace(/"/g, '""') || ''}"`,
            `"${agent.parish.replace(/"/g, '""')}"`,
            `"${agent.community.replace(/"/g, '""')}"`,
            agent.sector,
            agent.role,
            agent.joinDate,
            `"${agent.notes?.replace(/"/g, '""') || ''}"`,
        ].join(','));
    
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'agentes_pastoral_familiar.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleExportPDF = async () => {
        if (filteredAgents.length === 0) {
            alert("Não há agentes para exportar com os filtros selecionados.");
            return;
        }
    
        setIsExportingPDF(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const FONT_SIZE_NORMAL = 10;
            const FONT_SIZE_TITLE = 16;
            const FONT_SIZE_HEADER = 12;
            const LINE_HEIGHT = 7;
    
            for (let i = 0; i < filteredAgents.length; i++) {
                const agent = filteredAgents[i];
                if (i > 0) doc.addPage();
    
                let y = 20;
    
                doc.setFontSize(FONT_SIZE_TITLE);
                doc.setFont('helvetica', 'bold');
                doc.text('Ficha Cadastral de Agente', pageWidth / 2, y, { align: 'center' });
                y += LINE_HEIGHT * 2;
    
                const photoX = margin;
                const photoY = y;
                const photoSize = 40;
                doc.setDrawColor(150);
                doc.rect(photoX, photoY, photoSize, photoSize);
                if (agent.photo) {
                    try {
                        const photoFormat = agent.photo.substring(agent.photo.indexOf('/') + 1, agent.photo.indexOf(';'));
                        doc.addImage(agent.photo, photoFormat.toUpperCase(), photoX + 1, photoY + 1, photoSize - 2, photoSize - 2);
                    } catch (e) {
                        doc.setFontSize(8);
                        doc.text('Foto\ninválida', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
                    }
                } else {
                    doc.setFontSize(8);
                    doc.text('Sem Foto', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
                }
    
                let textX = photoX + photoSize + 10;
                let currentY = y + 5;
                const drawFieldInline = (label: string, value: string | undefined | null) => {
                    if(!value) return;
                    doc.setFontSize(FONT_SIZE_NORMAL);
                    doc.setFont('helvetica', 'bold');
                    doc.text(label, textX, currentY);
                    doc.setFont('helvetica', 'normal');
                    doc.text(value, textX + 40, currentY);
                    currentY += LINE_HEIGHT;
                }
                
                drawFieldInline('Nome Completo:', agent.fullName);
                if (agent.birthDate) drawFieldInline('Nascimento:', new Date(agent.birthDate + 'T00:00:00').toLocaleDateString('pt-BR'));
                drawFieldInline('Estado Civil:', agent.maritalStatus);
                if (agent.maritalStatus === MaritalStatus.CASADO) {
                    drawFieldInline('Cônjuge:', agent.spouseName);
                    if (agent.weddingDate) drawFieldInline('Casamento:', new Date(agent.weddingDate + 'T00:00:00').toLocaleDateString('pt-BR'));
                }
    
                y = photoY + photoSize + 15;
    
                const drawSection = (title: string) => {
                    doc.setFontSize(FONT_SIZE_HEADER);
                    doc.setFont('helvetica', 'bold');
                    doc.text(title, margin, y);
                    doc.setDrawColor(0);
                    doc.line(margin, y + 2, pageWidth - margin, y + 2);
                    y += LINE_HEIGHT + 2;
                };
    
                const drawField = (label: string, value: string | undefined | null) => {
                    if (!value || value.trim() === '') return;
                    doc.setFontSize(FONT_SIZE_NORMAL);
                    doc.setFont('helvetica', 'bold');
                    doc.text(label, margin, y);
                    doc.setFont('helvetica', 'normal');
                    const textLines = doc.splitTextToSize(value, pageWidth - margin * 2 - 50);
                    doc.text(textLines, margin + 50, y);
                    y += (textLines.length * LINE_HEIGHT);
                };
    
                drawSection('Contato');
                drawField('Telefone / WhatsApp:', agent.phone);
                drawField('E-mail:', agent.email);
                y += LINE_HEIGHT / 2;
    
                drawSection('Endereço');
                drawField('CEP:', agent.cep);
                drawField('Endereço:', agent.street);
                drawField('Bairro:', agent.neighborhood);
                drawField('Cidade / UF:', `${agent.city} / ${agent.state}`);
                y += LINE_HEIGHT / 2;
    
                drawSection('Informações Pastorais');
                drawField('Paróquia:', agent.parish);
                drawField('Comunidade:', agent.community);
                drawField('Setor Pastoral:', agent.sector);
                drawField('Função:', agent.role);
                if (agent.joinDate) drawField('Data de Ingresso:', new Date(agent.joinDate + 'T00:00:00').toLocaleDateString('pt-BR'));
                y += LINE_HEIGHT / 2;
    
                drawSection('Outras Informações');
                drawField('Possui Veículo:', agent.hasVehicle ? 'Sim' : 'Não');
                if (agent.hasVehicle) drawField('Modelo do Veículo:', agent.vehicleModel);
                if (agent.notes) {
                    y += LINE_HEIGHT / 2;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Observações:', margin, y);
                    y += LINE_HEIGHT;
                    doc.setFont('helvetica', 'normal');
                    const notesLines = doc.splitTextToSize(agent.notes, pageWidth - margin * 2);
                    doc.text(notesLines, margin, y);
                }
            }
    
            doc.save('fichas_cadastrais.pdf');
        } catch (error) {
            console.error("Erro ao gerar o PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Buscar por Nome ou Telefone</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Digite aqui..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="filterSector" className="block text-sm font-medium text-slate-700 mb-1">Setor Pastoral</label>
                        <select id="filterSector" value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">Todos</option>
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="filterMaritalStatus" className="block text-sm font-medium text-slate-700 mb-1">Estado Civil</label>
                        <select id="filterMaritalStatus" value={filterMaritalStatus} onChange={(e) => setFilterMaritalStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">Todos</option>
                            {Object.values(MaritalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterRole" className="block text-sm font-medium text-slate-700 mb-1">Função</label>
                        <select id="filterRole" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">Todas</option>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-700">Agentes Cadastrados ({filteredAgents.length})</h2>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={handleExportCSV}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        <span>Exportar CSV</span>
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                        className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <FileIcon className="h-5 w-5" />
                        <span>{isExportingPDF ? 'Gerando...' : 'Exportar Fichas (PDF)'}</span>
                    </button>
                    <button 
                        onClick={onAddNew}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <AddIcon className="h-5 w-5" />
                        <span>Novo Agente</span>
                    </button>
                </div>
            </div>

            {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map(agent => (
                        <MemberCard key={agent.id} agent={agent} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">Nenhum agente encontrado com os filtros selecionados.</p>
                </div>
            )}
        </div>
    );
};

export default MemberList;