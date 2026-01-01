import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import ClinicalMonitor from './components/ClinicalMonitor';
import StoryModal from './components/StoryModal';
import SettingsModal from './components/SettingsModal';
import AuthScreen from './components/AuthScreen';
import SubscriptionModal from './components/SubscriptionModal';
import { GeminiService } from './services/geminiService';
import { Message, Role, ClinicalAnalysis, ChartDataPoint, UserProfile, UserInfo, Language } from './types';
import { Settings, LogOut, Crown, Globe } from 'lucide-react';
import { t } from './utils/translations';
import Logo from './components/Logo';

const INITIAL_ANALYSIS: ClinicalAnalysis = {
  sentiment: 0,
  status: "Сбор данных",
  primaryHypothesis: { name: "Наблюдение", confidence: 0, reasoning: "..." },
  secondaryHypotheses: [],
  triggers: [],
  recommendations: []
};

// Helper: Mathematical Inertia for Smoother Charts
const calculateSmoothSentiment = (currentVal: number, targetVal: number) => {
  let delta = targetVal - currentVal;
  const maxStep = 0.25; 
  if (delta > maxStep) delta = maxStep;
  if (delta < -maxStep) delta = -maxStep;
  let newVal = currentVal + delta;
  return Number(Math.max(-1.0, Math.min(1.0, newVal)).toFixed(2));
};

const App: React.FC = () => {
  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // --- APP STATE ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<ClinicalAnalysis>(INITIAL_ANALYSIS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    diagnosis: '',
    isStoryModeActive: false,
    storyText: '',
    messageCount: 0,
    isSubscribed: false
  });
  const [language, setLanguage] = useState<Language>('ru');

  const [isLoading, setIsLoading] = useState(false);
  const [isStoryModalOpen, setStoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false); 
  const [isProcessingStory, setIsProcessingStory] = useState(false);

  // Service Ref
  const geminiRef = useRef<GeminiService | null>(null);

  // 1. Init Service
  useEffect(() => {
    geminiRef.current = new GeminiService();
    const savedLang = localStorage.getItem('psy_coun_lang');
    if (savedLang === 'en' || savedLang === 'ru') {
        setLanguage(savedLang);
    }
  }, []);

  // 2. Load User Data when currentUser changes
  useEffect(() => {
    if (currentUser) {
        const storageKey = `psy_coun_assist_data_${currentUser.id}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.messages || []);
                setAnalysis(parsed.analysis || INITIAL_ANALYSIS);
                setChartData(parsed.chartData || []);
                setProfile({
                    diagnosis: '',
                    isStoryModeActive: false,
                    storyText: '',
                    messageCount: 0,
                    isSubscribed: false,
                    ...parsed.profile
                });
            } catch (e) {
                console.error("Error loading user data", e);
            }
        } else {
            // New user defaults - Warm welcome
            setMessages([{ 
                id: 'init', 
                role: Role.ASSISTANT, 
                content: language === 'ru' 
                    ? `Здравствуй, ${currentUser.name}. Я здесь, чтобы выслушать тебя. О чем тебе важно поговорить сегодня?`
                    : `Hello, ${currentUser.name}. I am here to listen. What is important for you to talk about today?`,
                timestamp: Date.now() 
            }]);
            setAnalysis(INITIAL_ANALYSIS);
            setChartData([]);
            setProfile({ diagnosis: '', isStoryModeActive: false, storyText: '', messageCount: 0, isSubscribed: false });
        }
    }
  }, [currentUser]);

  // 3. Save Data on Change
  useEffect(() => {
    if (currentUser) {
        const storageKey = `psy_coun_assist_data_${currentUser.id}`;
        const stateToSave = {
            messages,
            analysis,
            chartData,
            profile
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [messages, analysis, chartData, profile, currentUser]);

  const toggleLanguage = () => {
      const newLang = language === 'ru' ? 'en' : 'ru';
      setLanguage(newLang);
      localStorage.setItem('psy_coun_lang', newLang);
  };

  const handleSendMessage = async (text: string) => {
    if (!geminiRef.current || !currentUser) return;

    // --- SUBSCRIPTION CHECK ---
    const FREE_LIMIT = 5;
    if (!profile.isSubscribed && profile.messageCount >= FREE_LIMIT) {
        setSubscriptionModalOpen(true);
        return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: Role.USER, content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    setProfile(prev => ({ ...prev, messageCount: prev.messageCount + 1 }));

    try {
      // Pass currentUser.name and current analysis (for inertia)
      const response = await geminiRef.current.sendMessage(messages, text, profile, currentUser.name, analysis);

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: Role.ASSISTANT, 
        content: response.response, 
        timestamp: Date.now() 
      };

      setMessages(prev => [...prev, aiMsg]);

      // Update Analysis
      if (response.analysis) {
        const lastSentiment = chartData.length > 0 ? chartData[chartData.length - 1].sentiment : 0;
        const smoothSentiment = calculateSmoothSentiment(lastSentiment, response.analysis.sentiment);

        setAnalysis(prev => ({
            ...prev,
            sentiment: smoothSentiment,
            status: response.analysis.status,
            sentimentReasoning: response.analysis.sentiment_reasoning,
            triggers: response.analysis.triggers || [],
            recommendations: response.analysis.recommendations || []
        }));

        if (response.hypotheses) {
            setAnalysis(prev => ({
                ...prev,
                primaryHypothesis: response.hypotheses.primary,
                secondaryHypotheses: response.hypotheses.secondary || []
            }));
        }

        setChartData(prev => [
            ...prev,
            { 
              step: prev.length + 1, 
              sentiment: smoothSentiment, 
              status: response.analysis.status,
              reason: response.analysis.sentiment_reasoning // Save reason for the chart
            }
        ]);
      }

      if (profile.isStoryModeActive && response.narrativeUpdate) {
        setProfile(prev => ({ ...prev, storyText: response.narrativeUpdate }));
      }

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: Message = { 
        id: Date.now().toString(), 
        role: Role.SYSTEM, 
        content: language === 'ru' ? "Связь потеряна. Попробуйте еще раз." : "Connection lost. Please try again.", 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateStory = async (initialText: string) => {
    if (!geminiRef.current) return;
    setIsProcessingStory(true);
    try {
        const formattedStory = await geminiRef.current.initializeStory(initialText);
        setProfile(prev => ({
            ...prev,
            isStoryModeActive: true,
            storyText: formattedStory
        }));
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessingStory(false);
    }
  };

  const handleSubscribe = () => {
      setProfile(prev => ({ ...prev, isSubscribed: true }));
      setSubscriptionModalOpen(false);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: Role.SYSTEM,
          content: language === 'ru' ? "Подписка активирована. Спасибо за доверие." : "Subscription activated. Thank you for your trust.",
          timestamp: Date.now()
      }]);
  };

  const handleLogout = () => {
      setCurrentUser(null);
  };

  if (!currentUser) {
      return <AuthScreen onLogin={setCurrentUser} lang={language} onToggleLang={toggleLanguage} />;
  }

  const T = t[language];

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-stone-950 text-stone-200 font-sans selection:bg-stone-700 selection:text-white">
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-80 lg:w-96 flex-shrink-0 z-20 h-full border-r border-stone-800 bg-[#191716]">
        <div className="p-5 border-b border-stone-800/50 flex justify-between items-center bg-stone-900/50">
             <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-serif text-stone-300">
                     {currentUser.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col">
                    <span className="font-medium text-stone-200 text-sm tracking-wide">{currentUser.name}</span>
                    {profile.isSubscribed && <span className="text-[10px] text-amber-500/80 flex items-center gap-1 font-medium tracking-wider uppercase"><Crown size={10}/> {T.sidebar.proPlan}</span>}
                 </div>
             </div>
             
             <div className="flex items-center gap-1">
                 <button onClick={toggleLanguage} className="text-stone-500 hover:text-stone-300 transition-colors p-2 rounded-full hover:bg-stone-800" title="Language">
                    <span className="text-xs font-bold font-mono">{language.toUpperCase()}</span>
                 </button>
                 <button onClick={handleLogout} className="text-stone-500 hover:text-stone-300 transition-colors p-2 rounded-full hover:bg-stone-800" title={T.sidebar.logout}>
                     <LogOut size={16} />
                 </button>
             </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
            {/* Background Texture for Sidebar */}
            <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            <ClinicalMonitor 
                analysis={analysis} 
                chartData={chartData} 
                profile={profile}
                lang={language}
                onOpenStory={() => setStoryModalOpen(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
            />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#1c1917]">
         {/* Mobile Header */}
         <div className="md:hidden h-16 border-b border-stone-800 flex items-center justify-between px-4 flex-shrink-0 bg-[#1c1917] z-30">
            <div className="flex items-center gap-3">
                <Logo className="text-stone-200" size={28} />
                <div className="flex flex-col">
                    <span className="font-serif font-bold text-stone-200 text-lg tracking-tight">PSYassistant</span>
                    {!profile.isSubscribed && (
                        <span className="text-[10px] text-stone-500 uppercase tracking-wide">
                            {Math.max(0, 5 - profile.messageCount)} {T.sidebar.freeLeft}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                 <button onClick={toggleLanguage} className="p-2 text-stone-400 font-mono text-xs">{language.toUpperCase()}</button>
                 <button onClick={() => setSettingsModalOpen(true)} className="p-2 text-stone-400"><Settings size={20}/></button>
            </div>
         </div>

         <div className="flex-1 relative overflow-hidden flex flex-col">
            <ChatInterface 
                messages={messages} 
                isLoading={isLoading} 
                lang={language}
                onSendMessage={handleSendMessage} 
            />
            
            {!profile.isSubscribed && (
                <div className="hidden md:block absolute top-6 right-8 pointer-events-none">
                     <span className="bg-stone-800/80 backdrop-blur px-3 py-1.5 rounded-full border border-stone-700/50 text-[10px] font-medium text-stone-400 uppercase tracking-widest">
                        {Math.max(0, 5 - profile.messageCount)} {T.sidebar.freeLeft}
                     </span>
                </div>
            )}
         </div>
      </div>

      {/* Modals */}
      <StoryModal 
        isOpen={isStoryModalOpen}
        onClose={() => setStoryModalOpen(false)}
        profile={profile}
        lang={language}
        onUpdateStory={(txt) => setProfile(prev => ({...prev, storyText: txt}))}
        onActivateStoryMode={handleActivateStory}
        isProcessing={isProcessingStory}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        profile={profile}
        lang={language}
        onUpdateProfile={setProfile}
      />

      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        lang={language}
        onSubscribe={handleSubscribe}
      />

    </div>
  );
};

export default App;