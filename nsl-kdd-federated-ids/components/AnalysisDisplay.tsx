import React from 'react';

interface Props {
  text: string;
  className?: string;
}

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const mdToHtml = (md: string) => {
  if (!md) return '';
  let s = escapeHtml(md);
  s = s.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 text-[11px]">$1</code>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const lines = s.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        out.push('<ul class="list-disc ml-4 space-y-1">');
        inList = true;
      }
      out.push(`<li>${line.replace(/^[\*-]\s+/, '')}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (line === '') {
      continue;
    }
    out.push(`<p class="mb-2">${line}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('');
};

const AnalysisDisplay: React.FC<Props> = ({ text, className }) => {
  const html = mdToHtml(text || '');
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default AnalysisDisplay;
