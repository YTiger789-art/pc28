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

function buildIssue() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${ymd}-${String(state.issueSeq).padStart(4, '0')}`;
}

function classify(sum) {
  return sum >= 14 ? '大' : '小';
}

function createDraw() {
  const nums = [0, 0, 0].map(() => Math.floor(Math.random() * 10));
  const sum = nums[0] + nums[1] + nums[2];
  const row = {
    issue: buildIssue(),
    nums,
    sum,
    result: classify(sum),
    time: Date.now()
  };
  state.issueSeq += 1;
  state.history.push(row);
  return row;
}

app.get('/api/status', (req, res) => {
  res.json({ nextIssue: buildIssue(), total: state.history.length });
});

app.get('/api/history', (req, res) => {
  const keyword = (req.query.issue || '').toString().trim();
  const rows = keyword ? state.history.filter((r) => r.issue.includes(keyword)) : state.history;
  res.json(rows.slice().reverse());
});

app.post('/api/draw', (req, res) => {
  const row = createDraw();
  res.status(201).json(row);
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
