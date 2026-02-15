
import React, { useState, useMemo } from 'react';
import { BusinessState, Language, Sale, Product } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
}

const Sales: React.FC<Props> = ({ state, setState, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteSale = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = lang === 'bn' ? 'আপনি কি এই বিক্রয়ের তথ্য মুছে ফেলতে চান?' : 'Are you sure you want to delete this sale record?';
    if (window.confirm(msg)) {
      setState({ ...state, sales: state.sales.filter(s => s.id !== id) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.sales}</h1>
          <p className="text-sm text-slate-500">{state.sales.length} transactions recorded</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">{t.add_sale}</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {state.sales.map(sale => (
              <tr key={sale.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">{sale.date}</td>
                <td className="px-6 py-4">{sale.customerName}</td>
                <td className="px-6 py-4 font-bold">৳{sale.totalAmount}</td>
                <td className="px-6 py-4 text-center">
                  <button type="button" onClick={(e) => handleDeleteSale(e, sale.id)} className="p-2 text-rose-600"><i className="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
