# PC28 开奖结果系统（前后端版）

## 功能
- 前端页面展示当前期号、倒计时、号码和值、历史记录、统计数据
- 后端 API 提供开奖、历史查询、重置、状态接口
- 自动开奖（30 秒）与手动开奖
- 支持按期号过滤与 JSON 导出
- 支持对接第三方开奖结果 API 并入库展示

## 启动
```bash
npm install
npm start
```
打开 `http://localhost:3000`。

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
