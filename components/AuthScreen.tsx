import React, { useState, useEffect } from 'react';
import { UserInfo, Language } from '../types';
import { UserPlus, ChevronRight, Trash2, ShieldCheck, Globe } from 'lucide-react';
import { t } from '../utils/translations';
import Logo from './Logo';

interface AuthScreenProps {
  onLogin: (user: UserInfo) => void;
  lang?: Language;
  onToggleLang?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, lang = 'ru', onToggleLang }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const T = t[lang];

  useEffect(() => {
    const savedUsers = localStorage.getItem('psy_coun_assist_users_index');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!agreedToTerms) {
        alert("Please accept the terms.");
        return;
    }

    const newUser: UserInfo = {
      id: Date.now().toString(),
      name: newName,
      createdAt: Date.now()
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('psy_coun_assist_users_index', JSON.stringify(updatedUsers));
    onLogin(newUser);
  };

  const handleLoginClick = (user: UserInfo) => {
      if (!agreedToTerms) return;
      onLogin(user);
  };

  const deleteUser = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(!window.confirm("Удалить профиль?")) return;
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      localStorage.setItem('psy_coun_assist_users_index', JSON.stringify(updatedUsers));
      localStorage.removeItem(`psy_coun_assist_data_${id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1917] p-6 text-stone-200 selection:bg-rose-900/30">
      
      {/* Lang Switcher Absolute */}
      {onToggleLang && (
        <button onClick={onToggleLang} className="absolute top-6 right-6 p-2 text-stone-500 hover:text-stone-300 transition-colors flex items-center gap-2 font-mono text-xs">
            <Globe size={16} />
            {lang.toUpperCase()}
        </button>
      )}

      <div className="w-full max-w-md animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-stone-800 to-stone-900 text-stone-200 mb-6 border border-stone-700 shadow-2xl relative overflow-hidden group">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <Logo size={48} className="text-stone-100 relative z-10" />
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-100 mb-2 tracking-tight">
            PSY<span className="italic text-stone-400">assistant</span>
          </h1>
          <p className="text-stone-500 font-light text-sm">{T.auth.subtitle}</p>
        </div>

        {/* Disclaimer Card */}
        <div className={`mb-8 p-5 rounded-2xl border transition-all duration-300 ${agreedToTerms ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-[#252422] border-stone-800'}`}>
             <label className="flex items-start gap-4 cursor-pointer">
                 <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        checked={agreedToTerms} 
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-stone-600 bg-stone-800 transition-all checked:border-emerald-500 checked:bg-emerald-500"
                    />
                    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                            <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                 </div>
                 <div className="flex-1">
                     <p className="text-xs text-stone-400 leading-relaxed font-light">
                        <strong className="text-stone-300 font-medium block mb-1">{T.auth.disclaimerTitle}</strong>
                        {T.auth.disclaimerText}
                     </p>
                 </div>
             </label>
        </div>

        {/* Main Interface */}
        <div className={`transition-all duration-500 ${!agreedToTerms ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
            
            {/* User List */}
            {users.length > 0 && !isCreating && (
                <div className="space-y-3 mb-6">
                    {users.map(user => (
                        <div 
                            key={user.id}
                            onClick={() => handleLoginClick(user)}
                            className="group relative flex items-center justify-between p-4 bg-[#292524] hover:bg-[#353331] border border-stone-800 rounded-xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
                        >
                            <span className="font-serif text-stone-200">{user.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-stone-600 font-mono">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                                <ChevronRight size={16} className="text-stone-600 group-hover:text-stone-300" />
                            </div>
                            
                            <button 
                                onClick={(e) => deleteUser(e, user.id)}
                                className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-rose-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 group-hover:right-2 transition-all bg-[#353331]"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Toggle */}
            {isCreating ? (
                <form onSubmit={handleCreate} className="bg-[#292524] p-1 rounded-2xl border border-stone-800 flex items-center shadow-lg">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder={T.auth.placeholderName}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-stone-200 placeholder:text-stone-600 text-sm font-medium"
                    />
                    <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="p-3 text-stone-500 hover:text-stone-300 transition-colors text-xs"
                    >
                        {T.auth.cancel}
                    </button>
                    <button 
                        type="submit"
                        className="bg-stone-100 hover:bg-white text-stone-900 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
                    >
                        {T.auth.login}
                    </button>
                </form>
            ) : (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full py-4 rounded-xl border border-dashed border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-600 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <UserPlus size={16} />
                    {users.length > 0 ? T.auth.addUser : T.auth.createFirst}
                </button>
            )}

        </div>

        <div className="mt-12 flex justify-center opacity-30">
            <ShieldCheck size={16} />
        </div>

      </div>
    </div>
  );
};

export default AuthScreen;