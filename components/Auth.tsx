
import React, { useState } from 'react';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../services/supabase';

interface Props {
  onLogin: (u: User) => void;
  lang: Language;
  toggleLanguage: () => void;
}

const Auth: React.FC<Props> = ({ onLogin, lang, toggleLanguage }) => {
  const t = TRANSLATIONS[lang];
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: ''
  });

  const handleDemoAccess = () => {
    setIsLoading(true);
    // Simulate a successful login for a demo account
    setTimeout(() => {
      onLogin({
        id: 'demo-user-id',
        email: 'demo@myshop.com',
        businessName: 'My Demo Shop'
      });
      setIsLoading(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Fetch profile - use maybeSingle to be safe
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, profile_picture')
          .eq('id', data.user.id)
          .maybeSingle();

        onLogin({
          id: data.user.id,
          email: data.user.email!,
          businessName: profile?.business_name || 'My Shop',
          profilePicture: profile?.profile_picture
        });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("Signup failed.");

        // Create profile manually (backup for trigger)
        await supabase.from('profiles').upsert({
          id: data.user.id,
          business_name: formData.businessName || 'My Local Shop'
        });

        onLogin({
          id: data.user.id,
          email: data.user.email!,
          businessName: formData.businessName || 'My Local Shop'
        });
      }
    } catch (err: any) {
      setError(err.message || (lang === 'bn' ? "লগইন ব্যর্থ হয়েছে" : "Authentication failed."));
    } finally {
      setIsLoading(false);
    }
  };

  const brandingText = {
    en: {
      headline: "Keep all your business accounts in one place.",
      subtext: "A simple and modern business management system that will save you time and increase business speed and profits many times over."
    },
    bn: {
      headline: "আপনার ব্যবসার সকল হিসাব রাখুন এক জায়গায়।",
      subtext: "একটি সহজ ও আধুনিক ব্যবসা পরিচালনা পদ্ধতি যা আপনার সময় বাঁচাবে এবং ব্যবসার গতি ও লাভ বহুণ বাড়িয়ে তুলবে।"
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Inter',_sans-serif] selection:bg-purple-100 overflow-hidden">
      {/* Left Side: Solid purple to blue gradient branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-gradient-to-br from-[#6D28D9] via-[#4F46E5] to-[#2563EB] p-16 flex-col relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
          <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-white/20 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/30 shadow-2xl">
            <i className="fa-solid fa-store text-lg"></i>
          </div>
          <span className="text-2xl font-black text-white tracking-tighter uppercase italic">MyShop</span>
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col justify-end pb-12 lg:pb-24">
          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            <h1 className={`font-extrabold text-white leading-tight mb-8 drop-shadow-sm ${lang === 'bn' ? 'text-5xl lg:text-7xl' : 'text-6xl lg:text-7xl'}`}>
              {brandingText[lang].headline}
            </h1>
            <p className="text-xl lg:text-2xl text-white/80 leading-relaxed font-light">
              {brandingText[lang].subtext}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Card */}
      <div className="flex-1 flex flex-col relative bg-white overflow-y-auto">
        <div className="p-6 md:p-10 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <button 
            onClick={toggleLanguage}
            className="ml-auto px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-[#4F46E5] border border-slate-200 rounded-full bg-white shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-language text-slate-400"></i>
            {t.language_toggle}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                {isLogin ? (lang === 'bn' ? 'স্বাগতম!' : 'Welcome!') : (lang === 'bn' ? 'শুরু করুন!' : 'Get Started!')}
              </h2>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-2xl text-sm animate-in fade-in flex items-start gap-3 shadow-sm">
                <i className="fa-solid fa-circle-exclamation mt-0.5 text-rose-500"></i>
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-[0.15em]">
                    {lang === 'bn' ? 'দোকানের নাম' : 'Business Name'}
                  </label>
                  <input 
                    type="text" required 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium"
                    placeholder={lang === 'bn' ? 'আপনার দোকানের নাম দিন' : 'Enter your shop name'}
                    value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-[0.15em]">
                  {lang === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                </label>
                <input 
                  type="email" required 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="name@company.com"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase px-1 tracking-[0.15em]">
                  {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <input 
                  type="password" required 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="••••••••"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4F46E5] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#4338CA] transition-all shadow-xl shadow-[#4F46E5]/20 flex items-center justify-center gap-4 h-[74px]"
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i>
                ) : (
                  <span>{isLogin ? (lang === 'bn' ? 'লগইন' : 'Login') : (lang === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Create Account')}</span>
                )}
              </button>

              {isLogin && (
                <button 
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200"
                >
                  Demo Access (Quick Preview)
                </button>
              )}
            </form>

            <div className="mt-12 text-center">
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-[#4F46E5] font-black hover:underline"
              >
                {isLogin 
                  ? (lang === 'bn' ? 'সাইন আপ করুন' : 'Sign Up Free') 
                  : (lang === 'bn' ? 'লগইন করুন' : 'Sign In')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
