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

let countdown = DRAW_INTERVAL_SECONDS;
let autoMode = true;
let history = [];

function fmtTime(ts) { return new Date(ts).toLocaleString('zh-CN', { hour12: false }); }
function renderBalls(nums = ['-', '-', '-'], sum = '-') { ballWrap.innerHTML = `<span class="ball">${nums[0]}</span><span class="op">+</span><span class="ball">${nums[1]}</span><span class="op">+</span><span class="ball">${nums[2]}</span><span class="op">=</span><span class="sum">${sum}</span>`; }

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
  const rows = history.filter((r) => (key ? String(r.issue || '').includes(key) : true));
  historyBody.innerHTML = '';

  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty';
    td.textContent = '暂无数据';
    tr.appendChild(td);
    historyBody.appendChild(tr);
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement('tr');

    const issueTd = document.createElement('td');
    issueTd.textContent = String(r.issue ?? '');

    const numsTd = document.createElement('td');
    const safeNums = Array.isArray(r.nums) ? r.nums : [];
    numsTd.textContent = safeNums.join(' + ');

    const sumTd = document.createElement('td');
    sumTd.textContent = String(r.sum ?? '');

    const resultTd = document.createElement('td');
    const tag = document.createElement('span');
    const isBig = r.result === '大';
    tag.className = `tag ${isBig ? 'big' : 'small'}`;
    tag.textContent = String(r.result ?? '');
    resultTd.appendChild(tag);

    const timeTd = document.createElement('td');
    timeTd.textContent = fmtTime(r.time);

    tr.append(issueTd, numsTd, sumTd, resultTd, timeTd);
    historyBody.appendChild(tr);
  });
}

async function refreshStatus() {
  const status = await fetch('/api/status').then((r) => r.json());
  issueEl.textContent = status.nextIssue;
  drawAtEl.textContent = fmtTime(Date.now() + countdown * 1000);
  countdownEl.textContent = `${countdown}s`;
}

async function refreshHistory() {
  history = await fetch('/api/history').then((r) => r.json());
  renderHistory();
  renderStats();
  if (history.length) renderBalls(history[0].nums, history[0].sum);
}

async function drawOnce(mode = 'auto') {
  await fetch(`/api/draw?mode=${mode}`, { method: 'POST' });
  countdown = DRAW_INTERVAL_SECONDS;
  await refreshHistory();
  await refreshStatus();
}

async function resetAll() {
  await fetch('/api/reset', { method: 'POST' });
  history = [];
  renderBalls();
  renderHistory();
  renderStats();
  await refreshStatus();
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
  await refreshHistory();
  await refreshStatus();
})();
