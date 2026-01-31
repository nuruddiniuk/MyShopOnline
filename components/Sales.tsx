
import React, { useState, useMemo, useEffect } from 'react';
import { BusinessState, Language, Sale, Product, Customer } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  state: BusinessState;
  setState: (s: BusinessState) => void;
  lang: Language;
}

interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

const Sales: React.FC<Props> = ({ state, setState, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sale Form State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [currentItems, setCurrentItems] = useState<SaleItem[]>([]);
  
  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [isProductListOpen, setIsProductListOpen] = useState(false);

  // Auto-lookup customer by phone
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const found = state.customers.find(c => c.phone === customerPhone);
      if (found) {
        setCustomerName(found.name);
        setIsExistingCustomer(true);
      } else {
        setIsExistingCustomer(false);
      }
    } else {
      setIsExistingCustomer(false);
    }
  }, [customerPhone, state.customers]);

  const totalAmount = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [currentItems]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return state.inventory.filter(p => p.quantity > 0).slice(0, 5);
    const query = productSearch.toLowerCase();
    return state.inventory.filter(p => 
      p.quantity > 0 && (
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      )
    ).slice(0, 10);
  }, [state.inventory, productSearch]);

  const handleProductSelect = (product: Product) => {
    const existing = currentItems.find(i => i.productId === product.id);
    if (existing) {
      setCurrentItems(currentItems.map(i => 
        i.productId === product.id 
          ? { ...i, quantity: Math.min(i.quantity + 1, product.quantity) } 
          : i
      ));
    } else {
      setCurrentItems([...currentItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
    setProductSearch('');
    setIsProductListOpen(false);
  };

  const removeItem = (id: string) => {
    setCurrentItems(currentItems.filter(i => i.productId !== id));
  };

  const updateItemQuantity = (id: string, qty: number) => {
    const product = state.inventory.find(p => p.id === id);
    if (!product) return;
    const safeQty = Math.max(1, Math.min(qty, product.quantity));
    setCurrentItems(currentItems.map(i => 
      i.productId === id ? { ...i, quantity: safeQty } : i
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItems.length === 0 || !customerPhone) return;

    const saleId = 'sale-' + Date.now();
    const finalCustomerName = customerName || 'Walking Customer';

    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString().split('T')[0],
      customerName: finalCustomerName,
      items: currentItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price
      })),
      totalAmount: totalAmount
    };

    // Update stock
    const updatedInventory = state.inventory.map(invItem => {
      const soldItem = currentItems.find(si => si.productId === invItem.id);
      if (soldItem) {
        return { ...invItem, quantity: invItem.quantity - soldItem.quantity };
      }
      return invItem;
    });

    // Handle Customer Record (Update spent or create new)
    let updatedCustomers = [...state.customers];
    const customerIdx = updatedCustomers.findIndex(c => c.phone === customerPhone);

    if (customerIdx > -1) {
      // Update existing customer's total spent
      updatedCustomers[customerIdx] = {
        ...updatedCustomers[customerIdx],
        totalSpent: updatedCustomers[customerIdx].totalSpent + totalAmount
      };
    } else {
      // Register new customer
      const newCustomer: Customer = {
        id: 'cust-' + Date.now(),
        name: finalCustomerName,
        phone: customerPhone,
        email: '',
        totalSpent: totalAmount
      };
      updatedCustomers = [newCustomer, ...updatedCustomers];
    }

    setState({
      ...state,
      sales: [newSale, ...state.sales],
      inventory: updatedInventory,
      customers: updatedCustomers
    });

    // Reset and close
    setIsModalOpen(false);
    setCustomerPhone('');
    setCustomerName('');
    setCurrentItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.sales}</h1>
          <p className="text-sm text-slate-500">{state.sales.length} transactions recorded</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <i className="fa-solid fa-cart-plus"></i>
          {t.add_sale}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.customers}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.sales.length > 0 ? (
                state.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{sale.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{sale.customerName}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">৳{sale.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center opacity-40">
                      <i className="fa-solid fa-receipt text-5xl mb-4"></i>
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
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{t.add_sale}</h3>
                <p className="text-xs text-slate-500">Quickly add items and manage customers</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Phone *</label>
                    <div className="relative">
                      <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input 
                        type="tel" required
                        placeholder="017xxxxxxxx"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Name</label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input 
                        type="text"
                        placeholder={isExistingCustomer ? "" : "Register new name"}
                        readOnly={isExistingCustomer}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all ${
                          isExistingCustomer 
                            ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold cursor-default' 
                            : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500'
                        }`}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      {isExistingCustomer && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase">Found</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Products to Add</label>
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                      type="text"
                      placeholder="Type product name or SKU..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={productSearch}
                      onFocus={() => setIsProductListOpen(true)}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsProductListOpen(true);
                      }}
                    />
                  </div>

                  {isProductListOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductSelect(product)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b last:border-0 border-slate-100 transition-colors"
                            >
                              <div>
                                <div className="font-bold text-slate-800">{product.name}</div>
                                <div className="text-xs text-slate-400">SKU: {product.sku}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-blue-600">৳{product.price}</div>
                                <div className={`text-[10px] font-bold uppercase ${product.quantity < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                                  Stock: {product.quantity}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm">No items found matching your search.</div>
                        )}
                      </div>
                      <div className="p-2 bg-slate-50 border-t flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setIsProductListOpen(false)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase px-2 py-1"
                        >
                          Close List
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sale Items</label>
                  {currentItems.length > 0 ? (
                    <div className="border rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-slate-500 font-semibold">Item</th>
                            <th className="px-4 py-2 text-center text-slate-500 font-semibold">Qty</th>
                            <th className="px-4 py-2 text-right text-slate-500 font-semibold">Total</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {currentItems.map(item => (
                            <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[120px]">{item.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200">
                                    <i className="fa-solid fa-minus text-[10px]"></i>
                                  </button>
                                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                                  <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200">
                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">৳{(item.price * item.quantity).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right">
                                <button type="button" onClick={() => removeItem(item.productId)} className="text-rose-400 hover:text-rose-600">
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                      <i className="fa-solid fa-cart-shopping text-3xl mb-3 opacity-20"></i>
                      <p>Search and click a product above to add to cart</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-4">
                   <div className="text-sm font-medium text-slate-500">Grand Total</div>
                   <div className="text-3xl font-black text-blue-600">৳{totalAmount.toLocaleString()}</div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-white transition-colors">
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={currentItems.length === 0 || !customerPhone}
                    className="flex-1 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50"
                  >
                    Save Sale
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
