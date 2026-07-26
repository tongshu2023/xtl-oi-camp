# 小图灵信奥学习站 · xtl-oi-camp

> CSP-J / GESP 信息学奥赛一站式静态学习站 —— 8 节 CSP-J 集训课、复赛六专题、GESP 1–8 级路线、2019–2024 真题，双击即用、零后端。
>
> A static, zero-backend learning site for China's CSP-J / GESP informatics-olympiad (competitive programming) prep.

🌐 **在线体验**：<https://tongshu2023.github.io/xtl-oi-camp/>

## 这是什么

小图灵信奥学习站是一套面向信息学奥赛（CSP-J / GESP）的**纯静态**学习站：打开 `index.html` 即可上课，无需注册、无需后端。首页分三栏——常规课、GESP 1–8 级考级课、CSP-J 集训课。

## 已装入的内容

- **CSP-J 第一轮集训**：8 节主课（每节约 120 分钟，80 分解锁下一关）、48 张主动回忆卡、40 道出口小测。
- **复赛专题**：S1–S6 六大算法专题共 18 节真课 + 18 道完整例题 + 36 道洛谷真题（最新一轮，2026-07-22 上线）。
- **真题库**：31 道有道 L3 课后题（题面 / 输入输出 / 样例）；2019–2024 第一轮本地试卷与答案；2015–2018 标注为 NOIP 普及组衔接卷；缺失年份显示「待核验」，不冒充真题。
- **第二轮入口**：2015–2025 年度入口，跳转洛谷进行真实代码提交。
- **GESP 路线**：1–8 级能力路线、自动冲刺计划、间隔复习队列。

## 怎么用

- **学生**：双击 `index.html`（或访问上方在线地址）即可上课；进度保存在本地浏览器，第一版无需账号。
- **教师**：备课口令 `xtl2026`（见 `data/config.js`），开启后可看答案、参考代码、授课提示，并切换投屏视图。
- **CSP-J 强化台**：`cspj-lab.html` 提供更细的模考、错题本和代码草稿。

## 本地运行 / 部署

纯静态站，无构建步骤：

- 直接双击 `index.html`；或
- 用任意静态服务器托管，如 `python -m http.server`，再访问 `http://localhost:8000/`；或
- 把整个目录部署到任意静态托管——本仓已通过 GitHub Pages 上线（见上方地址）。

## 当前边界（诚实说明）

- 第一版为**静态站**，不含统一学生账号与教师后台；学生进度只存于当前浏览器，换设备不同步。
- 仓库目前**未包含自动化测试**（`DELIVERY.md` 提到的 `npm test` 所依赖的 `package.json` 尚未纳入版本库）；当前验收以手动走查为主，覆盖点见 `DELIVERY.md`。
- 真题以本地 PDF 与结构化数据（`data/`、`content_staging/`）承载，缺失年份明确标注、不冒充真题。

## 目录结构

- `index.html` / `academy.html` / `cspj-lab.html` —— 三个入口页
- `app.js` / `store.js` / `academy-app.js` / `academy-store.js` —— 前端逻辑与本地存储
- `data/` —— 课程、题库、真题、配置等结构化数据（`data/README.md` 有数据说明）
- `content_staging/` —— 历年真题 PDF 原件
- `DELIVERY.md` —— 交付说明与课上使用指南

## 许可

本仓库暂未声明开源许可证。如需复用课程内容或代码，请先联系作者。
