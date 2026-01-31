
import React, { useState, useRef } from 'react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Props {
  user: User;
  onUpdateUser: (u: User) => void;
  onLoadDemo: () => void;
  onClearData: () => void;
  lang: Language;
}

const Settings: React.FC<Props> = ({ user, onUpdateUser, onLoadDemo, onClearData, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.businessName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    
    onUpdateUser({
      ...user,
      businessName: editedName
    });
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Image too large. Please select a file smaller than 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({
          ...user,
          profilePicture: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    onUpdateUser({
      ...user,
      profilePicture: undefined
    });
  };

  return (
    <div className="max-w-2xl space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">{t.settings}</h1>
        <p className="text-slate-500">Manage your business profile and data preferences</p>
      </div>

      {/* Business Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Business Profile</h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              Edit Profile
            </button>
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-slate-400">{user.businessName.charAt(0)}</span>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Photo"
              >
                <i className="fa-solid fa-camera text-xl"></i>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-slate-800">Profile Picture</h4>
              <p className="text-sm text-slate-500 mb-2">JPG or PNG. Max size 2MB.</p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  Upload New
                </button>
                {user.profilePicture && (
                  <button 
                    onClick={removeProfilePicture}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Business Name</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setEditedName(user.businessName);
                    setIsEditing(false);
                  }}
                  className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Business Name</label>
                <p className="text-lg font-semibold text-slate-800">{user.businessName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
                <p className="text-slate-700">{user.email}</p>
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">User ID: {user.id}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{t.demo_data}</h3>
          <p className="text-sm text-slate-500 mt-1">Populate or clear your local database for testing</p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onLoadDemo}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <i className="fa-solid fa-database"></i>
            {t.load_demo}
          </button>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all business data? This action cannot be undone.")) {
                onClearData();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-rose-100 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all"
          >
            <i className="fa-solid fa-trash-can"></i>
            {t.clear_demo}
          </button>
        </div>
      </div>

      {/* System Info Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">System Information</h3>
        </div>
        <div className="p-6 text-sm text-slate-500 space-y-2">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono font-medium text-slate-700">1.0.0 Stable</span>
          </div>
          <div className="flex justify-between">
            <span>Data Storage</span>
            <span className="font-medium text-slate-700">User-Keyed LocalStorage</span>
          </div>
          <div className="flex justify-between">
            <span>Language Support</span>
            <span className="font-medium text-slate-700">English, Bengali</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
