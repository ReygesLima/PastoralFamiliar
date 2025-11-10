import React, { useState, useEffect } from 'react';
import { Member, MaritalStatus, Sector, Role } from '../types';
import { UserIcon, InfoIcon } from './icons';

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
    type?: string;
    required?: boolean;
    colSpan?: string;
    children?: React.ReactNode;
    tooltip?: string;
}

const InputField: React.FC<InputFieldProps> = ({ name, label, value, onChange, type = 'text', required = false, colSpan = 'sm:col-span-3', children, tooltip }) => (
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
                    required={required}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5"
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setAgent(prev => ({ ...prev, [name]: checked }));
        } else {
            setAgent(prev => ({ ...prev, [name]: value }));
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
                        <InputField name="fullName" label="Nome Completo (Casal)" value={agent.fullName} onChange={handleChange} required colSpan="sm:col-span-6" />
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
                        <InputField name="phone" label="Telefone / WhatsApp" value={agent.phone} onChange={handleChange} required colSpan="sm:col-span-3" />
                        <InputField name="email" label="E-mail" type="email" value={agent.email} onChange={handleChange} required colSpan="sm:col-span-3" />
                        <InputField 
                            name="cep" 
                            label="CEP" 
                            value={agent.cep} 
                            onChange={handleChange} 
                            colSpan="sm:col-span-2"
                            tooltip="Formato esperado: 00000-000."
                        />
                        <InputField name="street" label="Endereço (Rua, Av.)" value={agent.street} onChange={handleChange} colSpan="sm:col-span-4" />
                        <InputField name="neighborhood" label="Bairro" value={agent.neighborhood} onChange={handleChange} colSpan="sm:col-span-2" />
                        <InputField name="city" label="Cidade" value={agent.city} onChange={handleChange} colSpan="sm:col-span-2" />
                        <InputField name="state" label="Estado (UF)" value={agent.state} onChange={handleChange} colSpan="sm:col-span-2" />
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