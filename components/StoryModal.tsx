import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { BookOpen, X, Save, Edit2, Loader2, Sparkles, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { t } from '../utils/translations';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  lang: Language;
  onUpdateStory: (text: string) => void;
  onActivateStoryMode: (initialText: string) => Promise<void>;
  isProcessing: boolean;
}

const StoryModal: React.FC<StoryModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  lang,
  onUpdateStory,
  onActivateStoryMode,
  isProcessing
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState('');
  const [initMode, setInitMode] = useState(false);
  const T = t[lang];

  React.useEffect(() => {
    if (isOpen) {
       setLocalText(profile.storyText);
       if (!profile.isStoryModeActive) {
           setInitMode(true);
       } else {
           setInitMode(false);
       }
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleInitSubmit = async () => {
    if (!localText.trim()) return;
    await onActivateStoryMode(localText);
    setInitMode(false);
  };

  const handleSaveEdit = () => {
    onUpdateStory(localText);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0a09]/90 backdrop-blur-sm p-4">
      <div className="bg-[#1c1917] w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden border border-stone-800 relative">
        
        {/* Decorative Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-stone-800 to-stone-900 z-10 border-r border-stone-800"></div>

        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start pl-8 bg-[#191716] border-b border-stone-800/50">
            <div>
                <h2 className="text-2xl font-serif text-stone-200 mb-1 flex items-center gap-3">
                    <BookOpen size={24} className="text-amber-700" />
                    <span className="tracking-tight">{T.story.title}</span>
                </h2>
                <p className="text-xs text-stone-500 font-sans tracking-widest uppercase pl-9">{T.story.subtitle}</p>
            </div>
            <button onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content - Paper Feel */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pl-10 custom-scroll bg-[#1c1917]">
          {initMode ? (
            <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-stone-800 shadow-inner">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="font-serif text-xl text-stone-200">{T.story.initTitle}</h3>
                    <p className="text-stone-500 text-sm font-light leading-relaxed max-w-sm mx-auto">
                        {T.story.initDesc}
                    </p>
                </div>
                <textarea 
                    value={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    className="w-full h-64 bg-[#23211f] border border-stone-800 rounded-lg p-6 text-base text-stone-300 focus:border-stone-600 outline-none resize-none font-serif leading-7 placeholder:text-stone-700 placeholder:italic shadow-inner"
                    placeholder={T.story.placeholder}
                />
            </div>
          ) : (
            <div className="relative max-w-2xl mx-auto min-h-full">
                {isEditing ? (
                    <textarea 
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        className="w-full h-[60vh] bg-[#23211f] p-6 rounded-md border border-stone-800 text-stone-300 outline-none resize-none font-serif leading-8 text-lg"
                    />
                ) : (
                    // Beautiful Markdown Rendering for the "Book" look
                    <div className="bg-[#23211f] p-8 md:p-12 rounded-sm border border-stone-800/60 shadow-lg min-h-[50vh] relative">
                        {/* Inner Border for Frame Effect */}
                        <div className="absolute inset-2 border border-stone-800/30 pointer-events-none"></div>
                        
                        <article className="prose prose-invert prose-stone max-w-none font-serif text-lg leading-8 text-stone-300/90 relative z-10">
                             <ReactMarkdown components={{
                                 h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-amber-500/90 border-b border-stone-800 pb-3 mb-6 mt-2 uppercase tracking-widest text-center" {...props} />,
                                 h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-stone-200 mt-8 mb-4 flex items-center gap-2" {...props} />,
                                 h3: ({node, ...props}) => <h3 className="text-lg font-medium text-stone-400 mt-6 mb-2 italic" {...props} />,
                                 strong: ({node, ...props}) => <span className="font-bold text-indigo-200" {...props} />,
                                 ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2 my-4 marker:text-stone-600" {...props} />,
                                 li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                 p: ({node, ...props}) => <p className="mb-4 text-stone-300/90" {...props} />
                             }}>
                                {profile.storyText || T.story.empty}
                             </ReactMarkdown>
                        </article>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pl-8 border-t border-stone-800 bg-[#191716] flex justify-end gap-4">
            {initMode ? (
                <button 
                    onClick={handleInitSubmit}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-8 py-3 bg-stone-100 hover:bg-white text-stone-900 rounded-full font-medium transition-all shadow-lg disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {T.story.startBtn}
                </button>
            ) : (
                <>
                    {isEditing ? (
                         <button 
                            onClick={handleSaveEdit}
                            className="flex items-center gap-2 px-6 py-2 bg-stone-200 hover:bg-white text-stone-900 rounded-lg font-medium transition-colors"
                        >
                            <Save size={16} /> {T.story.saveBtn}
                        </button>
                    ) : (
                        <button 
                            onClick={() => { setLocalText(profile.storyText); setIsEditing(true); }}
                            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-stone-300 transition-colors"
                        >
                            <Edit2 size={16} /> {T.story.editBtn}
                        </button>
                    )}
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default StoryModal;