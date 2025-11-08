import React, { useState, useMemo } from 'react';
import { Member, MaritalStatus, Role, Sector } from '../types';
import { EditIcon, DeleteIcon, AddIcon, UserIcon, DownloadIcon, FileIcon } from './icons';
import jsPDF from 'jspdf';

interface MemberListProps {
    members: Member[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddNew: () => void;
}

const MemberCard: React.FC<{ member: Member; onEdit: (id: number) => void; onDelete: (id: number) => void; }> = ({ member, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex items-center space-x-4 mb-4">
                     <div className="flex-shrink-0">
                        {member.photo ? (
                            <img className="h-16 w-16 rounded-full object-cover" src={member.photo} alt={member.fullName} />
                        ) : (
                            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 text-blue-600 h-16 w-16 flex items-center justify-center">
                                <UserIcon className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{member.fullName}</h3>
                        <p className="text-sm text-amber-600 font-semibold">{member.role}</p>
                    </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                    <p><i className="fas fa-sitemap mr-2 text-slate-400"></i> {member.sector}</p>
                    <p><i className="fas fa-church mr-2 text-slate-400"></i> {member.parish} / {member.community}</p>
                    <p><i className="fas fa-phone mr-2 text-slate-400"></i> {member.phone}</p>
                    <p><i className="fas fa-map-marker-alt mr-2 text-slate-400"></i> {member.city}, {member.state}</p>
                    <p><i className="fas fa-ring mr-2 text-slate-400"></i> {member.maritalStatus}</p>
                </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 flex justify-end space-x-2">
                <button onClick={() => onEdit(member.id)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200" aria-label={`Editar ${member.fullName}`}>
                    <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(member.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200" aria-label={`Excluir ${member.fullName}`}>
                    <DeleteIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};


const MemberList: React.FC<MemberListProps> = ({ members, onEdit, onDelete, onAddNew }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterMaritalStatus, setFilterMaritalStatus] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const sectors = Object.values(Sector);
    const roles = Object.values(Role);

    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const searchMatch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                member.phone.includes(searchTerm);
            const sectorMatch = filterSector === '' || member.sector === filterSector;
            const maritalStatusMatch = filterMaritalStatus === '' || member.maritalStatus === filterMaritalStatus;
            const roleMatch = filterRole === '' || member.role === filterRole;

            return searchMatch && sectorMatch && maritalStatusMatch && roleMatch;
        });
    }, [members, searchTerm, filterSector, filterMaritalStatus, filterRole]);

    const handleExportCSV = () => {
        if (filteredMembers.length === 0) {
            alert("Não há membros para exportar com os filtros selecionados.");
            return;
        }
    
        const headers = [
            "Nome Completo", "Data de Nascimento", "Estado Civil", "Nome do Cônjuge", "Data de Casamento",
            "Telefone", "E-mail", "CEP", "Endereço", "Bairro", "Cidade", "UF",
            "Possui Veículo", "Modelo do Veículo", "Paróquia", "Comunidade", "Setor", 
            "Função", "Data de Ingresso", "Observações"
        ];
    
        const rows = filteredMembers.map(member => [
            `"${member.fullName.replace(/"/g, '""')}"`,
            member.birthDate,
            member.maritalStatus,
            `"${member.spouseName?.replace(/"/g, '""') || ''}"`,
            member.weddingDate || '',
            member.phone,
            member.email,
            member.cep,
            `"${member.street.replace(/"/g, '""')}"`,
            `"${member.neighborhood.replace(/"/g, '""')}"`,
            `"${member.city.replace(/"/g, '""')}"`,
            member.state,
            member.hasVehicle ? 'Sim' : 'Não',
            `"${member.vehicleModel?.replace(/"/g, '""') || ''}"`,
            `"${member.parish.replace(/"/g, '""')}"`,
            `"${member.community.replace(/"/g, '""')}"`,
            member.sector,
            member.role,
            member.joinDate,
            `"${member.notes?.replace(/"/g, '""') || ''}"`,
        ].join(','));
    
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'membros_pastoral_familiar.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleExportPDF = async () => {
        if (filteredMembers.length === 0) {
            alert("Não há membros para exportar com os filtros selecionados.");
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
    
            for (let i = 0; i < filteredMembers.length; i++) {
                const member = filteredMembers[i];
                if (i > 0) doc.addPage();
    
                let y = 20;
    
                doc.setFontSize(FONT_SIZE_TITLE);
                doc.setFont('helvetica', 'bold');
                doc.text('Ficha Cadastral de Membro', pageWidth / 2, y, { align: 'center' });
                y += LINE_HEIGHT * 2;
    
                const photoX = margin;
                const photoY = y;
                const photoSize = 40;
                doc.setDrawColor(150);
                doc.rect(photoX, photoY, photoSize, photoSize);
                if (member.photo) {
                    try {
                        const photoFormat = member.photo.substring(member.photo.indexOf('/') + 1, member.photo.indexOf(';'));
                        doc.addImage(member.photo, photoFormat.toUpperCase(), photoX + 1, photoY + 1, photoSize - 2, photoSize - 2);
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
                
                drawFieldInline('Nome Completo:', member.fullName);
                if (member.birthDate) drawFieldInline('Nascimento:', new Date(member.birthDate + 'T00:00:00').toLocaleDateString('pt-BR'));
                drawFieldInline('Estado Civil:', member.maritalStatus);
                if (member.maritalStatus === MaritalStatus.CASADO) {
                    drawFieldInline('Cônjuge:', member.spouseName);
                    if (member.weddingDate) drawFieldInline('Casamento:', new Date(member.weddingDate + 'T00:00:00').toLocaleDateString('pt-BR'));
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
                drawField('Telefone / WhatsApp:', member.phone);
                drawField('E-mail:', member.email);
                y += LINE_HEIGHT / 2;
    
                drawSection('Endereço');
                drawField('CEP:', member.cep);
                drawField('Endereço:', member.street);
                drawField('Bairro:', member.neighborhood);
                drawField('Cidade / UF:', `${member.city} / ${member.state}`);
                y += LINE_HEIGHT / 2;
    
                drawSection('Informações Pastorais');
                drawField('Paróquia:', member.parish);
                drawField('Comunidade:', member.community);
                drawField('Setor Pastoral:', member.sector);
                drawField('Função:', member.role);
                if (member.joinDate) drawField('Data de Ingresso:', new Date(member.joinDate + 'T00:00:00').toLocaleDateString('pt-BR'));
                y += LINE_HEIGHT / 2;
    
                drawSection('Outras Informações');
                drawField('Possui Veículo:', member.hasVehicle ? 'Sim' : 'Não');
                if (member.hasVehicle) drawField('Modelo do Veículo:', member.vehicleModel);
                if (member.notes) {
                    y += LINE_HEIGHT / 2;
                    doc.setFont('helvetica', 'bold');
                    doc.text('Observações:', margin, y);
                    y += LINE_HEIGHT;
                    doc.setFont('helvetica', 'normal');
                    const notesLines = doc.splitTextToSize(member.notes, pageWidth - margin * 2);
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
                <h2 className="text-2xl font-bold text-slate-700">Membros Cadastrados ({filteredMembers.length})</h2>
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
                        <span>Novo Membro</span>
                    </button>
                </div>
            </div>

            {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <MemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">Nenhum membro encontrado com os filtros selecionados.</p>
                </div>
            )}
        </div>
    );
};

export default MemberList;