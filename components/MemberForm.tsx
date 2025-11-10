import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Member, MaritalStatus, Sector, Role } from '../types';
import { UserIcon, InfoIcon, PrintIcon } from './icons';

interface MemberFormProps {
    agentToEdit: Member | null;
    onSave: (agent: Member) => void;
    onCancel?: () => void;
    isSelfEditing?: boolean;
    isFirstTimeRegister?: boolean;
}

const emptyAgent: Omit<Member, 'id' | 'role'> & { id?: number, role?: Role } = {
    login: '',
    photo: '',
    fullName: '',
    birthDate: '',
    maritalStatus: MaritalStatus.SOLTEIRO,
    spouseName: '',
    weddingDate: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    hasVehicle: false,
    vehicleModel: '',
    parish: '',
    community: '',
    sector: Sector.PRE_MATRIMONIAL,
    joinDate: new Date().toISOString().split('T')[0],
    notes: '',
};

const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-8">
        <h3 className="bg-blue-600 text-white font-bold italic text-[15px] py-2 px-4 rounded-md mb-4">{title}</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {children}
        </div>
    </div>
);

interface InputFieldProps {
    name: string;
    label: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    colSpan?: string;
    children?: React.ReactNode;
    tooltip?: string;
    disabled?: boolean;
    maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({ name, label, value, onChange, onBlur, type = 'text', required = false, colSpan = 'sm:col-span-3', children, tooltip, disabled, maxLength }) => (
    <div className={colSpan}>
        <div className="flex items-center">
            <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
            {tooltip && (
                <div className="relative flex items-center group ml-1.5">
                    <InfoIcon className="h-4 w-4 text-slate-400 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                        {tooltip}
                    </div>
                </div>
            )}
        </div>
        <div className="mt-1">
            {children ? children : (
                <input
                    type={type}
                    name={name}
                    id={name}
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    required={required}
                    disabled={disabled}
                    maxLength={maxLength}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
            )}
        </div>
    </div>
);


const MemberForm: React.FC<MemberFormProps> = ({
    agentToEdit,
    onSave,
    onCancel,
    isSelfEditing = false,
    isFirstTimeRegister = false,
}) => {
    const [agent, setAgent] = useState<Partial<Member>>(emptyAgent);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        if (agentToEdit) {
            setAgent(agentToEdit);
            if (agentToEdit.photo) setPhotoPreview(agentToEdit.photo);
            else setPhotoPreview(null);
        } else {
            setAgent(emptyAgent);
            setPhotoPreview(null);
        }
    }, [agentToEdit]);

    const formatPhone = (value: string) => {
        if (!value) return value;
        const onlyNums = value.replace(/[^\d]/g, '');
        if (onlyNums.length <= 2) return `(${onlyNums}`;
        if (onlyNums.length <= 6) return `(${onlyNums.slice(0, 2)}) ${onlyNums.slice(2)}`;
        if (onlyNums.length <= 10) return `(${onlyNums.slice(0, 2)}) ${onlyNums.slice(2, 6)}-${onlyNums.slice(6)}`;
        return `(${onlyNums.slice(0, 2)}) ${onlyNums.slice(2, 7)}-${onlyNums.slice(7, 11)}`;
    };

    const formatCEP = (value: string) => {
        if (!value) return value;
        const onlyNums = value.replace(/[^\d]/g, '');
        if (onlyNums.length > 5) {
            return `${onlyNums.slice(0, 5)}-${onlyNums.slice(5, 8)}`;
        }
        return onlyNums;
    };
    
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        setCepError(null);

        if (cep.length !== 8) {
            if (cep.length > 0) setCepError("CEP inválido.");
            return;
        }

        setIsFetchingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado');
            const data = await response.json();
            if (data.erro) {
                setCepError("CEP não encontrado.");
                setAgent(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
            } else {
                setAgent(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setCepError("Erro ao buscar CEP. Verifique sua conexão.");
        } finally {
            setIsFetchingCep(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setAgent(prev => ({ ...prev, [name]: checked }));
        } else {
            let formattedValue = value;
            if (name === 'phone') {
                formattedValue = formatPhone(value);
            } else if (name === 'cep') {
                formattedValue = formatCEP(value);
            }
            setAgent(prev => ({ ...prev, [name]: formattedValue }));
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAgent(prev => ({ ...prev, photo: base64String }));
                setPhotoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(agent as Member);
    };

    const handleGeneratePDF = async () => {
        if (!agent) return;
    
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const FONT_SIZE_NORMAL = 10;
            const FONT_SIZE_TITLE = 16;
            const FONT_SIZE_HEADER = 12;
            const LINE_HEIGHT = 7;
            const Y_SPACING = 5;
    
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
                    const formatMatch = agent.photo.match(/^data:image\/(png|jpeg|jpg);base64,/);
                    if (formatMatch) {
                        const photoFormat = formatMatch[1].toUpperCase();
                        doc.addImage(agent.photo, photoFormat, photoX + 1, photoY + 1, photoSize - 2, photoSize - 2);
                    } else {
                         doc.addImage(agent.photo, 'JPEG', photoX + 1, photoY + 1, photoSize - 2, photoSize - 2);
                    }
                } catch (e) {
                    console.error("Erro ao adicionar imagem ao PDF:", e);
                    doc.setFontSize(8);
                    doc.text('Erro na\nimagem', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
                }
            } else {
                doc.setFontSize(8);
                doc.text('Sem Foto', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
            }
    
            let textX = photoX + photoSize + 10;
            let currentY = y + 5;
            const drawFieldInline = (label: string, value: string | undefined | null) => {
                if (!value) return;
                doc.setFontSize(FONT_SIZE_NORMAL);
                doc.setFont('helvetica', 'bold');
                doc.text(label, textX, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(value, textX + 35, currentY);
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
                 if (y > doc.internal.pageSize.getHeight() - 30) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFontSize(FONT_SIZE_HEADER);
                doc.setFont('helvetica', 'bold');
                doc.text(title, margin, y);
                doc.setDrawColor(0);
                doc.line(margin, y + 2, pageWidth - margin, y + 2);
                y += LINE_HEIGHT + Y_SPACING;
            };
    
            const drawField = (label: string, value: string | undefined | null) => {
                if (!value || String(value).trim() === '') return;
                const labelWidth = 50;
                const valueX = margin + labelWidth;
                const valueMaxWidth = pageWidth - margin - valueX;

                doc.setFontSize(FONT_SIZE_NORMAL);
                doc.setFont('helvetica', 'bold');
                const textLines = doc.splitTextToSize(String(value), valueMaxWidth);
                 if (y + (textLines.length * (LINE_HEIGHT-2)) > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    y = 20;
                }
                
                doc.text(label, margin, y);
                doc.setFont('helvetica', 'normal');
                doc.text(textLines, valueX, y);
                y += (textLines.length * (LINE_HEIGHT - 2)) + Y_SPACING;
            };
    
            drawSection('Contato');
            drawField('Telefone / WhatsApp:', agent.phone);
            drawField('E-mail:', agent.email);
    
            drawSection('Endereço');
            drawField('CEP:', agent.cep);
            drawField('Endereço:', agent.street);
            drawField('Bairro:', agent.neighborhood);
            drawField('Cidade / UF:', `${agent.city || ''} / ${agent.state || ''}`);
            
            drawSection('Informações Pastorais');
            drawField('Paróquia:', agent.parish);
            drawField('Comunidade:', agent.community);
            drawField('Setor Pastoral:', agent.sector);
            drawField('Função:', agent.role);
            if (agent.joinDate) drawField('Data de Ingresso:', new Date(agent.joinDate + 'T00:00:00').toLocaleDateString('pt-BR'));
            
            drawSection('Outras Informações');
            drawField('Possui Veículo:', agent.hasVehicle ? 'Sim' : 'Não');
            if (agent.hasVehicle) drawField('Modelo do Veículo:', agent.vehicleModel);
            if (agent.notes) {
                y += Y_SPACING / 2;
                drawField('Observações:', agent.notes);
            }
    
            const fileName = `ficha_${agent.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'agente'}.pdf`;
            doc.save(fileName);
    
        } catch (error) {
            console.error("Erro ao gerar o PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };
    
    const formTitle = isFirstTimeRegister ? "Fazer meu primeiro cadastro" : (agentToEdit ? "Editar Cadastro de Agente" : "Cadastrar Novo Agente");
    const saveButtonText = isFirstTimeRegister ? "Cadastrar" : "Salvar Alterações";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">{formTitle}</h2>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">

                    {/* FOTO */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Foto do Agente" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-slate-400" />
                            )}
                        </div>
                        <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        <label htmlFor="photo-upload" className="cursor-pointer rounded-md bg-white py-1.5 px-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                            {photoPreview ? 'Alterar Foto' : 'Enviar Foto'}
                        </label>
                    </div>

                    <FormSection title="Dados Pessoais">
                        <InputField name="fullName" label="Nome Completo" value={agent.fullName} onChange={handleChange} required colSpan="sm:col-span-6" />
                        <InputField 
                            name="login" 
                            label="Login (ex: jose.silva)" 
                            value={agent.login} 
                            onChange={handleChange} 
                            required 
                            colSpan="sm:col-span-3" 
                            tooltip="Este login é único no cadastro e será utilizado para os próximos acessos junto com sua data de nascimento."
                        />
                        <InputField 
                            name="birthDate" 
                            label="Data de Nascimento (Titular)" 
                            type="date" 
                            value={agent.birthDate} 
                            onChange={handleChange} 
                            required 
                            colSpan="sm:col-span-3"
                            tooltip="Sua data de nascimento será usada como parte da sua senha para acessar o sistema."
                        />
                        <InputField name="maritalStatus" label="Estado Civil" required colSpan="sm:col-span-3">
                            <select id="maritalStatus" name="maritalStatus" value={agent.maritalStatus} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5">
                                {Object.values(MaritalStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </InputField>
                        {agent.maritalStatus === MaritalStatus.CASADO && (
                            <>
                                <InputField name="spouseName" label="Nome do Cônjuge" value={agent.spouseName} onChange={handleChange} colSpan="sm:col-span-3" />
                                <InputField name="weddingDate" label="Data de Casamento" type="date" value={agent.weddingDate} onChange={handleChange} colSpan="sm:col-span-3" />
                            </>
                        )}
                    </FormSection>

                    <FormSection title="Contato e Endereço">
                        <InputField name="phone" label="Telefone / WhatsApp" value={agent.phone} onChange={handleChange} required maxLength={15} colSpan="sm:col-span-3" />
                        <InputField name="email" label="E-mail" type="email" value={agent.email} onChange={handleChange} required colSpan="sm:col-span-3" />
                        <div className="sm:col-span-2">
                            <InputField 
                                name="cep" 
                                label="CEP" 
                                value={agent.cep} 
                                onChange={handleChange}
                                onBlur={handleCepBlur}
                                maxLength={9}
                                colSpan="sm:col-span-6"
                            />
                            {isFetchingCep && <p className="text-xs text-slate-500 mt-1">Buscando endereço...</p>}
                            {cepError && <p className="text-xs text-red-600 mt-1">{cepError}</p>}
                        </div>
                        <InputField name="street" label="Endereço (Rua, Av.)" value={agent.street} onChange={handleChange} disabled={isFetchingCep} colSpan="sm:col-span-4" />
                        <InputField name="neighborhood" label="Bairro" value={agent.neighborhood} onChange={handleChange} disabled={isFetchingCep} colSpan="sm:col-span-2" />
                        <InputField name="city" label="Cidade" value={agent.city} onChange={handleChange} disabled={isFetchingCep} colSpan="sm:col-span-2" />
                        <InputField name="state" label="Estado (UF)" value={agent.state} onChange={handleChange} disabled={isFetchingCep} colSpan="sm:col-span-2" />
                    </FormSection>

                    <FormSection title="Informações Pastorais">
                        <InputField name="parish" label="Paróquia" value={agent.parish} onChange={handleChange} colSpan="sm:col-span-3" />
                        <InputField name="community" label="Comunidade" value={agent.community} onChange={handleChange} colSpan="sm:col-span-3" />
                        <InputField name="sector" label="Setor Pastoral" required colSpan="sm:col-span-3">
                            <select id="sector" name="sector" value={agent.sector} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5">
                                {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </InputField>
                        {!isSelfEditing && !isFirstTimeRegister && (
                            <InputField name="role" label="Função" required colSpan="sm:col-span-3">
                                <select id="role" name="role" value={agent.role} onChange={handleChange} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5">
                                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </InputField>
                        )}
                        <InputField name="joinDate" label="Data de Ingresso" type="date" value={agent.joinDate} onChange={handleChange} required colSpan="sm:col-span-3" />
                    </FormSection>
                    
                    <FormSection title="Outras Informações">
                        <div className="sm:col-span-6">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input id="hasVehicle" name="hasVehicle" type="checkbox" checked={agent.hasVehicle || false} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="hasVehicle" className="font-medium text-slate-900">Possui veículo disponível para a Pastoral</label>
                                </div>
                            </div>
                        </div>
                        {agent.hasVehicle && (
                            <InputField name="vehicleModel" label="Modelo do Veículo" value={agent.vehicleModel} onChange={handleChange} colSpan="sm:col-span-3" />
                        )}
                        <div className="sm:col-span-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Observações</label>
                            <div className="mt-1">
                                <textarea
                                    id="notes" name="notes" rows={3} value={agent.notes || ''} onChange={handleChange}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5"
                                ></textarea>
                            </div>
                        </div>
                    </FormSection>
                </div>

                <div className="pt-5 mt-6 border-t border-slate-200">
                    <div className="flex justify-end gap-x-3">
                         {agentToEdit && !isFirstTimeRegister && !isSelfEditing && (
                            <button type="button" onClick={handleGeneratePDF} disabled={isGeneratingPDF} className="inline-flex items-center gap-x-2 rounded-md bg-slate-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                <PrintIcon className="h-5 w-5" />
                                {isGeneratingPDF ? 'Gerando PDF...' : 'Imprimir Ficha'}
                            </button>
                         )}
                        {!isSelfEditing && !isFirstTimeRegister && onCancel && (
                            <button type="button" onClick={onCancel} className="rounded-md bg-white py-2 px-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="inline-flex justify-center rounded-md bg-blue-600 py-2 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                        {saveButtonText}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MemberForm;