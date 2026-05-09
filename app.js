const STORAGE_KEY = 'pc28-history-v1';
const COUNTDOWN_SECONDS = 30;

const issueEl = document.getElementById('issueNo');
const sumEl = document.getElementById('sumNum');
const countdownEl = document.getElementById('countdown');
const historyBody = document.getElementById('historyBody');
const ballWrap = document.getElementById('ballWrap');

const drawNowBtn = document.getElementById('drawNow');
const resetBtn = document.getElementById('resetData');

let countdown = COUNTDOWN_SECONDS;
let history = loadHistory();

function nowIssue() {
  const now = new Date();
  const yyyyMMdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const issue = String(history.length + 1).padStart(4, '0');
  return `${yyyyMMdd}-${issue}`;
}

function randomNum() {
  return Math.floor(Math.random() * 10);
}

function classify(sum) {
  return sum >= 14 ? '大' : '小';
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

function renderCurrentPreview() {
  issueEl.textContent = nowIssue();
  countdownEl.textContent = countdown;
}

function renderBalls(nums, sum) {
  ballWrap.innerHTML = `
    <span class="ball">${nums[0]}</span>
    <span class="plus">+</span>
    <span class="ball">${nums[1]}</span>
    <span class="plus">+</span>
    <span class="ball">${nums[2]}</span>
    <span class="eq">=</span>
    <span class="sum">${sum}</span>
  `;
  sumEl.textContent = sum;
}

function renderHistory() {
  historyBody.innerHTML = history
    .slice()
    .reverse()
    .map((item) => `
      <tr>
        <td>${item.issue}</td>
        <td>${item.nums.join(' + ')}</td>
        <td>${item.sum}</td>
        <td><span class="tag ${item.result === '大' ? 'big' : 'small'}">${item.result}</span></td>
        <td>${formatTime(item.time)}</td>
      </tr>
    `)
    .join('');
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function doDraw() {
  const nums = [randomNum(), randomNum(), randomNum()];
  const sum = nums.reduce((a, b) => a + b, 0);
  const item = {
    issue: nowIssue(),
    nums,
    sum,
    result: classify(sum),
    time: Date.now()
  };
  history.push(item);
  saveHistory();
  renderBalls(nums, sum);
  renderHistory();
  countdown = COUNTDOWN_SECONDS;
  renderCurrentPreview();
}

setInterval(() => {
  countdown -= 1;
  if (countdown <= 0) {
    doDraw();
  } else {
    countdownEl.textContent = countdown;
  }
}, 1000);

drawNowBtn.addEventListener('click', doDraw);
resetBtn.addEventListener('click', () => {
  history = [];
  saveHistory();
  historyBody.innerHTML = '';
  sumEl.textContent = '-';
  issueEl.textContent = nowIssue();
});

renderCurrentPreview();
renderHistory();
if (history.length) {
  const latest = history[history.length - 1];
  renderBalls(latest.nums, latest.sum);
}
