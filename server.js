import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const state = {
  issueSeq: 1,
  history: []
};

const externalConfig = {
  enabled: process.env.EXTERNAL_API_ENABLED === 'true',
  url: process.env.EXTERNAL_API_URL || '',
  method: (process.env.EXTERNAL_API_METHOD || 'GET').toUpperCase(),
  issueField: process.env.EXTERNAL_API_ISSUE_FIELD || 'issue',
  numsField: process.env.EXTERNAL_API_NUMS_FIELD || 'nums',
  sumField: process.env.EXTERNAL_API_SUM_FIELD || 'sum',
  resultField: process.env.EXTERNAL_API_RESULT_FIELD || 'result'
};

function buildIssue() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${ymd}-${String(state.issueSeq).padStart(4, '0')}`;
}

function classify(sum) {
  return sum >= 14 ? '大' : '小';
}

function normalizeNums(value) {
  if (Array.isArray(value)) return value.map((n) => Number(n)).slice(0, 3);
  if (typeof value === 'string') return value.split(/[,\s+|]+/).map((n) => Number(n)).filter((n) => Number.isFinite(n)).slice(0, 3);
  return [];
}

function createDrawFromLocal() {
  const nums = [0, 0, 0].map(() => Math.floor(Math.random() * 10));
  const sum = nums[0] + nums[1] + nums[2];
  const row = {
    issue: buildIssue(),
    nums,
    sum,
    result: classify(sum),
    time: Date.now(),
    source: 'local'
  };
  state.issueSeq += 1;
  state.history.push(row);
  return row;
}

function pushIfNotExists(row) {
  const exists = state.history.some((h) => h.issue === row.issue);
  if (!exists) {
    state.history.push(row);
    state.issueSeq += 1;
  }
  return row;
}

async function fetchExternalResult() {
  if (!externalConfig.enabled || !externalConfig.url) {
    throw new Error('external api not configured');
  }

  const resp = await fetch(externalConfig.url, { method: externalConfig.method });
  if (!resp.ok) throw new Error(`external api http ${resp.status}`);

  const payload = await resp.json();
  const issue = payload?.[externalConfig.issueField] || buildIssue();
  const nums = normalizeNums(payload?.[externalConfig.numsField]);
  const sum = Number(payload?.[externalConfig.sumField]);

  if (nums.length !== 3 && !Number.isFinite(sum)) {
    throw new Error('external payload invalid: nums/sum missing');
  }

  const fixedNums = nums.length === 3 ? nums : [0, 0, 0];
  const fixedSum = Number.isFinite(sum) ? sum : fixedNums[0] + fixedNums[1] + fixedNums[2];
  const result = payload?.[externalConfig.resultField] || classify(fixedSum);

  return {
    issue: String(issue),
    nums: fixedNums,
    sum: fixedSum,
    result,
    time: Date.now(),
    source: 'external'
  };
}

app.get('/api/status', (req, res) => {
  res.json({
    nextIssue: buildIssue(),
    total: state.history.length,
    external: { enabled: externalConfig.enabled, url: externalConfig.url || null }
  });
});

app.get('/api/history', (req, res) => {
  const keyword = (req.query.issue || '').toString().trim();
  const rows = keyword ? state.history.filter((r) => r.issue.includes(keyword)) : state.history;
  res.json(rows.slice().reverse());
});

app.post('/api/draw', async (req, res) => {
  const mode = (req.query.mode || 'auto').toString();
  if (mode === 'external') {
    try {
      const row = await fetchExternalResult();
      return res.status(201).json(pushIfNotExists(row));
    } catch (error) {
      return res.status(502).json({ error: 'external draw failed', message: error.message });
    }
  }

  const row = createDrawFromLocal();
  res.status(201).json(row);
});

app.post('/api/import-external', async (req, res) => {
  try {
    const row = await fetchExternalResult();
    res.status(201).json(pushIfNotExists(row));
  } catch (error) {
    res.status(502).json({ error: 'external import failed', message: error.message });
  }
});

app.post('/api/reset', (req, res) => {
  state.issueSeq = 1;
  state.history = [];
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PC28 system running at http://localhost:${PORT}`);
});
