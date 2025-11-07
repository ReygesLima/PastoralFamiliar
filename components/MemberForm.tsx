import React, { useState, useEffect } from 'react';
import { Member, MaritalStatus } from '../types';
import { UserIcon } from './icons';

interface MemberFormProps {
    memberToEdit: Member | null;
    onSave: (member: Member) => void;
    onCancel: () => void;
}

// Helper components moved outside MemberForm to prevent re-creation on each render, which causes focus loss.
const FormField: React.FC<{ name: keyof Member, label: string, error?: string, children: React.ReactNode}> = ({ name, label, error, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        {children}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const SectionTitle: React.FC<{title: string}> = ({title}) => (
    <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4 col-span-1 md:col-span-2">{title}</h3>
);


const MemberForm: React.FC<MemberFormProps> = ({ memberToEdit, onSave, onCancel }) => {
    const initialState: Omit<Member, 'id'> = {
        fullName: '',
        photo: '',
        birthDate: '',
        maritalStatus: MaritalStatus.SOLTEIRO,
        spouseName: '',
        phone: '',
        email: '',
        cep: '',
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        parish: '',
        community: '',
        role: '',
        joinDate: '',
        notes: '',
    };

    const [formState, setFormState] = useState<Partial<Member>>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof Member, string>>>({});


    useEffect(() => {
        if (memberToEdit) {
            setFormState(memberToEdit);
        } else {
            setFormState(initialState);
        }
        setErrors({});
    }, [memberToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setFormState(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'maritalStatus' && value !== MaritalStatus.CASADO) {
                newState.spouseName = '';
            }
            return newState;
        });

        if (errors[name as keyof Member]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name as keyof Member];
                return newErrors;
            });
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
        const requiredFields: (keyof Member)[] = ['fullName', 'birthDate', 'maritalStatus', 'phone', 'email', 'cep', 'street', 'neighborhood', 'city', 'state', 'parish', 'community', 'role', 'joinDate'];
        
        requiredFields.forEach(field => {
            if (!formState[field]) {
                newErrors[field] = 'Este campo é obrigatório.';
            }
        });

        if (formState.maritalStatus === MaritalStatus.CASADO && !formState.spouseName) {
            newErrors.spouseName = 'Nome do cônjuge é obrigatório para casados.';
        }
        
        if (formState.email && !/\S+@\S+\.\S+/.test(formState.email)) {
             newErrors.email = 'E-mail inválido.';
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
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{memberToEdit ? 'Editar Membro' : 'Cadastrar Novo Membro'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <FormField name="fullName" label="Nome Completo*" error={errors.fullName}>
                        <input id="fullName" type="text" name="fullName" value={formState.fullName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>

                     <div className="flex items-center space-x-4 mt-1">
                        {formState.photo ?
                           <img className="h-20 w-20 object-cover rounded-full" src={formState.photo} alt="Foto do membro"/> :
                           <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserIcon className="w-10 h-10" /></div>
                        }
                        <FormField name="photo" label="Foto do Membro" error={errors.photo}>
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
                        <FormField name="spouseName" label="Nome do Cônjuge*" error={errors.spouseName}>
                            <input id="spouseName" type="text" name="spouseName" value={formState.spouseName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </FormField>
                    )}
                     <FormField name="phone" label="Telefone / WhatsApp*" error={errors.phone}>
                        <input id="phone" type="tel" name="phone" placeholder="(XX) XXXXX-XXXX" value={formState.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                    <FormField name="email" label="E-mail*" error={errors.email}>
                        <input id="email" type="email" name="email" placeholder="exemplo@email.com" value={formState.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>

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
                     <FormField name="community" label="Comunidade / Setor Pastoral*" error={errors.community}>
                        <input id="community" type="text" name="community" value={formState.community || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </FormField>
                     <FormField name="role" label="Função na Pastoral*" error={errors.role}>
                        <input id="role" type="text" name="role" value={formState.role || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
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