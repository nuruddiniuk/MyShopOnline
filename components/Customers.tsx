
import React, { useState } from 'react';
import { BusinessState, Language, Customer } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
}

const Customers: React.FC<Props> = ({ state, setState, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingCustomer) {
      const updatedCustomers = state.customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, name: formData.name, phone: formData.phone, email: formData.email }
          : c
      );
      setState({
        ...state,
        customers: updatedCustomers
      });
    } else {
      const newCustomer: Customer = {
        id: 'cust-' + Date.now(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        totalSpent: 0
      };
      setState({
        ...state,
        customers: [newCustomer, ...state.customers]
      });
    }

    setIsModalOpen(false);
    setFormData({ name: '', phone: '', email: '' });
    setEditingCustomer(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this customer? This action cannot be undone.')) {
      setState({
        ...state,
        customers: state.customers.filter(c => c.id !== id)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.customers}</h1>
          <p className="text-sm text-slate-500">{state.customers.length} registered customers</p>
        </div>
        <button 
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <i className="fa-solid fa-user-plus"></i>
          {t.add_customer}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.customers.length > 0 ? (
          state.customers.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 relative group hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 truncate pr-12" title={c.name}>{c.name}</h3>
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button 
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                      title="Edit Customer"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(e, c.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                      title="Delete Customer"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <i className="fa-solid fa-phone text-[10px] w-3"></i>
                  {c.phone}
                </p>
                {c.email && (
                  <p className="text-sm text-slate-400 flex items-center gap-2 mt-0.5 truncate" title={c.email}>
                    <i className="fa-solid fa-envelope text-[10px] w-3"></i>
                    {c.email}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Spent</span>
                  <span className="font-bold text-blue-600">৳{c.totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <div className="flex flex-col items-center opacity-40">
              <i className="fa-solid fa-users text-5xl mb-4"></i>
              <p className="text-lg font-medium">{t.no_data}</p>
              <p className="text-sm">Click "{t.add_customer}" to grow your client list</p>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800">
                {editingCustomer ? 'Edit Customer' : t.add_customer}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Name *</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" required autoFocus
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number *</label>
                <div className="relative">
                  <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="tel" required
                    placeholder="e.g. 01711223344"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="email"
                    placeholder="optional@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
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
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  {editingCustomer ? t.save : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
