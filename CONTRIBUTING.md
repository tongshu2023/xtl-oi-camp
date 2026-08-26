# 贡献指南

欢迎为**小图灵信奥闯关营**（CSP-J / GESP 一站式静态学习站）贡献内容与代码。本项目是**零后端静态站，无需构建**：所有页面用普通 `<script>` 顺序加载数据，直接用浏览器打开 HTML 即可预览。因此贡献门槛很低——你不需要懂框架，能写规范的 JS 数据对象就能加题、加讲义、加真题卷。

## 快速开始

```bash
git clone https://github.com/tongshu2023/xtl-oi-camp.git
cd xtl-oi-camp

# 本地预览：任选其一直接打开，或起一个静态服务器
#   直接双击 index.html / academy.html / cspj-lab.html
#   或： npx serve .   （避免个别浏览器对 file:// 的限制）

# 提交前必跑的两道自检（零依赖，无需 npm install，Node 20+）
npm run check   # 数据自检：答案越界、真题引用失效、交付清单核对
npm test        # node --test：数据完整性 + 首页元信息 + 无障碍 + SEO
```

CI（`.github/workflows/data-check.yml`）在每次 push / PR 时对上述两条命令跑同样的校验。**本地 `npm run check` 与 `npm test` 全绿，才提交。**

## 目录速览

| 目录 / 文件 | 作用 |
| --- | --- |
| `data/` | 所有内容数据（题库、讲义、真题、关卡、配置）。贡献内容主要改这里。 |
| `data/README.md` | **数据字段约定的权威文档**，加内容前必读。 |
| `scripts/check.mjs` | `npm run check` 的数据自检逻辑。 |
| `test/` | `node --test` 的完整性 / 无障碍 / SEO 测试。 |
| `index.html` `academy.html` `cspj-lab.html` | 三个入口页面（零后端）。 |
| `e2e/` | 可选的浏览器端 e2e 脚本（`npm run test:notes:e2e` 等）。 |

## 加内容：数据约定

完整字段以 [`data/README.md`](data/README.md) 为准，这里只提**三条最容易踩的红线**：

### 1. 答案 / 解析绝不能进学生模式 DOM（安全＋教学红线）

以下字段**只允许在教师模式渲染**，学生模式渲染时不得写进 DOM：

- 初赛题 `quizBank[].subs[].answer` / `.explanation`
- 编程题 `problems[].solutionIdea` / `.referenceCode`（学生模式只渲染 `hint`）
- 讲义 `articles[].teachingNotes`
- 真题卷同理引用题库时不得泄题解

`test/teacher-answer-render.test.js` 会守这条线——越界会让 CI 直接红。这既是防作弊，也是产品的教学设计核心。

### 2. `answer` 是从 0 开始的选项下标

单选题 `subs` 长度为 1；阅读程序 / 完善程序共享外层 `code`，`subs` 含多个小题。别写成从 1 开始，也别写成选项文本。

### 3. 真题卷只引用题库 ID，不复制题面

`exams_real.js` 的 `realExams[].questionIds` 引用 `quizBank[]` 里已存在的题 ID。新增真题卷前先确认被引用的题 ID 存在，否则 `npm run check` 会报「真题引用失效」。

### 加一道初赛题的最小示例

```js
// data/quiz_bank.js — 追加到 quizBank 数组
{
  id: 'Q2024-01',
  year: 2024,
  source: 'CSP-J 2024 初赛',
  section: 'choice',
  stem: '下列关于……的说法正确的是？',
  code: null,
  subs: [
    {
      stem: '',
      options: ['A 选项', 'B 选项', 'C 选项', 'D 选项'],
      answer: 2,               // 从 0 开始，此处为 C
      explanation: '因为……',   // 只在教师模式渲染
    },
  ],
  knowledgeTags: ['基础知识'],
  levelId: 'J1',
}
```

编程题、讲义、真题卷、关卡的字段结构，请对照 `data/README.md` 逐字段填。**保持字段名不变**——页面与校验脚本都按这些字段名取值。

## 提交规范

- **一次 PR 只做一件事**：加一批题、修一个 bug、改一处文案，别混在一起。
- **提交信息**用中文或英文均可，说清「改了什么数据 / 为什么」。
- **改动前后本地必过** `npm run check` + `npm test`。
- **不要提交**任何私钥、`.env`、真实教师口令等敏感信息（`data/config.js` 里的口令仅为占位/演示口径，请勿填真实密码）。
- 编码统一 UTF-8，换行统一 LF。

## 报告问题

发现题目答案错误、讲义笔误、页面在某浏览器异常、无障碍问题，欢迎开 Issue，附上：

- 具体是哪道题 / 哪个页面（贴 `id` 或页面路径最好）；
- 期望结果 vs 实际结果；
- 浏览器与操作系统（前端问题时）。

## 许可

本项目在 `package.json` 中声明以 **MIT** 许可开源。提交贡献即表示你同意以相同许可授权。

---

感谢你为信奥零基础学习者铺路。🧡
