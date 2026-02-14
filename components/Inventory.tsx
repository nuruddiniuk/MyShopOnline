
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

  // Handle deep linking/navigation parameters (Auto-edit product from Dashboard)
  useEffect(() => {
    if (initialParams?.editId && state.inventory.length > 0) {
      const product = state.inventory.find(p => p.id === initialParams.editId);
      if (product) {
        const timer = setTimeout(() => {
          openEditModal(product);
          clearParams?.();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [initialParams, state.inventory, clearParams]);

  const allAvailableCategories = useMemo(() => {
    const dynamicCats = state.inventory.flatMap(i => i.categories);
    const allCats = new Set([...PRODUCT_CATEGORIES, ...dynamicCats].filter(Boolean));
    return Array.from(allCats).sort();
  }, [state.inventory]);

  const filteredInventory = useMemo(() => {
    return state.inventory.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStock = showLowStockOnly ? item.quantity < 10 : true;
      return matchesSearch && matchesStock;
    });
  }, [state.inventory, searchQuery, showLowStockOnly]);

  const openAddModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: 0, cost: 0, quantity: 0, categories: [], image: '' });
    setCatInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price || 0,
      cost: product.cost || 0,
      quantity: product.quantity || 0,
      categories: product.categories || [],
      image: product.image || ''
    });
    setCatInput('');
    setIsModalOpen(true);
  };

  const handleAddCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (trimmed && !formData.categories?.includes(trimmed)) {
      setFormData({
        ...formData,
        categories: [...(formData.categories || []), trimmed]
      });
    }
    setCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      categories: formData.categories?.filter(c => c !== cat)
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product?')) {
      setState({
        ...state,
        inventory: state.inventory.filter(p => p.id !== id)
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image too large. Please select a file smaller than 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingProduct) {
      const updatedInventory = state.inventory.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: formData.name!, 
              sku: formData.sku?.toUpperCase() || p.sku,
              price: Number(formData.price),
              cost: Number(formData.cost),
              quantity: Number(formData.quantity),
              categories: formData.categories || [],
              image: formData.image
            } 
          : p
      );
      setState({ ...state, inventory: updatedInventory });
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        sku: (formData.sku || `SKU-${Math.floor(Math.random() * 10000)}`).toUpperCase(),
        price: Math.max(0, Number(formData.price)),
        cost: Math.max(0, Number(formData.cost)),
        quantity: Math.max(0, Number(formData.quantity)),
        categories: formData.categories || [],
        image: formData.image
      };
      setState({ ...state, inventory: [newProduct, ...state.inventory] });
    }

    setIsModalOpen(false);
  };

  const margin = (formData.price || 0) - (formData.cost || 0);
  const marginPercent = formData.price ? ((margin / formData.price) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.inventory}</h1>
          <p className="text-sm text-slate-500">{state.inventory.length} items in total</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder={t.search}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
              showLowStockOnly 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-filter mr-2"></i>
            {t.low_stock}
          </button>

          <button 
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <i className="fa-solid fa-plus"></i>
            {t.add_product}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.name}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.price}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.quantity}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors group ${initialParams?.editId === item.id ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-100' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <i className="fa-solid fa-image text-xs"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.categories.map(cat => (
                          <span key={cat} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider whitespace-nowrap">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">৳{item.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${item.quantity < 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {item.quantity < 10 && <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>}
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-slate-900 font-bold">৳{(item.price * item.quantity).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => openEditModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <i className="fa-solid fa-box-open text-5xl mb-4 opacity-20"></i>
                    <p className="text-lg font-medium">{t.no_data}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">{editingProduct ? 'Update Product' : t.add_product}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
                    {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i>}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-white">
                    <i className="fa-solid fa-camera text-xl"></i>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.name}</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.categories?.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                        {cat}
                        <button type="button" onClick={() => handleRemoveCategory(cat)} className="hover:text-rose-500 transition-colors">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      ref={categoryInputRef}
                      type="text" 
                      list="category-suggestions" 
                      placeholder="Type and press enter or select..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                      value={catInput} 
                      onChange={e => setCatInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory(catInput);
                        }
                      }}
                    />
                    <datalist id="category-suggestions">
                      {allAvailableCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <button 
                      type="button"
                      onClick={() => handleAddCategory(catInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-xs p-1"
                    >
                      ADD
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity</label>
                  <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cost (৳)</label>
                  <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price (৳)</label>
                  <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase">Est. Profit Margin</span>
                <span className="font-black text-blue-700">৳{margin.toLocaleString()} ({marginPercent}%)</span>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">{t.cancel}</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200">{editingProduct ? 'Save Changes' : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
