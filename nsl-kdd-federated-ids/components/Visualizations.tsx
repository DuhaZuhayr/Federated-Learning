import React, { useMemo } from 'react';
import { NetworkFeatures } from '../types';

// --- Threat Gauge Component ---

interface ThreatGaugeProps {
  score: number; // 0 to 1
  isScanning: boolean;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({ score, isScanning }) => {
  // Calculate stroke dasharray for a semi-circle
  const radius = 80;
  const circumference = radius * Math.PI; // Semi-circle
  const strokeDashoffset = circumference - (score * circumference);
  
  const color = score > 0.5 ? '#ef4444' : '#10b981'; // Red or Emerald
  const label = score > 0.5 ? 'THREAT DETECTED' : 'NORMAL TRAFFIC';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="240" height="140" viewBox="0 0 240 140" className="overflow-visible">
        {/* Defs for gradients */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Animated Value Path */}
        <path
          d="M 20 120 A 100 100 0 0 1 220 120"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isScanning ? 0 : strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ 
            filter: score > 0.7 ? 'url(#glow)' : 'none',
            animation: isScanning ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}
        />
        
        {/* Needle Indicator */}
        <g 
          className="transition-transform duration-1000 ease-out origin-[120px_120px]"
          style={{ transform: `rotate(${(score * 180) - 90}deg)` }}
        >
           <circle cx="120" cy="120" r="6" fill="#334155" />
           <path d="M 120 120 L 120 35" stroke="#334155" strokeWidth="2" />
        </g>
      </svg>
      
      <div className="absolute top-24 text-center">
         <div className={`text-4xl font-bold tracking-tighter transition-colors duration-500 ${score > 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
            {isScanning ? '--' : (score * 100).toFixed(1)}%
         </div>
         <div className="text-[10px] font-bold tracking-widest text-slate-400 mt-1 uppercase">
            {isScanning ? 'ANALYZING...' : label}
         </div>
      </div>
    </div>
  );
};


// --- Radar Chart Component ---

interface RadarChartProps {
  data: NetworkFeatures;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 200;
  const center = size / 2;
  const radius = 80;

  // Normalized metrics (0-1)
  const metrics = useMemo(() => [
    { key: 'serror_rate', label: 'SYN Err', max: 1 },
    { key: 'rerror_rate', label: 'REJ Err', max: 1 },
    { key: 'same_srv_rate', label: 'Same Srv', max: 1 },
    { key: 'diff_srv_rate', label: 'Diff Srv', max: 1 },
    { key: 'dst_host_serror_rate', label: 'Host SYN', max: 1 },
    { key: 'dst_host_count', label: 'Volume', max: 255 }, // Normalize count
  ], []);

  const points = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    const value = Math.min(Number(data[m.key]) || 0, m.max) / m.max;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid Lines (Web) */}
        {gridLevels.map((level) => (
           <polygon
             key={level}
             points={metrics.map((_, i) => {
               const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
               const x = center + radius * level * Math.cos(angle);
               const y = center + radius * level * Math.sin(angle);
               return `${x},${y}`;
             }).join(' ')}
             fill="none"
             stroke="#e2e8f0"
             strokeWidth="1"
           />
        ))}

        {/* Axis Lines */}
        {metrics.map((_, i) => {
           const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
           const x = center + radius * Math.cos(angle);
           const y = center + radius * Math.sin(angle);
           return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" />;
        })}

        {/* Data Shape */}
        <polygon
          points={points}
          fill="rgba(99, 102, 241, 0.2)" // Indigo
          stroke="#6366f1"
          strokeWidth="2"
          className="transition-all duration-300 ease-out"
        />
        
        {/* Labels */}
        {metrics.map((m, i) => {
           const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
           const x = center + (radius + 15) * Math.cos(angle);
           const y = center + (radius + 15) * Math.sin(angle);
           return (
             <text
               key={i}
               x={x}
               y={y}
               textAnchor="middle"
               alignmentBaseline="middle"
               className="text-[9px] fill-slate-400 font-medium uppercase tracking-tighter"
             >
               {m.label}
             </text>
           );
        })}
      </svg>
      <div className="absolute bottom-0 text-[10px] text-slate-400 font-mono">
        TRAFFIC FINGERPRINT
      </div>
    </div>
  );
};

interface ROCChartProps {
  fpr: number[];
  tpr: number[];
  auc?: number;
}

export const ROCChart: React.FC<ROCChartProps> = ({ fpr, tpr, auc }) => {
  const width = 220;
  const height = 160;
  const pad = 20;
  const points = fpr.map((x, i) => `${pad + x * (width - pad * 2)},${height - (pad + tpr[i] * (height - pad * 2))}`).join(' ');
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-500 uppercase mb-2">ROC Curve {auc ? `· AUC ${auc.toFixed(2)}` : ''}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={pad} stroke="#e5e7eb" strokeDasharray="4 3" />
        <polyline points={points} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={height - pad} x2={pad} y2={pad} stroke="#e2e8f0" />
      </svg>
    </div>
  );
};

interface PRChartProps {
  recall: number[];
  precision: number[];
  ap?: number;
}

export const PRChart: React.FC<PRChartProps> = ({ recall, precision, ap }) => {
  const width = 220;
  const height = 160;
  const pad = 20;
  const points = recall.map((x, i) => `${pad + x * (width - pad * 2)},${height - (pad + precision[i] * (height - pad * 2))}`).join(' ');
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-500 uppercase mb-2">Precision-Recall {ap ? `· AP ${ap.toFixed(2)}` : ''}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" />
        <line x1={pad} y1={height - pad} x2={pad} y2={pad} stroke="#e2e8f0" />
      </svg>
    </div>
  );
};

interface ConfusionMatrixProps {
  matrix: number[][];
  labels?: [string, string];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix, labels = ['Negative', 'Positive'] }) => {
  const total = matrix.flat().reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-500 uppercase mb-2">Confusion Matrix</div>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
        <div className="text-xs text-slate-400">Pred: {labels[0]}</div>
        <div className="text-xs text-slate-400">Pred: {labels[1]}</div>
        <div className="p-3 bg-slate-50 rounded">{matrix[0][0]} ({((matrix[0][0]/total)*100).toFixed(1)}%)</div>
        <div className="p-3 bg-slate-50 rounded">{matrix[0][1]} ({((matrix[0][1]/total)*100).toFixed(1)}%)</div>
        <div className="p-3 bg-slate-50 rounded">{matrix[1][0]} ({((matrix[1][0]/total)*100).toFixed(1)}%)</div>
        <div className="p-3 bg-slate-50 rounded">{matrix[1][1]} ({((matrix[1][1]/total)*100).toFixed(1)}%)</div>
      </div>
    </div>
  );
};
