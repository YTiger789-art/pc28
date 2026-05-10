# PC28 开奖结果系统（前后端版）

## 功能
- 前端页面展示当前期号、倒计时、号码和值、历史记录、统计数据
- 后端 API 提供开奖、历史查询、重置、状态接口
- 自动开奖（30 秒）与手动开奖
- 支持按期号过滤与 JSON 导出
- 支持对接第三方开奖结果 API 并入库展示

## 本地启动
```bash
npm install
npm start
```
打开 `http://localhost:3000`。

## 部署运行

### 方案1：Node 直接运行（Linux）
```bash
cp .env.example .env
npm ci
bash scripts/deploy.sh
```

### 方案2：PM2 守护部署（推荐）
```bash
npm ci
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 方案3：Docker 部署
```bash
docker compose up -d --build
```

## API
- `GET /api/status`：获取下期期号与总数（含外部 API 开关状态）
- `GET /api/history?issue=xxx`：获取历史数据
- `POST /api/draw`：本地开奖（默认）
- `POST /api/draw?mode=external`：通过外部 API 开奖
- `POST /api/import-external`：主动拉取外部 API 开奖结果
- `POST /api/reset`：清空历史

## 外部 API 对接配置
通过环境变量映射第三方字段：

- `EXTERNAL_API_ENABLED=true`
- `EXTERNAL_API_URL=https://example.com/result`
- `EXTERNAL_API_METHOD=GET`
- `EXTERNAL_API_ISSUE_FIELD=issue`
- `EXTERNAL_API_NUMS_FIELD=nums`
- `EXTERNAL_API_SUM_FIELD=sum`
- `EXTERNAL_API_RESULT_FIELD=result`

> `nums` 支持数组（如 `[1,2,3]`）或字符串（如 `"1,2,3"`）。

## 说明
当前默认为本地模拟开奖；开启外部 API 后可与其他平台开奖结果对接。


## 部署到 GitHub（本地推送）

### 1) 本地准备
```bash
git status
```
确保没有未提交修改，然后创建 GitHub 空仓库（不要勾选 README 初始化）。

### 2) 本地一键推送到 GitHub
```bash
bash scripts/push_to_github.sh <你的GitHub仓库地址> main
```
示例：
```bash
bash scripts/push_to_github.sh git@github.com:yourname/pc28-system.git main
```

### 3) 使用 GitHub Actions 自动检查
仓库已包含 `.github/workflows/node-ci.yml`，推送后会自动执行：
- `npm ci`
- `node --check server.js`
- `node --check app.js`


## 部署到 GitHub Pages

> GitHub Pages 仅支持静态页面，不运行 Node/Express。项目已内置“静态回退模式”：无法访问 `/api/*` 时，自动切到浏览器本地模式（localStorage 保存记录）。

### 启用步骤
1. 推送代码到 GitHub 仓库（`main` 或 `master`）。
2. 在仓库 `Settings -> Pages` 中，Source 选择 `GitHub Actions`。
3. 工作流 `.github/workflows/deploy-pages.yml` 会自动发布。

### 页面能力说明（Pages）
- 可用：本地开奖、自动开奖、历史、统计、导出 JSON。
- 不可用：外部 API 开奖、Express 后端接口。
