# CSP-J 闯关营数据约定

所有内容通过普通 `<script>` 顺序加载，挂在 `window.CSPJ_DATA`。当前内容均以 `SAMPLE` 标注，目的是固定结构并打通页面；后续正式灌装时保持字段不变即可。

## 文件与加载顺序

1. `config.js`：站点、考试日期、教师口令、及格线、真题年份。
2. `levels.js`：两条主线与关卡顺序。
3. `quiz_bank.js`：初赛单选、阅读程序、完善程序。
4. `exams_real.js`：J-Boss 历年卷编排，引用题库 ID。
5. `problems.js`：复赛编程题与 S-Boss 题目。
6. `articles.js`：关卡讲义与百科文章。

## 初赛题 `quizBank[]`

```js
{
  id, year: null | 2024, source,
  section: 'choice' | 'reading' | 'completion',
  stem, code: null | '多行 C++ 源码',
  subs: [{ stem, options: ['A', 'B', 'C', 'D'], answer: 0, explanation }],
  knowledgeTags: ['知识点'], levelId: 'J1'
}
```

`answer` 是从 0 开始的选项下标。单选题 `subs` 长度为 1；阅读/完善程序共享外层 `code`，`subs` 含多个小题。学生模式渲染时不得把 `answer`、`explanation` 写进 DOM。

## 编程题 `problems[]`

```js
{
  id, title, source, difficulty: 1,
  knowledgeTags: ['枚举'], statement, inputFormat, outputFormat,
  samples: [{ in: '输入', out: '输出' }],
  hint, solutionIdea, referenceCode,
  luoguId: 'P1000' | null, levelId: 'S1', year: null | 2024
}
```

学生模式只渲染 `hint`；`solutionIdea` 与 `referenceCode` 只在教师模式进入 DOM。`luoguId` 生成 `https://www.luogu.com.cn/problem/{luoguId}` 外链。

## 讲义 `articles[]`

```js
{
  id, levelId: 'J1' | null, category, title, summary, readTime,
  sections: [{ title, paragraphs: ['段落'] }],
  teachingNotes: ['教师授课要点']
}
```

`levelId: null` 表示百科拓展文章。`teachingNotes` 只在教师模式进入 DOM。

## 真题卷 `realExams[]`

```js
{
  id, year, title, duration, source, sample: true,
  questionIds: ['quizBank 中的题 ID']
}
```

卷内会展开题目的所有 `subs` 计分；正式灌装可按真实题型顺序排列 `questionIds`。

## 关卡 `levels[]`

```js
{ id, title, summary, track: 'preliminary' | 'final', order, kind: 'quiz' | 'problem' | 'boss' }
```

解锁只由同一主线的 `order` 决定；首关默认进行中，上一关通过后下一关解锁。
