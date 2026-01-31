
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

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, profile_picture')
          .eq('id', data.user.id)
          .single();

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

        // Create profile
        await supabase.from('profiles').insert({
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
      subtext: "একটি সহজ ও আধুনিক ব্যবসা পরিচালনা পদ্ধতি যা আপনার সময় বাঁচাবে এবং ব্যবসার গতি ও লাভ বহুগুণ বাড়িয়ে তুলবে।"
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Inter',_sans-serif] selection:bg-purple-100 overflow-hidden">
      {/* Left Side: Solid purple to blue gradient branding panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-gradient-to-br from-[#6D28D9] via-[#4F46E5] to-[#2563EB] p-16 flex-col relative overflow-hidden">
        {/* Subtle decorative circles for a professional SaaS feel */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
          <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-white/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-blue-300/30 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
        </div>
        
        {/* Logo at Top Left */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/30 shadow-2xl">
            <i className="fa-solid fa-store text-lg"></i>
          </div>
          <span className="text-2xl font-black text-white tracking-tighter uppercase italic">MyShop</span>
        </div>
        
        {/* Branding Content - Positioned Lower as requested */}
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

        {/* Panel Footer */}
        <div className="relative z-10 flex gap-8 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">
          <span className="hover:text-white transition-colors cursor-pointer">© 2024 MYSHOP PLATFORM</span>
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
        </div>
      </div>

      {/* Right Side: White background with centered login card */}
      <div className="flex-1 flex flex-col relative bg-white overflow-y-auto">
        {/* Language Toggle and Mobile Logo */}
        <div className="p-6 md:p-10 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-store"></i>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg italic">MyShop</span>
          </div>
          <button 
            onClick={toggleLanguage}
            className="ml-auto px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-[#4F46E5] hover:bg-slate-50 transition-all border border-slate-200 rounded-full bg-white shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-language text-slate-400"></i>
            {t.language_toggle}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            {/* Header section of the login card */}
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                {isLogin ? (lang === 'bn' ? 'স্বাগতম!' : 'Welcome!') : (lang === 'bn' ? 'শুরু করুন!' : 'Get Started!')}
              </h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                {isLogin 
                  ? (lang === 'bn' ? 'চালিয়ে যেতে আপনার অ্যাকাউন্টে লগইন করুন' : 'Login to your business dashboard to continue')
                  : (lang === 'bn' ? 'আপনার ব্যবসার জন্য নতুন অ্যাকাউন্ট খুলুন' : 'Create a new account for your business')
                }
              </p>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-2xl text-sm animate-in fade-in slide-in-from-top-1 flex items-start gap-3 shadow-sm">
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
                  <div className="relative group">
                    <i className="fa-solid fa-shop absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#4F46E5] transition-colors"></i>
                    <input 
                      type="text" required 
                      className="w-full pl-14 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium shadow-sm"
                      placeholder={lang === 'bn' ? 'আপনার দোকানের নাম দিন' : 'Enter your shop name'}
                      value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-[0.15em]">
                  {lang === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                </label>
                <div className="relative group">
                  <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#4F46E5] transition-colors"></i>
                  <input 
                    type="email" required 
                    className="w-full pl-14 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium shadow-sm"
                    placeholder="name@company.com"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  {isLogin && (
                    <button type="button" className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors uppercase tracking-[0.1em]">
                      {lang === 'bn' ? 'ভুলে গেছেন?' : 'Forgot?'}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#4F46E5] transition-colors"></i>
                  <input 
                    type="password" required 
                    className="w-full pl-14 pr-5 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#4F46E5]/10 focus:border-[#4F46E5] outline-none transition-all placeholder:text-slate-300 text-slate-800 font-medium tracking-[0.3em] shadow-sm"
                    placeholder="••••••••"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4F46E5] text-white py-5 rounded-2xl font-black text-xl hover:bg-[#4338CA] active:scale-[0.98] transition-all shadow-xl shadow-[#4F46E5]/20 mt-8 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-4 group h-[74px]"
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i>
                ) : (
                  <>
                    <span>{isLogin ? (lang === 'bn' ? 'লগইন' : 'Login') : (lang === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Create Account')}</span>
                    <i className="fa-solid fa-arrow-right text-sm opacity-50 group-hover:translate-x-2 transition-transform"></i>
                  </>
                )}
              </button>
            </form>

            <div className="mt-16 text-center">
              <p className="text-slate-500 font-medium text-lg">
                {isLogin 
                  ? (lang === 'bn' ? 'নতুন ইউজার?' : "Don't have an account?") 
                  : (lang === 'bn' ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে?' : "Already have an account?")
                }
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="ml-3 text-[#4F46E5] font-black hover:underline underline-offset-8 decoration-2"
                >
                  {isLogin 
                    ? (lang === 'bn' ? 'সাইন আপ করুন' : 'Sign Up Free') 
                    : (lang === 'bn' ? 'লগইন করুন' : 'Sign In')
                  }
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
