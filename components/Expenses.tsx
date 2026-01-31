
import React, { useState } from 'react';
import { BusinessState, Language, Expense } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
}

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Supplies",
  "Marketing",
  "Maintenance",
  "Taxes",
  "Others"
];

const Expenses: React.FC<Props> = ({ state, setState, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Others',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      category: 'Others',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      description: exp.description,
      category: exp.category,
      amount: exp.amount.toString(),
      date: exp.date
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    if (editingExpense) {
      // Update existing expense
      const updatedExpenses = state.expenses.map(exp => 
        exp.id === editingExpense.id 
          ? { ...exp, description: formData.description, category: formData.category, amount: Number(formData.amount), date: formData.date }
          : exp
      );
      setState({
        ...state,
        expenses: updatedExpenses
      });
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: 'exp-' + Date.now(),
        description: formData.description,
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date
      };
      setState({
        ...state,
        expenses: [newExpense, ...state.expenses]
      });
    }

    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      category: 'Others',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      setState({
        ...state,
        expenses: state.expenses.filter(e => e.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.expenses}</h1>
          <p className="text-sm text-slate-500">Track your business overheads and spending</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
        >
          <i className="fa-solid fa-plus"></i>
          {t.add_expense}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.expenses.length > 0 ? (
                state.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 text-sm">{exp.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{exp.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600">৳{exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(exp)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit record"
                        >
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete record"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center opacity-40">
                      <i className="fa-solid fa-file-invoice-dollar text-5xl mb-4"></i>
                      <p className="text-lg font-medium">{t.no_data}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800">
                {editingExpense ? 'Update Expense' : t.add_expense}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description *</label>
                <div className="relative">
                  <i className="fa-solid fa-pen absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" required autoFocus
                    placeholder="e.g. Electricity Bill Oct"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <div className="relative">
                    <i className="fa-solid fa-tags absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <select 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none appearance-none transition-all"
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (৳) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input 
                      type="number" required min="0" step="0.01"
                      placeholder="0.00"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                <div className="relative">
                  <i className="fa-solid fa-calendar-days absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="date" required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                >
                  {editingExpense ? 'Update' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
