
export enum MaritalStatus {
    SOLTEIRO = 'Solteiro',
    CASADO = 'Casado',
    VIUVO = 'Viúvo',
    SEPARADO = 'Separado',
}

export enum Sector {
    PRE_MATRIMONIAL = 'Pré-matrimonial',
    POS_MATRIMONIAL = 'Pós-matrimonial',
    CASOS_ESPECIAIS = 'Casos Especiais',
    SERVICO_A_VIDA = 'Serviço à Vida',
}

export enum Role {
    AGENTE = 'Agente',
    COORDENADOR = 'Coordenador',
}

export interface Member {
    id: number;
    login: string;
    photo?: string;
    fullName: string;
    birthDate: string;
    maritalStatus: MaritalStatus;
    spouseName?: string;
    weddingDate?: string;
    phone: string;
    email: string;
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    hasVehicle: boolean;
    vehicleModel?: string;
    parish: string;
    community: string;
    sector: Sector;
    role: Role;
    joinDate: string;
    notes?: string;
}

export type View = 'LIST' | 'FORM' | 'REPORTS' | 'ABOUT';