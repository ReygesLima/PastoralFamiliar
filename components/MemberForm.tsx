import React, { useState, useEffect } from 'react';
import { Member, MaritalStatus, Sector, Role } from '../types';
import { UserIcon, InfoIcon } from './icons';

interface MemberFormProps {
    agentToEdit: Member | null;
    onSave: (member: Member) => void;
    onCancel: () => void;
}

// Helper components
const FormField: React.FC<{ name: keyof Member, label: string | React.ReactNode, error?: string, children: React.ReactNode}> = ({ name, label, error, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        {children}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const SectionTitle: React.FC<{title: string}> = ({title}) => (
    <h3 className="text-sm font-semibold text-white bg-blue-600 p-2 rounded-md col-span-1 md:col-span-2">{title}</h3>
);

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-sm text-white bg-slate-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
        </div>
    </div>
);


const MemberForm: React.FC<MemberFormProps> = ({ agentToEdit, onSave, onCancel }) => {
    const initialState: Omit<Member, 'id'> = {
        fullName: '',
        photo: '',
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
        role: Role.AGENTE,
        joinDate: '',
        notes: '',
    };

    const [formState, setFormState] = useState<Partial<Member>>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof Member, string>>>({});


    useEffect(() => {
        if (agentToEdit) {
            setFormState(agentToEdit);
        } else {
            setFormState(initialState);
        }
        setErrors({});
    }, [agentToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Clear error for the field being changed
        if (errors[name as keyof Member]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name as keyof Member];
                return newErrors;
            });
        }
        
        // Handle state changes based on field name
        if (name === 'hasVehicle') {
            const hasVehicleValue = value === 'true';
            setFormState(prev => {
                const newState = { 
                    ...prev, 
                    hasVehicle: hasVehicleValue 
                };
                // If "No" is selected for vehicle, clear the model field.
                if (!hasVehicleValue) {
                    newState.vehicleModel = '';
                }
                return newState;
            });
        } else if (name === 'maritalStatus') {
            setFormState(prev => {
                const newState = { ...prev, maritalStatus: value as MaritalStatus };
                // If not married, clear spouse and wedding date fields.
                if (value !== MaritalStatus.CASADO) {
                    newState.spouseName = '';
                    newState.weddingDate = '';
                }
                return newState;
            });
        } else if (name === 'phone') {
            const maskedValue = value
              .replace(/\D/g, '')
              .replace(/^(\d{2})(\d)/g, '($1) $2')
              .replace(/(\d{5})(\d)/, '$1-$2')
              .slice(0, 15); // (XX) XXXXX-XXXX
            setFormState(prev => ({ ...prev, [name]: maskedValue }));
        } else {
            // Default handler for simple value changes
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            return;
        }

        try {
            setErrors(prev => ({ ...prev, cep: undefined }));
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setFormState(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                }));
            } else {
                setErrors(prev => ({ ...prev, cep: 'CEP não encontrado.'}));
                setFormState(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: ''}));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP.'}));
        }
    };


    const validate = () => {
        const newErrors: Partial<Record<keyof Member, string>> = {};
        const requiredFields: (keyof Member)[] = ['fullName', 'birthDate', 'maritalStatus', 'phone', 'email', 'cep', 'street', 'neighborhood', 'city', 'state', 'parish', 'community', 'sector', 'role', 'joinDate'];
        
        requiredFields.forEach(field => {
            if (!formState[field]) {
                newErrors[field] = 'Este campo é obrigatório.';
            }
        });

        if (formState.maritalStatus === MaritalStatus.CASADO) {
            if(!formState.spouseName) newErrors.spouseName = 'Nome do cônjuge é obrigatório para casados.';
            if(!formState.weddingDate) newErrors.weddingDate = 'Data de casamento é obrigatória para casados.';
        }
        
        if (formState.email && !/\S+@\S+\.\S+/.test(formState.email)) {
             newErrors.email = 'E-mail inválido.';
        }

        if (formState.hasVehicle && !formState.vehicleModel) {
            newErrors.vehicleModel = 'Modelo do veículo é obrigatório se possui veículo.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formState as Member);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{agentToEdit ? 'Editar Agente' : 'Cadastrar Novo Agente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <FormField name="fullName" label="Nome Completo*" error={errors.fullName}>
                        <input id="fullName" type="text" name="fullName" value={formState.fullName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>

                     <div className="flex items-center space-x-4 mt-1">
                        {formState.photo ?
                           <img className="h-20 w-20 object-cover rounded-full" src={formState.photo} alt="Foto do agente"/> :
                           <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserIcon className="w-10 h-10" /></div>
                        }
                        <FormField name="photo" label="Foto do Agente" error={errors.photo}>
                           <input id="photo" type="file" name="photo" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </FormField>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <SectionTitle title="Informações Pessoais e Contato" />
                    <FormField name="birthDate" label="Data de Nascimento*" error={errors.birthDate}>
                         <input id="birthDate" type="date" name="birthDate" value={formState.birthDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                    <FormField name="maritalStatus" label="Estado Civil*" error={errors.maritalStatus}>
                        <select id="maritalStatus" name="maritalStatus" value={formState.maritalStatus} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            {Object.values(MaritalStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </FormField>
                    {formState.maritalStatus === MaritalStatus.CASADO && (
                        <>
                            <FormField name="spouseName" label="Nome do Cônjuge*" error={errors.spouseName}>
                                <input id="spouseName" type="text" name="spouseName" value={formState.spouseName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </FormField>
                             <FormField name="weddingDate" label="Data de Casamento*" error={errors.weddingDate}>
                                 <input id="weddingDate" type="date" name="weddingDate" value={formState.weddingDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </FormField>
                        </>
                    )}
                     <FormField name="phone" label="Telefone / WhatsApp*" error={errors.phone}>
                        <input id="phone" type="tel" name="phone" placeholder="(XX) XXXXX-XXXX" value={formState.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                    <FormField name="email" label="E-mail*" error={errors.email}>
                        <input id="email" type="email" name="email" placeholder="exemplo@email.com" value={formState.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>

                    <div className="md:col-span-2">
                        <div
                            className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"
                        >
                            Possui Veículo?*
                             <Tooltip text="Esta informação é necessária caso precisemos do seu veículo para pegar idosos na missa da Saúde.">
                                <InfoIcon className="h-5 w-5 text-slate-400" />
                            </Tooltip>
                        </div>
                        <div className="flex items-center space-x-6">
                             <label className="flex items-center">
                                <input type="radio" name="hasVehicle" value="true" checked={formState.hasVehicle === true} onChange={handleChange} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-slate-700">Sim</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="hasVehicle" value="false" checked={formState.hasVehicle === false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-slate-700">Não</span>
                            </label>
                        </div>
                    </div>

                    {formState.hasVehicle && (
                        <div className="md:col-span-2">
                             <FormField name="vehicleModel" label="Modelo do Veículo*" error={errors.vehicleModel}>
                                <input id="vehicleModel" type="text" name="vehicleModel" value={formState.vehicleModel || ''} onChange={handleChange} placeholder="Ex: Fiat Uno" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </FormField>
                        </div>
                    )}


                    <SectionTitle title="Endereço" />
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField name="cep" label="CEP*" error={errors.cep}>
                           <input id="cep" type="text" name="cep" placeholder="Apenas números" value={formState.cep || ''} onChange={handleChange} onBlur={handleCepBlur} maxLength={9} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </FormField>
                        <FormField name="neighborhood" label="Bairro*" error={errors.neighborhood}>
                            <input id="neighborhood" type="text" name="neighborhood" value={formState.neighborhood || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </FormField>
                         <div className="sm:col-span-2">
                             <FormField name="street" label="Rua e Número*" error={errors.street}>
                                <input id="street" type="text" name="street" value={formState.street || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </FormField>
                         </div>
                        <FormField name="city" label="Cidade*" error={errors.city}>
                            <input id="city" type="text" name="city" value={formState.city || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </FormField>
                        <FormField name="state" label="UF*" error={errors.state}>
                            <input id="state" type="text" name="state" value={formState.state || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </FormField>
                     </div>
                   

                    <SectionTitle title="Informações Pastorais" />
                     <FormField name="parish" label="Paróquia que participa*" error={errors.parish}>
                        <input id="parish" type="text" name="parish" value={formState.parish || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                     <FormField name="community" label="Comunidade*" error={errors.community}>
                        <input id="community" type="text" name="community" value={formState.community || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                    <FormField name="sector" label="Setor Pastoral*" error={errors.sector}>
                        <select id="sector" name="sector" value={formState.sector} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </FormField>
                     <FormField name="role" label="Função na Pastoral*" error={errors.role}>
                        <select id="role" name="role" value={formState.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                            {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </FormField>
                     <FormField name="joinDate" label="Data de Ingresso na Pastoral*" error={errors.joinDate}>
                        <input id="joinDate" type="date" name="joinDate" value={formState.joinDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                    
                    <div className="md:col-span-2">
                         <FormField name="notes" label="Observações Adicionais" error={errors.notes}>
                            <textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MemberForm;