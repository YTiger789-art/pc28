const DRAW_INTERVAL_SECONDS = 30;
const el = (id) => document.getElementById(id);

const issueEl = el('issueNo');
const drawAtEl = el('drawAt');
const countdownEl = el('countdown');
const ballWrap = el('ballWrap');
const historyBody = el('historyBody');
const searchIssueEl = el('searchIssue');
const totalCountEl = el('totalCount');
const bigCountEl = el('bigCount');
const smallCountEl = el('smallCount');
const avgSumEl = el('avgSum');

const STORAGE_KEY = 'pc28-gh-pages-history';
let countdown = DRAW_INTERVAL_SECONDS;
let autoMode = true;
let history = [];
let isStaticMode = false;

function fmtTime(ts) { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); }
function classify(sum) { return sum >= 14 ? '大' : '小'; }
function renderBalls(nums = ['-', '-', '-'], sum = '-') { ballWrap.innerHTML = `<span class="ball">${nums[0]}</span><span class="op">+</span><span class="ball">${nums[1]}</span><span class="op">+</span><span class="ball">${nums[2]}</span><span class="op">=</span><span class="sum">${sum}</span>`; }
function nextIssue() {
  const n = history.length + 1;
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${ymd}-${String(n).padStart(4, '0')}`;
}

function renderStats() {
  const total = history.length;
  const big = history.filter((v) => v.result === '大').length;
  const small = total - big;
  const avg = total ? (history.reduce((s, v) => s + v.sum, 0) / total).toFixed(2) : '0.00';
  totalCountEl.textContent = total;
  bigCountEl.textContent = big;
  smallCountEl.textContent = small;
  avgSumEl.textContent = avg;
}

function renderHistory() {
  const key = searchIssueEl.value.trim();
  const rows = history.filter((r) => (key ? r.issue.includes(key) : true)).map((r) => `<tr><td>${r.issue}</td><td>${r.nums.join(' + ')}</td><td>${r.sum}</td><td><span class="tag ${r.result === '大' ? 'big' : 'small'}">${r.result}</span></td><td>${fmtTime(r.time)}</td></tr>`).join('');
  historyBody.innerHTML = rows || '<tr><td colspan="5" class="empty">暂无数据</td></tr>';
}

function refreshStatusLocal() {
  issueEl.textContent = nextIssue();
  drawAtEl.textContent = fmtTime(Date.now() + countdown * 1000);
  countdownEl.textContent = `${countdown}s`;
}

async function refreshStatusApi() {
  const status = await fetch('/api/status').then((r) => r.json());
  issueEl.textContent = status.nextIssue;
  drawAtEl.textContent = fmtTime(Date.now() + countdown * 1000);
  countdownEl.textContent = `${countdown}s`;
}

function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }
function loadLocal() {
  try { history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { history = []; }
}

async function refreshHistory() {
  if (isStaticMode) {
    renderHistory(); renderStats(); if (history.length) renderBalls(history[0].nums, history[0].sum); return;
  }
  history = await fetch('/api/history').then((r) => r.json());
  renderHistory(); renderStats(); if (history.length) renderBalls(history[0].nums, history[0].sum);
}

async function drawOnce(mode = 'auto') {
  if (isStaticMode) {
    const nums = [0, 0, 0].map(() => Math.floor(Math.random() * 10));
    const sum = nums.reduce((a, b) => a + b, 0);
    history.unshift({ issue: nextIssue(), nums, sum, result: classify(sum), time: Date.now(), source: 'static' });
    saveLocal();
    countdown = DRAW_INTERVAL_SECONDS;
    await refreshHistory();
    refreshStatusLocal();
    return;
  }
  await fetch(`/api/draw?mode=${mode}`, { method: 'POST' });
  countdown = DRAW_INTERVAL_SECONDS;
  await refreshHistory();
  await refreshStatusApi();
}

async function resetAll() {
  if (isStaticMode) {
    history = []; saveLocal(); renderBalls(); renderHistory(); renderStats(); refreshStatusLocal(); return;
  }
  await fetch('/api/reset', { method: 'POST' });
  history = [];
  renderBalls(); renderHistory(); renderStats(); await refreshStatusApi();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pc28-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

el('drawNow').addEventListener('click', () => drawOnce('auto'));
el('drawExternal').addEventListener('click', () => drawOnce('external'));
el('toggleAuto').addEventListener('click', () => { autoMode = !autoMode; el('toggleAuto').textContent = autoMode ? '暂停自动' : '恢复自动'; });
el('resetData').addEventListener('click', resetAll);
el('exportJson').addEventListener('click', exportJson);
searchIssueEl.addEventListener('input', renderHistory);

setInterval(async () => {
  if (!autoMode) return;
  countdown -= 1;
  if (countdown <= 0) await drawOnce('auto');
  else countdownEl.textContent = `${countdown}s`;
}, 1000);

(async function bootstrap() {
  renderBalls();
  try {
    await fetch('/api/status', { method: 'GET' });
    await refreshHistory();
    await refreshStatusApi();
  } catch {
    isStaticMode = true;
    loadLocal();
    await refreshHistory();
    refreshStatusLocal();
    el('drawExternal').disabled = true;
    el('drawExternal').title = 'GitHub Pages 静态模式下不可用';
  }
})();
