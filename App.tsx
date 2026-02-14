
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
  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Business State
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

  // Improved fetchData with format mapping for backward compatibility
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

      // Map inventory to ensure 'categories' array exists even if DB uses old 'category' string
      const mappedInventory: Product[] = (inv.data || []).map((item: any) => ({
        ...item,
        categories: item.categories || (item.category ? [item.category] : [])
      }));

      setBusinessState({
        inventory: mappedInventory,
        sales: sales.data || [],
        customers: cust.data || [],
        expenses: exp.data || []
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
        setUser({
          id: session.user.id,
          email: session.user.email!,
          businessName: 'MyShop'
        });
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

  // Enhanced handleUpdateState with better diffing and data mapping
  const handleUpdateState = async (newState: BusinessState) => {
    // 1. Optimistic local update
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
          const dbInventory = addedOrUpdated.map(i => ({
            ...i,
            user_id: userId,
            category: i.categories[0] || '' 
          }));
          const { error } = await supabase.from('inventory').upsert(dbInventory);
          if (error) throw error;
        }

        const removed = prev.inventory.filter(o => !newState.inventory.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('inventory').delete().eq('id', item.id).eq('user_id', userId);
        }
      }

      // Sync Sales (Detecting Additions and Deletions)
      if (newState.sales !== prev.sales) {
        const added = newState.sales.filter(n => !prev.sales.find(o => o.id === n.id));
        if (added.length > 0) {
          const { error } = await supabase.from('sales').insert(added.map(s => ({ ...s, user_id: userId })));
          if (error) throw error;
        }

        const removed = prev.sales.filter(o => !newState.sales.find(n => n.id === o.id));
        for (const sale of removed) {
          await supabase.from('sales').delete().eq('id', sale.id).eq('user_id', userId);
        }
      }

      // Sync Customers
      if (newState.customers !== prev.customers) {
        const addedOrUpdated = newState.customers.filter(n => {
          const o = prev.customers.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          const { error } = await supabase.from('customers').upsert(addedOrUpdated.map(c => ({ ...c, user_id: userId })));
          if (error) throw error;
        }
        const removed = prev.customers.filter(o => !newState.customers.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('customers').delete().eq('id', item.id).eq('user_id', userId);
        }
      }

      // Sync Expenses
      if (newState.expenses !== prev.expenses) {
        const addedOrUpdated = newState.expenses.filter(n => {
          const o = prev.expenses.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          const { error } = await supabase.from('expenses').upsert(addedOrUpdated.map(e => ({ ...e, user_id: userId })));
          if (error) throw error;
        }
        const removed = prev.expenses.filter(o => !newState.expenses.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('expenses').delete().eq('id', item.id).eq('user_id', userId);
        }
      }
    } catch (error) {
      console.error("Supabase sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadDemo = async () => {
    if (!user) return;
    setIsSyncing(true);
    const userId = user.id;

    if (userId.startsWith('demo-')) {
      setBusinessState({
        inventory: JSON.parse(JSON.stringify(DEMO_DATA.inventory)),
        sales: JSON.parse(JSON.stringify(DEMO_DATA.sales)),
        customers: JSON.parse(JSON.stringify(DEMO_DATA.customers)),
        expenses: JSON.parse(JSON.stringify(DEMO_DATA.expenses))
      });
      setIsSyncing(false);
      return;
    }

    try {
      const invWithUser = DEMO_DATA.inventory.map(i => ({ ...i, user_id: userId, category: i.categories[0] || '' }));
      const salesWithUser = DEMO_DATA.sales.map(s => ({ ...s, user_id: userId }));
      const custWithUser = DEMO_DATA.customers.map(c => ({ ...c, user_id: userId }));
      const expWithUser = DEMO_DATA.expenses.map(e => ({ ...e, user_id: userId }));

      await Promise.allSettled([
        supabase.from('inventory').upsert(invWithUser),
        supabase.from('sales').upsert(salesWithUser),
        supabase.from('customers').upsert(custWithUser),
        supabase.from('expenses').upsert(expWithUser)
      ]);
      
      await fetchData(userId);
    } catch (err) {
      console.error("Demo load failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    setBusinessState({ 
      inventory: [], 
      sales: [], 
      customers: [], 
      expenses: [] 
    });

    const userId = user.id;

    try {
      if (!userId.startsWith('demo-')) {
        await Promise.allSettled([
          supabase.from('sales').delete().eq('user_id', userId),
          supabase.from('inventory').delete().eq('user_id', userId),
          supabase.from('customers').delete().eq('user_id', userId),
          supabase.from('expenses').delete().eq('user_id', userId)
        ]);
      }
    } catch (err) {
      console.error("Critical error during data clearing:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.id.startsWith('demo-')) return;
    try {
      await supabase.from('profiles').upsert({
        id: updatedUser.id,
        business_name: updatedUser.businessName,
        profile_picture: updatedUser.profilePicture || null 
      });
    } catch (error) {
      console.error("Profile update failure:", error);
    }
  };

  const t = TRANSLATIONS[lang];

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest text-sm opacity-50 uppercase">Initialising MyShop</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} lang={lang} toggleLanguage={() => setLang(l => l === 'en' ? 'bn' : 'en')} />;
  }

  const renderContent = () => {
    const wrappedSetState = (newState: BusinessState) => handleUpdateState(newState);
    
    switch (currentPage) {
      case 'dashboard': return <Dashboard state={businessState} lang={lang} onNavigate={handleNavigate} />;
      case 'inventory': return <Inventory state={businessState} setState={wrappedSetState} lang={lang} initialParams={navParams} clearParams={() => setNavParams(null)} />;
      case 'sales': return <Sales state={businessState} setState={wrappedSetState} lang={lang} />;
      case 'customers': return <Customers state={businessState} setState={wrappedSetState} lang={lang} />;
      case 'expenses': return <Expenses state={businessState} setState={wrappedSetState} lang={lang} />;
      case 'reports': return <Reports state={businessState} lang={lang} />;
      case 'settings': return (
        <Settings 
          user={user} 
          onUpdateUser={handleUpdateUser}
          onLoadDemo={handleLoadDemo} 
          onClearData={handleClearData} 
          lang={lang} 
          isSyncing={isSyncing}
        />
      );
      default: return <Dashboard state={businessState} lang={lang} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(true)}
        />
      )}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentPage={currentPage} 
        setCurrentPage={handleNavigate} 
        onLogout={handleLogout}
        lang={lang}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-md md:hidden"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            {isSyncing && (
              <div className="flex items-center gap-2 text-blue-600 animate-pulse text-xs font-bold mr-2">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            )}
            <button 
              onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')}
              className="px-3 py-1 text-sm font-medium border rounded-full hover:bg-slate-100 transition-colors"
            >
              {t.language_toggle}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all duration-200 ${isProfileDropdownOpen ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-slate-100 shadow-sm">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.businessName.charAt(0)
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]">{user.businessName}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Owner</span>
                </div>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Logged in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleNavigate('settings')}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <i className="fa-solid fa-gear text-slate-400"></i>
                      <span>{t.settings}</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors font-medium"
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket text-rose-400"></i>
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
      <AIAssistant state={businessState} lang={lang} />
    </div>
  );
};

export default App;
