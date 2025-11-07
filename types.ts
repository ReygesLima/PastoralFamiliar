export enum MaritalStatus {
    SOLTEIRO = 'Solteiro',
    CASADO = 'Casado',
    VIUVO = 'Viúvo',
    SEPARADO = 'Separado',
}

export interface Member {
    id: number;
    photo?: string;
    fullName: string;
    birthDate: string;
    maritalStatus: MaritalStatus;
    spouseName?: string;
    phone: string;
    email: string;
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    parish: string;
    community: string;
    role: string;
    joinDate: string;
    notes?: string;
}

export type View = 'LIST' | 'FORM' | 'REPORTS' | 'ABOUT';