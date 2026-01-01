import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FEATURE_DESCRIPTIONS } from '../constants';

interface InputSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ title, children, isExpanded = true }) => {
  if (!isExpanded) return null;
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl p-6 shadow-sm mb-6 transition-all hover:shadow-md">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        {children}
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  name: string;
}

const LabelWithTooltip: React.FC<FieldProps> = ({ label, name }) => {
  const tooltip = FEATURE_DESCRIPTIONS[name];
  return (
    <div className="flex items-center space-x-1.5 mb-1.5 group">
      <label htmlFor={name} className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight group-hover:text-slate-700 transition-colors">
        {label}
      </label>
      {tooltip && (
        <div className="relative group/tooltip">
          <HelpCircle className="w-3 h-3 text-slate-300 cursor-help hover:text-slate-500" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 pointer-events-none">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NumberFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  min?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({ label, name, value, onChange, step = "1", min = "0" }) => (
  <div className="flex flex-col">
    <LabelWithTooltip label={label} name={name} />
    <input
      type="number"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      min={min}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:border-slate-300"
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, options, onChange }) => (
  <div className="flex flex-col">
    <LabelWithTooltip label={label} name={name} />
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:border-slate-300 appearance-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
