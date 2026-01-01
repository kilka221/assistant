import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Settings, X, Check, Activity } from 'lucide-react';
import { t } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  lang: Language;
  onUpdateProfile: (p: UserProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, profile, lang, onUpdateProfile
}) => {
  const [localDiagnosis, setLocalDiagnosis] = useState(profile.diagnosis);
  const T = t[lang];

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({ ...profile, diagnosis: localDiagnosis });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0a09]/80 backdrop-blur-sm p-4">
      <div className="bg-[#1c1917] border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-[#191716]">
          <h2 className="text-lg font-serif font-medium text-stone-200 flex items-center gap-2">
            {T.settings.title}
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
            
            {/* Diagnosis */}
            <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} /> {T.settings.diagnosisLabel}
                </label>
                <input 
                    type="text"
                    value={localDiagnosis}
                    onChange={(e) => setLocalDiagnosis(e.target.value)}
                    placeholder={T.settings.diagnosisPlaceholder}
                    className="w-full bg-[#292524] border border-stone-800 rounded-xl p-4 text-base text-stone-200 focus:border-stone-600 outline-none transition-all placeholder:text-stone-600"
                />
                <div className="mt-3 flex gap-3 items-start">
                    <div className="w-1 h-1 bg-stone-500 rounded-full mt-2 flex-shrink-0" />
                    {/* UPDATE: Changed text color from stone-500 to stone-300 for better visibility */}
                    <p className="text-xs text-stone-300 leading-relaxed font-light">
                        {T.settings.diagnosisHelp}
                    </p>
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-stone-800 bg-[#191716] flex justify-end">
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-white text-stone-900 rounded-xl font-medium transition-colors shadow-lg shadow-stone-900/20"
            >
                <Check size={16} /> {T.settings.apply}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;