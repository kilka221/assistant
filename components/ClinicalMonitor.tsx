import React from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { ClinicalAnalysis, ChartDataPoint, UserProfile, Language } from '../types';
import { Activity, Brain, AlertCircle, FileText, Settings, ChevronRight, Zap, GitBranch } from 'lucide-react';
import { t } from '../utils/translations';

interface ClinicalMonitorProps {
  analysis: ClinicalAnalysis;
  chartData: ChartDataPoint[];
  profile: UserProfile;
  lang: Language;
  onOpenStory: () => void;
  onOpenSettings: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#292524] border border-stone-700 p-3 rounded-lg shadow-2xl text-xs z-50 max-w-[200px]">
        {/* Status as title */}
        <p className="font-serif text-stone-200 mb-1 font-bold">{data.status}</p>
        {/* Reason if available */}
        {data.reason && (
           <p className="text-stone-500 mb-2 leading-tight">{data.reason}</p>
        )}
        <p className={`font-mono font-bold ${data.sentiment > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.sentiment > 0 ? '+' : ''}{data.sentiment}
        </p>
      </div>
    );
  }
  return null;
};

const ClinicalMonitor: React.FC<ClinicalMonitorProps> = ({ 
  analysis, 
  chartData, 
  profile,
  lang,
  onOpenStory,
  onOpenSettings
}) => {
  const T = t[lang];

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto space-y-8 custom-scroll">
      
      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-2 bg-[#292524] hover:bg-[#353331] text-stone-300 hover:text-stone-100 py-4 rounded-xl text-sm font-medium transition-all border border-stone-800 shadow-sm hover:shadow-md"
        >
          <Settings size={16} /> {T.sidebar.settings}
        </button>
        <button 
          onClick={onOpenStory}
          className={`flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all border shadow-sm hover:shadow-md ${
            profile.isStoryModeActive 
            ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300' 
            : 'bg-[#292524] border-stone-800 text-stone-300 hover:text-stone-100'
          }`}
        >
          <FileText size={16} /> {T.sidebar.history}
        </button>
      </div>

      {/* Primary Hypothesis - The Card Style */}
      <div className="group relative bg-[#23211f] rounded-2xl p-7 border border-stone-800 shadow-lg transition-all hover:border-stone-700 hover:shadow-xl hover:shadow-black/20">
        <div className="flex justify-between items-center mb-2"> 
          <span className="text-xs uppercase tracking-widest text-indigo-400/80 font-bold flex items-center gap-2">
            <Brain size={16} /> {T.sidebar.hypothesis}
          </span>
          <span className="bg-stone-900 border border-stone-800 text-indigo-300 text-xs px-3 py-1 rounded-full font-mono">
            {analysis.primaryHypothesis?.confidence}%
          </span>
        </div>
        
        <h3 className="text-3xl font-serif text-indigo-100/90 mb-5 leading-tight tracking-tight font-normal">
            {analysis.primaryHypothesis?.name || T.sidebar.analyzing}
        </h3>
        
        <div className="max-h-64 overflow-y-auto pr-2 custom-scroll mb-4">
            <p className="text-[16px] text-stone-300 font-light leading-relaxed">
                {analysis.primaryHypothesis?.reasoning || T.sidebar.reasoningDefault}
            </p>
        </div>

        {/* Differential Diagnosis (Secondary Hypotheses) */}
        {analysis.secondaryHypotheses && analysis.secondaryHypotheses.length > 0 && (
            <div className="pt-4 border-t border-stone-800/50 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold flex items-center gap-2 mb-2">
                    <GitBranch size={12} /> Альтернативные версии
                </span>
                {analysis.secondaryHypotheses.map((h, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-400">
                            <span>{h.name}</span>
                            <span className="font-mono text-stone-500">{h.confidence}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-stone-600/50 rounded-full transition-all duration-500" 
                                style={{ width: `${h.confidence}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Chart */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
            <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold">{T.sidebar.mood}</h4>
            <span className={`text-base font-bold font-mono ${analysis.sentiment > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analysis.sentiment > 0 ? '+' : ''}{analysis.sentiment.toFixed(2)}
            </span>
        </div>
        <div className="h-40 bg-[#23211f] rounded-2xl border border-stone-800 p-0 overflow-hidden relative shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <YAxis domain={[-1.2, 1.2]} hide />
                <Area 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSentiment)" 
                />
            </AreaChart>
            </ResponsiveContainer>
            {/* Zero line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-stone-800 border-t border-dashed border-stone-700/50 pointer-events-none" />
        </div>
      </div>

      {/* Analysis Details (Triggers & Protocols) */}
      <div className="space-y-8">
        
        {/* Triggers */}
        {analysis.triggers.length > 0 && (
            <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={14} /> {T.sidebar.triggers}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                    {analysis.triggers.map((t, i) => (
                        <span key={i} className="px-3.5 py-2 bg-rose-950/20 border border-rose-900/30 text-rose-200 text-sm rounded-lg font-medium shadow-sm">
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* Protocols (Recommendations) */}
        {analysis.recommendations.length > 0 && (
            <div>
                <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> {T.sidebar.protocols}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                    {analysis.recommendations.map((r, i) => (
                        <span key={i} className="px-3.5 py-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-200 text-sm rounded-lg font-medium shadow-sm hover:bg-emerald-950/30 transition-colors cursor-help" title="Рекомендованная техника">
                            {r}
                        </span>
                    ))}
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default ClinicalMonitor;