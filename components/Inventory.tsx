
import React, { useState, useMemo, useRef } from 'react';
import { BusinessState, Language, Product } from '../types';
import { TRANSLATIONS, PRODUCT_CATEGORIES } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
}

const Inventory: React.FC<Props> = ({ state, setState, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', price: 0, cost: 0, quantity: 0, category: '', image: ''
  });

  // Calculate distinct categories for suggestions, merging predefined and existing ones
  const categories = useMemo(() => {
    const dynamicCats = state.inventory.map(i => i.category);
    const allCats = new Set([...PRODUCT_CATEGORIES, ...dynamicCats].filter(Boolean));
    return Array.from(allCats).sort();
  }, [state.inventory]);

  const filteredInventory = useMemo(() => {
    return state.inventory.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = showLowStockOnly ? item.quantity < 10 : true;
      return matchesSearch && matchesStock;
    });
  }, [state.inventory, searchQuery, showLowStockOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: 0, cost: 0, quantity: 0, category: '', image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
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
      if (file.size > 1024 * 1024) { // 1MB limit for products
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
    if (!formData.name || formData.price === undefined || formData.cost === undefined) return;

    if (editingProduct) {
      // Update existing
      const updatedInventory = state.inventory.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: formData.name!, 
              sku: formData.sku?.toUpperCase() || p.sku,
              price: Number(formData.price),
              cost: Number(formData.cost),
              quantity: Number(formData.quantity),
              category: formData.category || 'General',
              image: formData.image
            } 
          : p
      );
      setState({ ...state, inventory: updatedInventory });
    } else {
      // Add new
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        sku: (formData.sku || `SKU-${Math.floor(Math.random() * 10000)}`).toUpperCase(),
        price: Math.max(0, Number(formData.price)),
        cost: Math.max(0, Number(formData.cost)),
        quantity: Math.max(0, Number(formData.quantity)),
        category: formData.category || 'General',
        image: formData.image
      };
      setState({ ...state, inventory: [newProduct, ...state.inventory] });
    }

    setIsModalOpen(false);
    setFormData({ name: '', sku: '', price: 0, cost: 0, quantity: 0, category: '', image: '' });
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.price}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.quantity}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Stock Value</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
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
                    <td className="px-6 py-4 text-slate-500 font-mono text-sm">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">৳{item.price.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Cost: ৳{item.cost}</div>
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
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <i className="fa-solid fa-box-open text-5xl mb-4"></i>
                      <p className="text-lg font-medium">{t.no_data}</p>
                    </div>
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
              <h3 className="text-2xl font-bold text-slate-800">
                {editingProduct ? 'Update Product' : t.add_product}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300 mb-2"></i>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Photo</p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-white"
                  >
                    <i className="fa-solid fa-camera text-xl"></i>
                  </button>
                  {formData.image && (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image: ''})}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
                <input 
                  type="file" ref={fileInputRef} className="hidden" accept="image/*" 
                  onChange={handleFileChange}
                />
                <p className="mt-2 text-[10px] text-slate-400 font-medium">JPG/PNG, Max 1MB</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.name}</label>
                  <div className="relative">
                    <i className="fa-solid fa-tag absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text" required autoFocus
                      placeholder="e.g. Organic Brown Rice"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SKU / Barcode</label>
                  <div className="relative">
                    <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text"
                      placeholder="Optional"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <div className="relative">
                    <i className="fa-solid fa-folder-tree absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text" list="category-suggestions"
                      placeholder="e.g. Groceries"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                    <datalist id="category-suggestions">
                      {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cost (Per Unit)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input 
                      type="number" required min="0" step="0.01"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selling Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input 
                      type="number" required min="0" step="0.01"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Quantity</label>
                  <div className="relative">
                    <i className="fa-solid fa-cubes absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="number" required min="0"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`w-full p-3 rounded-xl border flex flex-col justify-center items-center ${margin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Margin</span>
                    <span className={`text-lg font-black ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {margin >= 0 ? '+' : ''}৳{margin.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">({marginPercent}%)</span>
                  </div>
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
                  {editingProduct ? 'Save Changes' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
