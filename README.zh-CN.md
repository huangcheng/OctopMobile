# OctopMobile

[English](./README.md) | 简体中文

**非官方** Expo / React Native 版 [Octop](https://github.com/TencentCloud/Octop) 手机伴侣应用，面向自部署 Octop。

这是个人 GitHub 账号下的**扩展 / 附加**项目，**并非** TencentCloud 官方产品。Octop 的主要客户端仍是网页控制台、PWA、桌面端与 IM 渠道。

定位是「以对话为核心的伴侣应用」，而不是网页控制台的移植：挑选专家、管理会话、流式阅读回复，顺手照看知识库与定时任务。

## 状态 — v1.0.0（候选版，冒烟已验证）

覆盖[设计规格](docs/superpowers/specs/2026-09-11-octop-mobile-design.md) Phase 1–2 全部内容，外加 Phase 3 的只读标签页：

- **登录** — 服务器地址 + 密码；明文 HTTP 首次提醒（绝不绕过 TLS 校验）；令牌存于 `expo-secure-store`，支持滑动续期（`X-Octop-Access-Token`）。
- **对话** — 跨专家的会话列表（今天 / 更早分组）、按专家筛选的标签、**标题与专家搜索**、问候卡片、下拉刷新；长按弹出操作单：重命名 / 置顶 / 删除 / **分享为 Markdown**。
- **聊天** — WebSocket 流式回复，实时渲染 Markdown（代码块语法高亮，浅色 / 深色双主题）、工具与思考过程卡片、停止（cancel）、断线重连横幅。
- **专家** — 搜索、「我的专家」卡片、专家市场入口、专家详情与推荐提问。
- **知识** — 只读知识库（文档数、共享徽标）；**可点进文档列表与 Markdown 阅读器**（preview 接口）；搜索同时匹配知识库名**与文档标题**；文档可分享为 Markdown。
- **自动化** — 只读定时任务列表，支持启用 / 停用开关，页脚显示服务器时区。
- **内嵌控制台** — 仅控制台支持的操作（专家市场、知识库 / 定时任务创建、挂载知识库）在内嵌 webview 中打开，并**自动携带当前登录态**（加载前把 JWT 注入控制台存储，严格同源）；创建与编辑仍在网页端完成。
- **设置** — 服务器地址、语言（跟随系统 / 中 / 英）、**外观（跟随系统 / 浅色 / 深色）**、**8 种品牌配色**（玫瑰 / 科技 / 靛蓝 / 青绿 / 紫罗兰 / 翠绿 / 琥珀 / 石墨，与 Octop 控制台一致）、主动关怀、关于。
- **设计系统** — 令牌来自 Ardot 设计稿「Elegant Rose」（Light + Dark），经 `useOctopTheme()` 随系统与用户偏好切换；标签栏图标为设计稿原样导出。

服务器版本：**最低 `v0.9.32`，已验证兼容 `v0.9.33`** — 详见 [docs/api-contract.md](docs/api-contract.md)（HTTP + WS 报文、冒烟门槛 §6、兼容性说明）。

## 开发

```bash
npm install
npx expo start          # 启动 Metro；用 Expo Go 打开 exp://<局域网IP>:8081
npm run typecheck       # tsc --noEmit
npm test                # jest
```

需要 Node 20+，以及手机可访问的 Octop 服务器（版本要求见上文）。

界面与布局以 [Ardot 设计稿](https://ardot.tencent.com/file/724619963379272)为准（离线快件见 [docs/design/](docs/design/)）；当代码与设计不一致时，**以设计为准**。

### 自部署 HTTP（局域网）

`app.json` 有意开启了 Android 明文流量与 iOS ATS 任意加载，使应用可以通过局域网明文 HTTP 访问自部署 Octop —— 这是**设计内的受支持特性**（一次性提醒弹窗，设计 02），并非疏忽。**不要**移除这些开关：多数自部署用户在局域网跑明文 HTTP，而给局域网 IP 配有效证书并不现实（自签证书按设计不支持 —— 永不绕过证书校验）。远程访问请把 Octop 挂到 HTTPS 之后（反向代理 + Let's Encrypt）。

### E2E（本地 Maestro）

```bash
maestro test .maestro/design-audit.yaml     # 遍历所有屏幕并截图
maestro test .maestro/login.yaml -e OCTOP_URL=... -e OCTOP_USER=... -e OCTOP_PASS=...
```

在已启动的 iOS 模拟器或 Android 模拟器上运行，Metro 监听 `:8081`。发布门槛：[scripts/smoke-checklist.md](scripts/smoke-checklist.md)。

## 构建发布版

`eas.json` 提供两个 profile：

```bash
eas build -p android --profile preview     # 内部测试 APK，可直接安装
eas build -p ios   --profile preview       # 内部测试 iOS 包
eas build --profile production             # AAB / TestFlight（可上架）
```

## 许可证

Apache-2.0 — 见 [LICENSE](LICENSE)。
