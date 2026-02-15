
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BusinessState, Language, Product } from '../types';
import { TRANSLATIONS, PRODUCT_CATEGORIES } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
  initialParams?: any;
  clearParams?: () => void;
}

const Inventory: React.FC<Props> = ({ state, setState, lang, initialParams, clearParams }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', price: 0, cost: 0, quantity: 0, categories: [], image: ''
  });
  const [catInput, setCatInput] = useState('');

  useEffect(() => {
    if (initialParams?.addNew) {
      setTimeout(() => openAddModal(), 50);
      clearParams?.();
    }
    if (initialParams?.editId) {
      const product = state.inventory.find(p => p.id === initialParams.editId);
      if (product) {
        setTimeout(() => openEditModal(product), 50);
        clearParams?.();
      }
    }
  }, [initialParams, state.inventory, clearParams]);

  const filteredInventory = useMemo(() => {
    return state.inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = showLowStockOnly ? item.quantity < 10 : true;
      return matchesSearch && matchesStock;
    });
  }, [state.inventory, searchQuery, showLowStockOnly]);

  const openAddModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: 0, cost: 0, quantity: 0, categories: [], image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = lang === 'bn' ? 'আপনি কি এই পণ্যটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this product?';
    if (window.confirm(msg)) {
      setState({ ...state, inventory: state.inventory.filter(p => p.id !== id) });
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = lang === 'bn' ? 'ইনভেন্টরির সব পণ্য মুছে ফেলতে চান?' : 'Clear entire inventory?';
    if (window.confirm(msg)) {
      setState({ ...state, inventory: [] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingProduct) {
      const updated = state.inventory.map(p => p.id === editingProduct.id ? { ...p, ...formData as Product } : p);
      setState({ ...state, inventory: updated });
    } else {
      const newItem: Product = {
        id: Date.now().toString(),
        name: formData.name!,
        sku: (formData.sku || `SKU-${Math.floor(Math.random() * 10000)}`).toUpperCase(),
        price: Number(formData.price),
        cost: Number(formData.cost),
        quantity: Number(formData.quantity),
        categories: formData.categories || [],
        image: formData.image
      };
      setState({ ...state, inventory: [newItem, ...state.inventory] });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.inventory}</h1>
          <p className="text-sm text-slate-500">{state.inventory.length} items total</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder={t.search} className="px-4 py-2 border rounded-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <button type="button" onClick={handleClearAll} className="px-4 py-2 text-rose-600 border border-rose-200 rounded-lg font-bold hover:bg-rose-50">Clear All</button>
          <button type="button" onClick={(e) => openAddModal(e)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">{t.add_product}</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{item.name}</td>
                <td className="px-6 py-4">৳{item.price}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={(e) => openEditModal(item, e)} className="p-2 text-blue-600"><i className="fa-solid fa-pen"></i></button>
                    <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-rose-600"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold mb-6">{editingProduct ? 'Edit' : 'Add'} Product</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Name" className="w-full p-3 border rounded-xl" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input type="number" placeholder="Price" className="w-full p-3 border rounded-xl" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
              <input type="number" placeholder="Stock" className="w-full p-3 border rounded-xl" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 border rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
