const STORAGE_KEY = 'pc28-history-v2';
const SETTINGS_KEY = 'pc28-settings-v1';
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

let state = {
  history: [],
  countdown: DRAW_INTERVAL_SECONDS,
  autoMode: true
};

function safeJson(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function loadState() {
  state.history = safeJson(localStorage.getItem(STORAGE_KEY), []);
  const settings = safeJson(localStorage.getItem(SETTINGS_KEY), {});
  state.autoMode = settings.autoMode ?? true;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoMode: state.autoMode }));
}

function randomDigit() {
  return Math.floor(Math.random() * 10);
}

function nowIssue() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(state.history.length + 1).padStart(4, '0');
  return `${ymd}-${seq}`;
}

function classify(sum) {
  return sum >= 14 ? '大' : '小';
}

function fmtTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

function renderBalls(nums = ['-', '-', '-'], sum = '-') {
  ballWrap.innerHTML = `
    <span class="ball">${nums[0]}</span>
    <span class="op">+</span>
    <span class="ball">${nums[1]}</span>
    <span class="op">+</span>
    <span class="ball">${nums[2]}</span>
    <span class="op">=</span>
    <span class="sum">${sum}</span>
  `;
}

function renderHeader() {
  issueEl.textContent = nowIssue();
  drawAtEl.textContent = fmtTime(Date.now() + state.countdown * 1000);
  countdownEl.textContent = `${state.countdown}s`;
  el('toggleAuto').textContent = state.autoMode ? '暂停自动' : '恢复自动';
}

function renderStats() {
  const total = state.history.length;
  const big = state.history.filter((v) => v.result === '大').length;
  const small = total - big;
  const avg = total ? (state.history.reduce((s, v) => s + v.sum, 0) / total).toFixed(2) : '0.00';

  totalCountEl.textContent = total;
  bigCountEl.textContent = big;
  smallCountEl.textContent = small;
  avgSumEl.textContent = avg;
}

function renderHistory() {
  const key = searchIssueEl.value.trim();
  const rows = state.history
    .slice()
    .reverse()
    .filter((r) => (key ? r.issue.includes(key) : true))
    .map((r) => `<tr>
      <td>${r.issue}</td><td>${r.nums.join(' + ')}</td><td>${r.sum}</td>
      <td><span class="tag ${r.result === '大' ? 'big' : 'small'}">${r.result}</span></td>
      <td>${fmtTime(r.time)}</td>
    </tr>`)
    .join('');
  historyBody.innerHTML = rows || '<tr><td colspan="5" class="empty">暂无数据</td></tr>';
}

function drawOnce() {
  const nums = [randomDigit(), randomDigit(), randomDigit()];
  const sum = nums[0] + nums[1] + nums[2];
  const rec = { issue: nowIssue(), nums, sum, result: classify(sum), time: Date.now() };
  state.history.push(rec);
  saveState();
  renderBalls(nums, sum);
  renderHeader();
  renderStats();
  renderHistory();
  state.countdown = DRAW_INTERVAL_SECONDS;
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pc28-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

el('drawNow').addEventListener('click', drawOnce);
el('toggleAuto').addEventListener('click', () => { state.autoMode = !state.autoMode; saveState(); renderHeader(); });
el('resetData').addEventListener('click', () => {
  state.history = [];
  state.countdown = DRAW_INTERVAL_SECONDS;
  saveState();
  renderBalls(); renderHeader(); renderStats(); renderHistory();
});
el('exportJson').addEventListener('click', exportJson);
searchIssueEl.addEventListener('input', renderHistory);

loadState();
if (state.history.length) {
  const latest = state.history[state.history.length - 1];
  renderBalls(latest.nums, latest.sum);
} else {
  renderBalls();
}
renderHeader(); renderStats(); renderHistory();

setInterval(() => {
  if (!state.autoMode) return;
  state.countdown -= 1;
  if (state.countdown <= 0) {
    drawOnce();
  }
  renderHeader();
}, 1000);
