import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Server, 
  RotateCcw,
  Zap,
  Cpu,
  History,
  LayoutDashboard,
  Settings,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_VALUES, FLAGS, PROTOCOL_TYPES, SERVICES, SUSPICIOUS_PRESET } from './constants';
import { NetworkFeatures, PredictionResponse, HistoryItem } from './types';
import { InputSection, NumberField, SelectField } from './components/InputSection';
import AnalysisDisplay from './components/AnalysisDisplay';
import { analyzeTrafficWithGemini } from './services/geminiService';
import { RadarChart, ThreatGauge, ROCChart, PRChart, ConfusionMatrix } from './components/Visualizations';

const App: React.FC = () => {
  const [formData, setFormData] = useState<NetworkFeatures>(DEFAULT_VALUES);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);

  // Scroll to results when prediction happens
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
    // We do NOT reset prediction immediately to allow comparing "what-if" scenarios visually in the form
    if (geminiAnalysis) setGeminiAnalysis(null);
  };

  const handleReset = () => {
    setFormData(DEFAULT_VALUES);
    setPrediction(null);
    setGeminiAnalysis(null);
  };

  const loadPreset = () => {
    setFormData(SUSPICIOUS_PRESET);
    setPrediction(null);
    setGeminiAnalysis(null);
  };

  const handlePredict = async () => {
    setIsPredicting(true);
                                                                                                                                                                
    // Simulate API latency for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // MOCK PREDICTION LOGIC
    let score = 0;
    if (formData.serror_rate > 0.5) score += 0.4;
    if (formData.flag === 'S0' || formData.flag === 'REJ') score += 0.3;
    if (formData.src_bytes > 10000 && formData.protocol_type === 'icmp') score += 0.3;
    if (formData.dst_host_diff_srv_rate > 0.5) score += 0.2;
    if (formData.service === 'private') score += 0.2;
    const probability = Math.min(0.99, Math.max(0.01, score + (Math.random() * 0.1)));
    const isAttack = probability > 0.5;

    const newResult: PredictionResponse = {
      probability,
      isAttack,
      timestamp: Date.now()
    };

    setPrediction(newResult);
    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      result: newResult,
      summary: `${formData.protocol_type.toUpperCase()} / ${formData.service}`
    }, ...prev].slice(0, 10)); // Keep last 10

    setIsPredicting(false);
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeTrafficWithGemini(formData);
    setGeminiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-200/20 blur-3xl"></div>
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-200/20 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">
        
        {/* Sidebar - History */}
        <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 hidden xl:flex flex-col">
          <div className="p-6 border-b border-slate-100">
             <div className="flex items-center space-x-3 text-slate-900">
               <div className="bg-slate-900 p-1.5 rounded-lg shadow-lg shadow-slate-900/20">
                 <ShieldCheck className="w-5 h-5 text-white" />
               </div>
               <span className="font-bold tracking-tight">NetGuard AI</span>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Recent Scans</h3>
            {history.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">No recent activity</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-default group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-700">{item.summary}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.result.isAttack ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.result.isAttack ? 'ATTACK' : 'SAFE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(item.result.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
             <div className="flex items-center justify-between text-xs text-slate-500">
               <span className="flex items-center gap-1"><Server className="w-3 h-3" /> Node: Online</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto scroll-smooth">
          
          {/* Header Mobile */}
          <header className="xl:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
             <div className="px-4 h-14 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                   <ShieldCheck className="w-5 h-5" />
                   <span>NetGuard AI</span>
                </div>
             </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              
              {/* Left: Visualization Panel */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gauge Card */}
                <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Live Threat Level
                  </h3>
                  <ThreatGauge score={prediction?.probability || 0} isScanning={isPredicting} />
                </div>

                {/* Radar Card */}
                <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[280px] relative">
                   <h3 className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Traffic Shape
                  </h3>
                  <RadarChart data={formData} />
                </div>
              </div>

              {/* Right: Actions & Quick Stats */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                 
                 {/* Main Action Box */}
                 <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                       <ShieldCheck className="w-32 h-32 transform rotate-12" />
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2 relative z-10">Diagnostic Engine</h2>
                    <p className="text-slate-400 text-sm mb-6 relative z-10">
                      Federated Global Model (Round 3) is ready. Input parameters to evaluate intrusion probability.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                       <button 
                         onClick={loadPreset}
                         className="flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors border border-white/5"
                       >
                         <Zap className="w-3.5 h-3.5" /> Demo Attack
                       </button>
                       <button 
                         onClick={handleReset}
                         className="flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors border border-white/5"
                       >
                         <RotateCcw className="w-3.5 h-3.5" /> Reset
                       </button>
                    </div>

                    <button
                      onClick={handlePredict}
                      disabled={isPredicting}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 relative z-10 group"
                    >
                      {isPredicting ? (
                        <Activity className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">Run Analysis <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                      )}
                    </button>
                 </div>

                 {/* Gemini Status */}
                 {prediction && !geminiAnalysis && (
                   <div className="flex-1 bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                         <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1">AI Analyst</h3>
                        <p className="text-indigo-200 text-xs">Gemini 2.5 Flash is standby.</p>
                      </div>
                      <button 
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing}
                        className="mt-4 w-full py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                         {isAnalyzing ? <Cpu className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                         Explain Diagnosis
                      </button>
                   </div>
                 )}
                 
                 {geminiAnalysis && (
                    <div className="flex-1 bg-white border border-indigo-100 rounded-2xl p-5 shadow-lg overflow-y-auto max-h-[300px]">
                      <div className="flex items-center gap-2 mb-3 text-indigo-600">
                         <Cpu className="w-4 h-4" />
                         <span className="text-xs font-bold uppercase tracking-wider">Analysis Result</span>
                      </div>
                      <div className="text-xs leading-relaxed text-slate-600">
                        <AnalysisDisplay text={geminiAnalysis || ''} className="prose prose-sm text-slate-700 max-w-full" />
                      </div>
                    </div>
                 )}

              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1">
                <ROCChart fpr={[0,0.05,0.1,0.2,0.4,1]} tpr={[0,0.3,0.5,0.7,0.9,1]} auc={0.88} />
              </div>
              <div className="lg:col-span-1">
                <PRChart recall={[0,0.2,0.4,0.6,0.8,1]} precision={[1,0.9,0.75,0.6,0.4,0.2]} ap={0.72} />
              </div>
              <div className="lg:col-span-1">
                <ConfusionMatrix matrix={[[900,50],[30,120]]} labels={["Benign","Attack"]} />
              </div>
            </div>

            {/* Input Form Section */}
            <div className="mb-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <h2 className="text-xl font-light text-slate-800">Parameters</h2>
                 <div className="h-px w-12 bg-slate-300"></div>
               </div>
               
               <button 
                 onClick={() => setSimpleMode(!simpleMode)}
                 className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-full transition-all"
               >
                 <Settings className="w-3.5 h-3.5" />
                 {simpleMode ? 'Show Advanced Fields' : 'Simple Mode'}
               </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePredict(); }} className="animate-fade-in-up">
              
              {/* Group 1: Basic (Always Visible) */}
              <InputSection title="Basic Connection Features">
                <NumberField label="Duration" name="duration" value={formData.duration} onChange={handleInputChange} />
                <SelectField label="Protocol" name="protocol_type" value={formData.protocol_type} options={PROTOCOL_TYPES} onChange={handleInputChange} />
                <SelectField label="Service" name="service" value={formData.service} options={SERVICES} onChange={handleInputChange} />
                <SelectField label="Flag" name="flag" value={formData.flag} options={FLAGS} onChange={handleInputChange} />
                <NumberField label="Src Bytes" name="src_bytes" value={formData.src_bytes} onChange={handleInputChange} />
                <NumberField label="Dst Bytes" name="dst_bytes" value={formData.dst_bytes} onChange={handleInputChange} />
              </InputSection>

              {/* Group 3: Time-Based (Important for DDoS) */}
              <InputSection title="Traffic Volume & Error Rates" isExpanded={!simpleMode || true}>
                 <NumberField label="Count" name="count" value={formData.count} onChange={handleInputChange} />
                 <NumberField label="Srv Count" name="srv_count" value={formData.srv_count} onChange={handleInputChange} />
                 <NumberField label="Serror Rate" name="serror_rate" value={formData.serror_rate} onChange={handleInputChange} step="0.01" />
                 <NumberField label="Same Srv Rate" name="same_srv_rate" value={formData.same_srv_rate} onChange={handleInputChange} step="0.01" />
              </InputSection>

              {/* Advanced Sections */}
              <InputSection title="Content Factors (Payload Analysis)" isExpanded={!simpleMode}>
                <NumberField label="Hot" name="hot" value={formData.hot} onChange={handleInputChange} />
                <NumberField label="Failed Logins" name="num_failed_logins" value={formData.num_failed_logins} onChange={handleInputChange} />
                <NumberField label="Logged In" name="logged_in" value={formData.logged_in} onChange={handleInputChange} />
                <NumberField label="Compromised" name="num_compromised" value={formData.num_compromised} onChange={handleInputChange} />
                <NumberField label="Root Shell" name="root_shell" value={formData.root_shell} onChange={handleInputChange} />
                <NumberField label="Su Attempted" name="su_attempted" value={formData.su_attempted} onChange={handleInputChange} />
                <NumberField label="Num Root" name="num_root" value={formData.num_root} onChange={handleInputChange} />
                <NumberField label="File Creations" name="num_file_creations" value={formData.num_file_creations} onChange={handleInputChange} />
              </InputSection>

              <InputSection title="Host-Based Traffic Statistics" isExpanded={!simpleMode}>
                <NumberField label="Dst Host Count" name="dst_host_count" value={formData.dst_host_count} onChange={handleInputChange} />
                <NumberField label="Dst Host Srv Count" name="dst_host_srv_count" value={formData.dst_host_srv_count} onChange={handleInputChange} />
                <NumberField label="Dst Host Same Srv" name="dst_host_same_srv_rate" value={formData.dst_host_same_srv_rate} onChange={handleInputChange} step="0.01" />
                <NumberField label="Dst Host Diff Srv" name="dst_host_diff_srv_rate" value={formData.dst_host_diff_srv_rate} onChange={handleInputChange} step="0.01" />
                <NumberField label="Dst Host Same Src Port" name="dst_host_same_src_port_rate" value={formData.dst_host_same_src_port_rate} onChange={handleInputChange} step="0.01" />
                <NumberField label="Dst Host Serror" name="dst_host_serror_rate" value={formData.dst_host_serror_rate} onChange={handleInputChange} step="0.01" />
              </InputSection>
            </form>

            <div ref={resultsRef} className="h-10"></div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
