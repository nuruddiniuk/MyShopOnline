
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { BusinessState, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  lang: Language;
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<Props> = ({ state, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const totalSales = state.sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const inventoryCount = state.inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const customerCount = state.customers.length;
  const categoryCount = new Set(state.inventory.map(i => i.category).filter(Boolean)).size;

  const kpis = [
    { label: t.total_sales, value: `৳${totalSales.toLocaleString()}`, icon: 'fa-money-bill-trend-up', color: 'bg-emerald-500', target: 'sales' },
    { label: t.total_inventory, value: inventoryCount, icon: 'fa-boxes-stacked', color: 'bg-blue-500', target: 'inventory' },
    { label: t.total_customers, value: customerCount, icon: 'fa-users', color: 'bg-purple-500', target: 'customers' },
    { label: t.total_expenses, value: `৳${totalExpenses.toLocaleString()}`, icon: 'fa-receipt', color: 'bg-rose-500', target: 'expenses' },
    { label: t.total_categories, value: categoryCount, icon: 'fa-folder-tree', color: 'bg-amber-500', target: 'inventory' },
  ];

  // Dummy chart data based on existing state
  const chartData = [
    { name: 'Mon', sales: 400, expenses: 240 },
    { name: 'Tue', sales: 300, expenses: 139 },
    { name: 'Wed', sales: 200, expenses: 980 },
    { name: 'Thu', sales: 278, expenses: 390 },
    { name: 'Fri', sales: 189, expenses: 480 },
    { name: 'Sat', sales: 239, expenses: 380 },
    { name: 'Sun', sales: 349, expenses: 430 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">{t.dashboard}</h1>
        <p className="text-slate-500">{t.welcome}, Business Owner</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <button 
            key={idx} 
            onClick={() => onNavigate?.(kpi.target)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div className={`${kpi.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shrink-0`}>
              <i className={`fa-solid ${kpi.icon}`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
              <h3 className="text-xl font-bold text-slate-800 truncate">{kpi.value}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t.sales} Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t.low_stock}</h3>
          <div className="space-y-4">
            {state.inventory.filter(i => i.quantity < 10).length > 0 ? (
              state.inventory.filter(i => i.quantity < 10).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-rose-600 font-bold">{item.quantity} left</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <i className="fa-solid fa-circle-check text-emerald-400 text-3xl mb-2"></i>
                <p className="text-slate-500">All items are sufficiently stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
