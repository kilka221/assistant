import React from 'react';
import { Crown, Check, X } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';
import Logo from './Logo';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubscribe: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, lang, onSubscribe }) => {
  const T = t[lang];
  if (!isOpen) return null;

  const handlePayment = () => {
    const confirm = window.confirm("Эмуляция оплаты: Подтвердить?");
    if (confirm) onSubscribe();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0a09]/90 backdrop-blur-md p-4">
      <div className="bg-[#191716] border border-amber-900/20 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-900/10 rounded-full blur-3xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-stone-600 hover:text-stone-300 transition-colors z-10">
            <X size={24} />
        </button>

        <div className="p-8 text-center relative z-0">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-900/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 border border-amber-900/30 shadow-inner">
                <Logo size={32} className="text-amber-500" />
            </div>
            
            <h2 className="text-2xl font-serif text-stone-100 mb-2">{T.sub.title} <span className="text-amber-600 italic">Pro</span></h2>
            <p className="text-stone-500 text-sm mb-8 font-light">
                {T.sub.subtitle}
            </p>

            <div className="space-y-4 mb-8 text-left px-2">
                <div className="flex items-center gap-3 text-stone-300 text-sm font-light">
                    <Check size={16} className="text-amber-700" />
                    <span>{T.sub.benefit1}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-300 text-sm font-light">
                    <Check size={16} className="text-amber-700" />
                    <span>{T.sub.benefit2}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-300 text-sm font-light">
                    <Check size={16} className="text-amber-700" />
                    <span>{T.sub.benefit3}</span>
                </div>
            </div>
            
            <button 
                onClick={handlePayment}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-stone-100 font-medium shadow-lg shadow-amber-900/20 transition-all text-sm tracking-wide"
            >
                {T.sub.activate}
            </button>
            <p className="text-[10px] text-stone-600 mt-4">
                {T.sub.cancelText}
            </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;