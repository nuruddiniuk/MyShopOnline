
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { BusinessState, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  lang: Language;
}

const Reports: React.FC<Props> = ({ state, lang }) => {
  const t = TRANSLATIONS[lang];

  const totalSales = state.sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const profit = totalSales - totalExpenses;

  const data = [
    { name: 'Revenue', amount: totalSales },
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Profit', amount: profit },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{t.reports}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold text-emerald-600">৳{totalSales.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
          <h3 className="text-2xl font-bold text-rose-600">৳{totalExpenses.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Net Profit</p>
          <h3 className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            ৳{profit.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-8">{t.profit_loss} Analysis</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
