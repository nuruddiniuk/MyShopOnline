
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { BusinessState, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  lang: Language;
  onNavigate?: (page: string, params?: any) => void;
}

const Dashboard: React.FC<Props> = ({ state, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const totalSales = state.sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const inventoryCount = state.inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const customerCount = state.customers.length;
  // Updated to use flatMap for multiple categories
  const categoryCount = new Set(state.inventory.flatMap(i => i.categories).filter(Boolean)).size;

  const kpis = [
    { 
      label: t.total_sales, 
      value: `৳${totalSales.toLocaleString()}`, 
      icon: 'fa-money-bill-trend-up', 
      color: 'bg-indigo-500', 
      target: 'sales' 
    },
    { 
      label: t.total_inventory, 
      value: inventoryCount, 
      icon: 'fa-boxes-stacked', 
      color: 'bg-blue-500', 
      target: 'inventory' 
    },
    { 
      label: t.total_customers, 
      value: customerCount, 
      icon: 'fa-users', 
      color: 'bg-violet-500', 
      target: 'customers' 
    },
    { 
      label: t.total_expenses, 
      value: `৳${totalExpenses.toLocaleString()}`, 
      icon: 'fa-receipt', 
      color: 'bg-rose-500', 
      target: 'expenses' 
    },
    { 
      label: t.total_categories, 
      value: categoryCount, 
      icon: 'fa-folder-tree', 
      color: 'bg-amber-500', 
      target: 'inventory' 
    },
  ];

  const revenueData = [
    { name: 'Mon', revenue: 4200, expenses: 2400 },
    { name: 'Tue', revenue: 3800, expenses: 1398 },
    { name: 'Wed', revenue: 5200, expenses: 2800 },
    { name: 'Thu', revenue: 4780, expenses: 3908 },
    { name: 'Fri', revenue: 5890, expenses: 4800 },
    { name: 'Sat', revenue: 7390, expenses: 3800 },
    { name: 'Sun', revenue: 6490, expenses: 4300 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.dashboard}</h1>
          <p className="text-slate-500 font-medium">{t.welcome}, Business Owner</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigate?.('sales')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm shadow-sm"
          >
            <i className="fa-solid fa-calendar-days mr-2 text-slate-400"></i>
            Last 7 Days
          </button>
          <button 
            onClick={() => onNavigate?.('inventory')}
            className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-100"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            New Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {kpis.map((kpi, idx) => (
          <button 
            key={idx} 
            onClick={() => onNavigate?.(kpi.target)}
            className="group bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all text-left relative overflow-hidden"
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${kpi.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
            <div className={`${kpi.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20 shrink-0`}>
              <i className={`fa-solid ${kpi.icon}`}></i>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
            </div>
            <div className="mt-2 flex items-center text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">
              <span>View Details</span>
              <i className="fa-solid fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Analytics</h3>
              <p className="text-sm text-slate-400 font-medium">Daily performance tracking</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  itemStyle={{fontWeight: 800, fontSize: '12px'}}
                  labelStyle={{fontWeight: 900, marginBottom: '4px', color: '#1e293b'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} />
                <Area type="monotone" dataKey="expenses" stroke="#e2e8f0" strokeWidth={2} fillOpacity={0} animationDuration={2500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.low_stock}</h3>
            <p className="text-sm text-slate-400 font-medium">Action required immediately</p>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
            {state.inventory.filter(i => i.quantity < 10).length > 0 ? (
              state.inventory.filter(i => i.quantity < 10).map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onNavigate?.('inventory', { editId: item.id })}
                  className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white shadow-sm text-rose-500 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.categories.join(', ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-600 font-black text-sm">{item.quantity}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Left</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                <div className="w-16 h-16 bg-white shadow-xl shadow-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 text-2xl mb-4">
                  <i className="fa-solid fa-check"></i>
                </div>
                <p className="font-black text-emerald-800 text-lg">All items in stock</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate?.('inventory')}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Manage Inventory</span>
            <i className="fa-solid fa-arrow-right text-[10px] opacity-50 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
