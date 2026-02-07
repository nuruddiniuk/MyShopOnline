
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
  const [navParams, setNavParams] = useState<any>(null); // For passing data between pages
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBusinessState({ inventory: [], sales: [], customers: [], expenses: [] });
  };

  // Fetch all business data from Supabase
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
        inventory: inv.data || [],
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
      } else {
        // Ensure name is at least 'MyShop' if no profile exists
        setUser(prev => prev ? { ...prev, businessName: prev.businessName === 'Loading...' ? 'MyShop' : prev.businessName } : null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
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

  const handleUpdateState = async (newState: BusinessState) => {
    if (!user || user.id.startsWith('demo-')) {
      setBusinessState(newState);
      return;
    }
    
    const prev = businessState;
    setBusinessState(newState);

    try {
      if (newState.inventory !== prev.inventory) {
        const addedOrUpdated = newState.inventory.filter(n => {
          const o = prev.inventory.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('inventory').upsert(addedOrUpdated.map(i => ({ ...i, user_id: user.id })));
        }
        const removed = prev.inventory.filter(o => !newState.inventory.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('inventory').delete().eq('id', item.id).eq('user_id', user.id);
        }
      }
      if (newState.sales !== prev.sales) {
        const added = newState.sales.filter(n => !prev.sales.find(o => o.id === n.id));
        if (added.length > 0) {
          await supabase.from('sales').insert(added.map(s => ({ ...s, user_id: user.id })));
        }
      }
      if (newState.customers !== prev.customers) {
        const addedOrUpdated = newState.customers.filter(n => {
          const o = prev.customers.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('customers').upsert(addedOrUpdated.map(c => ({ ...c, user_id: user.id })));
        }
        const removed = prev.customers.filter(o => !newState.customers.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('customers').delete().eq('id', item.id).eq('user_id', user.id);
        }
      }
      if (newState.expenses !== prev.expenses) {
        const addedOrUpdated = newState.expenses.filter(n => {
          const o = prev.expenses.find(p => p.id === n.id);
          return !o || JSON.stringify(o) !== JSON.stringify(n);
        });
        if (addedOrUpdated.length > 0) {
          await supabase.from('expenses').upsert(addedOrUpdated.map(e => ({ ...e, user_id: user.id })));
        }
        const removed = prev.expenses.filter(o => !newState.expenses.find(n => n.id === o.id));
        for (const item of removed) {
          await supabase.from('expenses').delete().eq('id', item.id).eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error("Supabase sync error:", error);
    }
  };

  const handleLoadDemo = async () => {
    if (!user) return;
    const userId = user.id;

    if (userId.startsWith('demo-')) {
      setBusinessState({
        inventory: [...DEMO_DATA.inventory] as Product[],
        sales: [...DEMO_DATA.sales] as Sale[],
        customers: [...DEMO_DATA.customers] as Customer[],
        expenses: [...DEMO_DATA.expenses] as Expense[]
      });
      return;
    }

    const invWithUser = DEMO_DATA.inventory.map(i => ({ ...i, user_id: userId }));
    const salesWithUser = DEMO_DATA.sales.map(s => ({ ...s, user_id: userId }));
    const custWithUser = DEMO_DATA.customers.map(c => ({ ...c, user_id: userId }));
    const expWithUser = DEMO_DATA.expenses.map(e => ({ ...e, user_id: userId }));

    await Promise.all([
      supabase.from('inventory').upsert(invWithUser),
      supabase.from('sales').upsert(salesWithUser),
      supabase.from('customers').upsert(custWithUser),
      supabase.from('expenses').upsert(expWithUser)
    ]);
    
    fetchData(userId);
  };

  const handleClearData = async () => {
    if (!user) return;
    const userId = user.id;
    if (!userId.startsWith('demo-')) {
      await Promise.all([
        supabase.from('inventory').delete().eq('user_id', userId),
        supabase.from('sales').delete().eq('user_id', userId),
        supabase.from('customers').delete().eq('user_id', userId),
        supabase.from('expenses').delete().eq('user_id', userId)
      ]);
    }
    setBusinessState({ inventory: [], sales: [], customers: [], expenses: [] });
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.id.startsWith('demo-')) return;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: updatedUser.id,
        business_name: updatedUser.businessName,
        profile_picture: updatedUser.profilePicture || null 
      });
      if (error) console.error("Profile sync error:", error.message);
    } catch (error) {
      console.error("Critical profile update failure:", error);
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
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-md md:hidden"
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')}
              className="px-3 py-1 text-sm font-medium border rounded-full hover:bg-slate-50 transition-colors"
            >
              {t.language_toggle}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-slate-100 shadow-sm">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.businessName.charAt(0)
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="font-bold text-slate-700 text-sm">{user.businessName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                title={t.logout}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
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
