
import React, { useMemo } from 'react';
import { Member, MaritalStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsProps {
    members: Member[];
}

const Reports: React.FC<ReportsProps> = ({ members }) => {

    const totalMembers = members.length;

    const dataByCommunity = useMemo(() => {
        const counts = members.reduce((acc, member) => {
            acc[member.community] = (acc[member.community] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    const dataByMaritalStatus = useMemo(() => {
        const counts = members.reduce((acc, member) => {
            acc[member.maritalStatus] = (acc[member.maritalStatus] || 0) + 1;
            return acc;
        }, {} as Record<MaritalStatus, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">Relatórios da Pastoral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-slate-600">Total de Membros</h3>
                    <p className="text-5xl font-bold text-blue-600 mt-2">{totalMembers}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-slate-600">Comunidades Ativas</h3>
                    <p className="text-5xl font-bold text-green-600 mt-2">{dataByCommunity.length}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-slate-600">Média de Membros por Comunidade</h3>
                    <p className="text-5xl font-bold text-amber-600 mt-2">
                        {dataByCommunity.length > 0 ? (totalMembers / dataByCommunity.length).toFixed(1) : 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Membros por Estado Civil</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={dataByMaritalStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {dataByMaritalStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold text-slate-700 mb-4">Membros por Comunidade</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataByCommunity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Membros" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;
