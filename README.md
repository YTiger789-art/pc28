# PC28 开奖结果系统（前后端版）

## 功能
- 前端页面展示当前期号、倒计时、号码和值、历史记录、统计数据
- 后端 API 提供开奖、历史查询、重置、状态接口
- 自动开奖（30 秒）与手动开奖
- 支持按期号过滤与 JSON 导出

## 启动
```bash
npm install
npm start
```

打开 `http://localhost:3000`。

## API
- `GET /api/status`：获取下期期号与总数
- `GET /api/history?issue=xxx`：获取历史数据
- `POST /api/draw`：执行一次开奖
- `POST /api/reset`：清空历史

## 说明
当前开奖数据为服务器内存模拟数据，重启服务后会重置。
