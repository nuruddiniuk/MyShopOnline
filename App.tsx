
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Language, User, BusinessState, Product, Sale, Customer, Expense
} from './types';
import { TRANSLATIONS, DEMO_DATA } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Auth from './components/Auth';
import AIAssistant from './components/AIAssistant';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [businessState, setBusinessState] = useState<BusinessState>({
    inventory: [],
    sales: [],
    customers: [],
    expenses: []
  });

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setNavParams(params || null);
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBusinessState({ inventory: [], sales: [], customers: [], expenses: [] });
    setIsProfileDropdownOpen(false);
  };

  const mapInventoryFromDB = (data: any[]): Product[] => 
    data.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      cost: item.cost,
      quantity: item.quantity,
      image: item.image,
      categories: item.categories || (item.category ? [item.category] : [])
    }));

  const mapSalesFromDB = (data: any[]): Sale[] =>
    data.map(item => ({
      id: item.id,
      date: item.date,
      customerName: item.customer_name || item.customerName,
      totalAmount: item.total_amount || item.totalAmount,
      items: item.items || []
    }));

  const mapCustomersFromDB = (data: any[]): Customer[] =>
    data.map(item => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      totalSpent: item.total_spent || item.totalSpent || 0
    }));

  const mapExpensesFromDB = (data: any[]): Expense[] =>
    data.map(item => ({
      id: item.id,
      date: item.date,
      description: item.description,
      category: item.category,
      amount: item.amount
    }));

  const fetchData = useCallback(async (userId: string) => {
    if (userId.startsWith('demo-')) return;
    try {
      const [inv, sales, cust, exp, prof] = await Promise.all([
        supabase.from('inventory').select('*').eq('user_id', userId),
        supabase.from('sales').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('customers').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      setBusinessState({
        inventory: mapInventoryFromDB(inv.data || []),
        sales: mapSalesFromDB(sales.data || []),
        customers: mapCustomersFromDB(cust.data || []),
        expenses: mapExpensesFromDB(exp.data || [])
      });

      if (prof.data) {
        setUser(prev => prev ? {
          ...prev,
          businessName: prof.data.business_name || prev.businessName || 'MyShop',
          profilePicture: prof.data.profile_picture || undefined
        } : null);
      }
    } catch (err) {
      console.error("Critical error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email!, businessName: 'MyShop' });
        fetchData(session.user.id);
      }
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(prev => ({
          id: session.user.id,
          email: session.user.email!,
          businessName: prev?.businessName || 'MyShop',
          profilePicture: prev?.profilePicture
        }));
        fetchData(session.user.id);
      } else {
        setUser(null);
        setBusinessState({ inventory: [], sales: [], customers: [], expenses: [] });
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleUpdateState = async (newState: BusinessState) => {
    const prev = businessState;
    setBusinessState(newState);

    if (!user || user.id.startsWith('demo-')) return;
    
    setIsSyncing(true);
    try {
      const userId = user.id;

      // Sync Inventory
      if (newState.inventory !== prev.inventory) {
        const addedOrUpdated = newState.inventory.filter(n => {
          const o = prev.inventory.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('inventory').upsert(addedOrUpdated.map(i => ({ ...i, user_id: userId, category: i.categories[0] || '' })));
        }
        const removedIds = prev.inventory.filter(o => !newState.inventory.find(n => n.id === o.id)).map(i => i.id);
        if (removedIds.length > 0) await supabase.from('inventory').delete().in('id', removedIds).eq('user_id', userId);
      }

      // Sync Sales
      if (newState.sales !== prev.sales) {
        const added = newState.sales.filter(n => !prev.sales.find(o => o.id === n.id));
        if (added.length > 0) {
          await supabase.from('sales').insert(added.map(s => ({ 
            id: s.id, date: s.date, customer_name: s.customerName, 
            total_amount: s.totalAmount, items: s.items, user_id: userId 
          })));
        }
        const removedIds = prev.sales.filter(o => !newState.sales.find(n => n.id === o.id)).map(s => s.id);
        if (removedIds.length > 0) await supabase.from('sales').delete().in('id', removedIds).eq('user_id', userId);
      }

      // Sync Customers
      if (newState.customers !== prev.customers) {
        const addedOrUpdated = newState.customers.filter(n => {
          const o = prev.customers.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('customers').upsert(addedOrUpdated.map(c => ({ ...c, user_id: userId, total_spent: c.totalSpent })));
        }
        const removedIds = prev.customers.filter(o => !newState.customers.find(n => n.id === o.id)).map(c => c.id);
        if (removedIds.length > 0) await supabase.from('customers').delete().in('id', removedIds).eq('user_id', userId);
      }

      // Sync Expenses
      if (newState.expenses !== prev.expenses) {
        const addedOrUpdated = newState.expenses.filter(n => {
          const o = prev.expenses.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('expenses').upsert(addedOrUpdated.map(e => ({ ...e, user_id: userId })));
        }
        const removedIds = prev.expenses.filter(o => !newState.expenses.find(n => n.id === o.id)).map(e => e.id);
        if (removedIds.length > 0) await supabase.from('expenses').delete().in('id', removedIds).eq('user_id', userId);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = () => {
    const msg = lang === 'bn' ? 'সব ডেটা মুছে ফেলার ব্যাপারে আপনি কি নিশ্চিত? এটি আর ফিরিয়ে আনা যাবে না।' : 'Are you sure you want to clear ALL data? This cannot be undone.';
    if (window.confirm(msg)) {
      handleUpdateState({ inventory: [], sales: [], customers: [], expenses: [] });
    }
  };

  const handleLoadDemo = () => {
    handleUpdateState(DEMO_DATA);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (user && !user.id.startsWith('demo-')) {
      await supabase.from('profiles').upsert({ id: user.id, business_name: updatedUser.businessName, profile_picture: updatedUser.profilePicture });
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Initializing MyShop...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth onLogin={setUser} lang={lang} toggleLanguage={() => setLang(prev => prev === 'en' ? 'bn' : 'en')} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard state={businessState} lang={lang} onNavigate={handleNavigate} />;
      case 'inventory': return <Inventory state={businessState} setState={handleUpdateState} lang={lang} initialParams={navParams} clearParams={() => setNavParams(null)} />;
      case 'sales': return <Sales state={businessState} setState={handleUpdateState} lang={lang} />;
      case 'customers': return <Customers state={businessState} setState={handleUpdateState} lang={lang} />;
      case 'expenses': return <Expenses state={businessState} setState={handleUpdateState} lang={lang} />;
      case 'reports': return <Reports state={businessState} lang={lang} />;
      case 'settings': return <Settings user={user} onUpdateUser={handleUpdateUser} onLoadDemo={handleLoadDemo} onClearData={handleClearData} lang={lang} isSyncing={isSyncing} />;
      default: return <Dashboard state={businessState} lang={lang} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-['Inter',_sans-serif]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} lang={lang} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><i className="fa-solid fa-bars text-xl"></i></button>
          <div className="flex items-center gap-4 ml-auto">
            <button onClick={() => setLang(prev => prev === 'en' ? 'bn' : 'en')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">{TRANSLATIONS[lang].language_toggle}</button>
            <div className="relative">
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-200">
                  {user.profilePicture ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : <span>{user.businessName.charAt(0)}</span>}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.businessName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                </div>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button onClick={() => handleNavigate('settings')} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><i className="fa-solid fa-user-gear w-4"></i>Settings</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"><i className="fa-solid fa-right-from-bracket w-4"></i>Logout</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderPage()}</main>
      </div>
      <AIAssistant state={businessState} lang={lang} />
    </div>
  );
};

export default App;
