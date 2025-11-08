
import React from 'react';
import { LogoIcon } from './icons';

const About: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center text-center">
                <LogoIcon className="h-24 w-24 mb-4" />
                <h2 className="text-3xl font-bold text-slate-800">Pastoral Familiar - Cadastro Paroquial</h2>
                <p className="text-slate-600 mt-2">Versão 1.0.0</p>
            </div>
            
            <div className="mt-8 text-left space-y-6 text-slate-700">
                <p>
                    Este aplicativo foi desenvolvido para auxiliar na organização e gestão dos agentes da Pastoral Familiar da nossa paróquia. 
                    O objetivo é centralizar as informações, facilitar a comunicação e otimizar o acompanhamento das atividades e dos agentes.
                </p>

                <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Contato da Paróquia</h3>
                    <p><i className="fas fa-church mr-2 text-amber-500"></i> Paróquia Exemplo de Nossa Senhora</p>
                    <p><i className="fas fa-map-marker-alt mr-2 text-amber-500"></i> Rua da Igreja, 123 - Centro - Cidade Exemplo</p>
                    <p><i className="fas fa-phone mr-2 text-amber-500"></i> (XX) YYYYY-ZZZZ</p>
                    <p><i className="fas fa-envelope mr-2 text-amber-500"></i> paroquia.exemplo@email.com</p>
                </div>

                 <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Desenvolvimento</h3>
                    <p>
                        Este sistema é uma ferramenta interna e seu uso é restrito aos membros autorizados da coordenação da Pastoral Familiar.
                        Para suporte técnico ou sugestões, entre em contato com a secretaria paroquial.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;