const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5001;

function analyzeHeuristics(data) {
  const suspicious = [];
  if (data.flag === 'S0' || data.flag === 'REJ') suspicious.push('`flag: S0`');
  if ((data.serror_rate || 0) >= 1 || (data.srv_serror_rate || 0) >= 1 || (data.dst_host_serror_rate || 0) >= 1) suspicious.push('`serror_rate: 1`');
  if ((data.duration || 0) === 0 && (data.src_bytes || 0) === 0 && (data.dst_bytes || 0) === 0) suspicious.push('`duration: 0`, `src_bytes: 0`, `dst_bytes: 0`');
  if ((data.count || 0) >= 50) suspicious.push('`count: ' + (data.count || 0) + '`');

  const isAttack = suspicious.length > 0;

  const lines = [];
  if (isAttack) {
    lines.push('This record strongly indicates an **attack**.');
    lines.push('');
    lines.push('**Most suspicious features:**');
    suspicious.forEach(s => lines.push(`* ${s}`));
    lines.push('');
    lines.push('**Explanation:**');
    lines.push('The `S0` flag signifies a connection attempt where a SYN packet was sent, but no SYN-ACK was received, indicating a failed connection setup. A high `serror_rate` across contexts reinforces this pattern of unsuccessful TCP handshakes. The high `count` of such connections within a short period, with zero data transfer and duration, is highly characteristic of a **SYN flood denial-of-service (DoS) attack** or an aggressive **port scan**.');
  } else {
    lines.push('This record appears **normal** based on simple heuristics.');
    lines.push('');
    lines.push('**Most notable features:**');
    lines.push('* No high SYN error rates detected');
    lines.push('* Normal duration and byte counts');
    lines.push('');
    lines.push('**Explanation:**');
    lines.push('No clear indicators of SYN floods, port scans, or other TCP handshake failures were detected by the simple heuristic analyzer.');
  }

  return lines.join('\n');
}

app.post('/api/analyze', (req, res) => {
  const features = req.body || {};
  const analysis = analyzeHeuristics(features);
  res.json({ analysis });
});

app.post('/api/predict', (req, res) => {
  const f = req.body || {};
  let score = 0;
  if ((f.serror_rate || 0) > 0.5) score += 0.4;
  if (f.flag === 'S0' || f.flag === 'REJ') score += 0.3;
  if ((f.src_bytes || 0) > 10000 && f.protocol_type === 'icmp') score += 0.3;
  if ((f.dst_host_diff_srv_rate || 0) > 0.5) score += 0.2;
  if (f.service === 'private') score += 0.2;
  const probability = Math.min(0.99, Math.max(0.01, score + Math.random() * 0.1));
  res.json({ probability, isAttack: probability > 0.5, timestamp: Date.now() });
});

app.listen(port, () => {
  console.log(`Local analysis API listening on http://localhost:${port}`);
});
