(function () {
  const app = document.getElementById('app');
  const toastRoot = document.getElementById('toast-root');
  const A = window.ACADEMY_DATA;
  const lessons = window.CSPJ_LESSONS || [];
  const catalog = window.COURSE_CATALOG || { courses: [], lessons: [] };
  const courseLessons = catalog.lessons || [];
  const finalLearningLessons = Object.values(window.FINAL_LESSONS || {}).flatMap(topic => topic.lessons.map((lesson, index) => ({
    ...lesson,
    track: 'final',
    topicId: topic.id,
    order: index + 1,
    memory: [
      { id: `${lesson.id}-m1`, tag: topic.title, prompt: `“${lesson.title}”的核心模型是什么？`, answer: lesson.concepts[0][1] },
      { id: `${lesson.id}-m2`, tag: '建模', prompt: `完整例题“${lesson.example.title}”第一步做什么？`, answer: lesson.example.steps[0] },
      { id: `${lesson.id}-m3`, tag: '避坑', prompt: '本课最容易踩的坑是什么？', answer: lesson.traps[0] }
    ],
    quiz: [
      { id: `${lesson.id}-q1`, stem: `“${lesson.title}”最核心的知识点是？`, options: [lesson.concepts[0][0], lesson.traps[0], '只背参考代码', '只看样例输出'], answer: 0, explanation: lesson.concepts[0][1] },
      { id: `${lesson.id}-q2`, stem: `处理“${lesson.example.title}”的第一步是？`, options: ['直接复制代码', lesson.example.steps[0], '忽略数据范围', '只猜最终答案'], answer: 1, explanation: lesson.example.steps[0] },
      { id: `${lesson.id}-q3`, stem: '下面哪项是本课高频错误？', options: ['先写状态含义', lesson.traps[0], '手算最小样例', '检查边界'], answer: 1, explanation: lesson.traps[0] },
      { id: `${lesson.id}-q4`, stem: '哪种表现可以计为本课真正掌握？', options: ['看完讲义', '抄完代码', '独立完成迁移题并解释边界', '记住题目名字'], answer: 2, explanation: '掌握要能独立建模、实现并用边界数据验证。' }
    ]
  })));
  window.FINAL_COURSE_LESSONS = finalLearningLessons;
  const allLearningLessons = [...courseLessons, ...lessons, ...finalLearningLessons];
  const store = window.AcademyStore;
  const ui = { quizAnswers: {}, quizResults: {}, revealedCards: new Set(), projection: false, planDays: null, planWeek: 4 };

  const esc = value => String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const route = path => { location.hash = `#/${String(path).replace(/^\//, '')}`; };
  const pathParts = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const lessonById = id => allLearningLessons.find(x => x.id === id);
  const courseById = id => catalog.courses.find(x => x.id === id);
  const allCards = () => allLearningLessons.flatMap(x => (x.memory || []).map(card => Object.assign({ lessonId: x.id, lessonTitle: x.title }, card)));
  const formatDate = ts => new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });

  function toast(message, type = '') {
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message;
    toastRoot.appendChild(el); setTimeout(() => el.remove(), 2400);
  }

  function daysToExam() {
    const target = new Date('2026-09-19T09:30:00+08:00');
    return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
  }

  function header(active) {
    const s = store.get();
    const nav = [['home','首页'],['regular','常规课'],['gesp','考级课'],['camp','集训课'],['exams','真题库'],['memory','记忆中心']];
    return `<header class="site-header">
      <div class="nav-shell">
        <button class="brand" data-route="home" aria-label="返回首页"><span class="brand-mark">XT</span><span><strong>小图灵信奥学习站</strong><small>从基础到赛场，一站学完</small></span></button>
        <nav class="main-nav">${nav.map(x => `<button class="${active===x[0]?'active':''}" data-route="${x[0]}">${x[1]}</button>`).join('')}</nav>
        <div class="header-actions"><button class="notes-header-btn" type="button" data-notes-open>我的笔记 <span data-notes-count>0</span></button><button class="mode-btn ${s.teacherMode?'on':''}" id="teacher-mode">${s.teacherMode?'教师模式':'教师备课'}</button><button class="avatar" data-route="progress">${s.teacherMode?'师':'学'}</button></div>
      </div>
    </header>`;
  }

  function footer() {
    return `<footer><div><strong>小图灵信奥学习站</strong><span>常规课 · GESP 1–8级 · CSP-J 第一轮/第二轮</span></div><div class="source-links"><a href="${A.sources.cspNotice}" target="_blank" rel="noreferrer">CCF 认证说明</a><a href="${A.sources.gespSyllabus}" target="_blank" rel="noreferrer">GESP 官方大纲</a><a href="${A.sources.noiSyllabus}" target="_blank" rel="noreferrer">NOI 官方大纲</a></div></footer>`;
  }

  function shell(content, active) { return `<a class="skip-link" href="#main-content">跳到主内容</a>${header(active)}<main id="main-content" tabindex="-1">${content}</main>${footer()}`; }

  function homePage() {
    const s = store.get(); const done = allLearningLessons.filter(x=>s.completedLessons.includes(x.id)).length; const due = store.dueCards(allCards()).length;
    const next = allLearningLessons.find(x=>!s.completedLessons.includes(x.id));
    return shell(`
      <section class="hero"><div class="hero-copy"><div class="eyebrow">2026 CSP-J 备考主站</div><h1>学会、记住、做对，<br><em>一直带到赛场。</em></h1><p>老师直播投屏、学生课后闯关、真题限时模考和记忆复习都在同一个网站里。</p><div class="hero-actions"><button class="primary" data-route="camp">进入 CSP-J 集训课</button><button class="secondary" data-route="plan">生成冲刺计划</button></div></div>
        <div class="hero-panel"><div class="countdown"><span>距第一轮</span><strong>${daysToExam()}</strong><b>天</b></div><div class="today-card"><span>今天建议</span><strong>${due ? `先复习 ${Math.min(due, 12)} 张到期记忆卡` : next ? `继续攻克 ${next.id} · ${next.title}` : '做一套完整真题卷'}</strong><button data-route="${due?'memory':next&&next.track==='gesp'?'gesp':next&&next.track==='regular'?'regular':'camp'}">现在开始 →</button></div><div class="mini-stats"><div><strong>${done}/${allLearningLessons.length}</strong><span>完整课程</span></div><div><strong>${due}</strong><span>到期记忆</span></div><div><strong>${s.quizAttempts.length}</strong><span>小测次数</span></div></div></div>
      </section>
      <section class="section"><div class="section-head"><div><span class="kicker">三条学习路径</span><h2>所有信奥内容，回到同一个入口</h2></div><p>不让学生在链接、课件、题库之间来回找。</p></div>
        <div class="path-grid">
          <button class="path-card regular" data-route="regular"><span class="path-index">01</span><div class="path-icon">{ }</div><h3>常规课</h3><p>从 C++ 零基础到算法与数据结构，每节都有讲义、代码、练习和测验。</p><b>4 个阶段 · 70 节完整课</b><i>进入课程 →</i></button>
          <button class="path-card gesp" data-route="gesp"><span class="path-index">02</span><div class="path-icon">1–8</div><h3>考级课</h3><p>按 CCF GESP C++ 现行能力阶梯，从 1 级系统走到 8 级。</p><b>8 个等级 · 76 节完整课</b><i>进入课程 →</i></button>
          <button class="path-card camp" data-route="camp"><span class="path-index">03</span><div class="path-icon">J</div><h3>集训课</h3><p>CSP-J 第一轮知识闯关、第二轮算法训练和历年真题 Boss。</p><b>当前主线 · 直指两轮通过</b><i>进入集训 →</i></button>
        </div>
      </section>
      <section class="section memory-strip"><div><span class="kicker light">不是“看懂了”，而是“以后还能想起来”</span><h2>四个动作组成网站的记忆引擎</h2></div><div class="principle-grid">${A.learningPrinciples.map((p,i)=>`<div><span>0${i+1}</span><strong>${p.title}</strong><p>${p.text}</p></div>`).join('')}</div></section>
      <section class="section"><div class="section-head"><div><span class="kicker">直播课可直接用</span><h2>一节课固定成 120 分钟闭环</h2></div><button class="text-link" data-route="lesson/J1">打开第一课示例 →</button></div>${timeline(lessons[0].schedule)}</section>
    `, 'home');
  }

  function timeline(items, notePrefix = '') {
    return `<div class="timeline">${items.map((x,i)=>`<div class="timeline-item" ${notePrefix?`data-note-block="${esc(notePrefix)}-timeline-${i}"`:''}><span>${x[0]}</span><div><strong>${x[1]}</strong><p>${x[2]}</p></div>${i<items.length-1?'<i></i>':''}</div>`).join('')}</div>`;
  }

  function regularPage() {
    const courses = catalog.courses.filter(x=>x.track==='regular');
    const s = store.get();
    return shell(`<section class="page-hero compact"><span class="kicker">常规课 · 70 节完整内容</span><h1>基础能力不是前菜，<br>它是后面所有算法的地基。</h1><p>每一节都包含知识讲解、可运行代码、分层练习、答案、记忆卡和出口测验，不再只有课程名。</p></section>
      <section class="section"><div class="course-grid">${courses.map(c=>{const done=c.lessons.filter(l=>s.completedLessons.includes(l.id)).length;return `<article class="course-card"><div class="course-cover"><span>${c.level}</span><b>全部开放</b></div><div class="course-body"><div class="tags"><span>${c.lessons.length} 节完整课</span><span>每节 120 分钟</span></div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="course-meta"><span>已完成 ${done}/${c.lessons.length}</span><span>讲·练·测·记</span></div><button data-route="course/${c.id}">进入全部关卡</button></div></article>`}).join('')}</div></section>`, 'regular');
  }

  function regularL3Page() {
    return coursePage('regular-l3');
  }

  function gespPage() {
    const courses = catalog.courses.filter(x=>x.track==='gesp');
    const s = store.get();
    return shell(`<section class="page-hero compact gesp-hero"><span class="kicker">CCF GESP · C++ · 76 节完整内容</span><h1>1–8 级，不跳级地长出能力。</h1><p>依据现行认证标准重新排课；所有等级、所有课次直接开放。</p></section><section class="section"><div class="gesp-road">${courses.map((g,i)=>{const done=g.lessons.filter(l=>s.completedLessons.includes(l.id)).length;return `<article><div class="grade-orb">${i+1}</div><div class="grade-line"></div><div class="grade-content"><span>${g.level} · ${g.lessons.length} 节完整课</span><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p><b>已完成 ${done}/${g.lessons.length} · 全部开放</b><button data-route="course/${g.id}">进入 ${g.level} 全部关卡</button></div></article>`}).join('')}</div><div class="official-note"><strong>课程边界以 CCF GESP 现行官方标准为准</strong><p>2026 年修订已纳入：一级不再列位运算，数组不含变长数组，C++ 题默认按 C++11。</p><a href="${catalog.sources.gesp}" target="_blank" rel="noreferrer">查看官方标准 →</a></div></section>`, 'gesp');
  }

  function coursePage(id) {
    const course = courseById(id); if (!course) return notFound();
    const s = store.get();
    const done = course.lessons.filter(x=>s.completedLessons.includes(x.id)).length;
    const bonusProblems=id==='regular-l3'?(window.REGULAR_L3_PROBLEMS||[]):[];
    const bonus=bonusProblems.length?`<div class="unit-section"><div class="section-head sub"><div><span class="kicker">L3 真实课后题</span><h2>31 道原有题目继续保留</h2></div><p>题面、样例与教师参考代码</p></div><div class="problem-list">${bonusProblems.map((p,i)=>`<article><span class="problem-no">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(p.title)}</strong><p>${esc(p.statement).slice(0,120)}${p.statement.length>120?'…':''}</p><div class="tags"><span>难度 ${p.difficulty||2}</span><span>${esc(p.source||'有道 L3')}</span></div></div><button data-problem-preview="${esc(p.id)}">查看题面</button></article>`).join('')}</div></div>`:'';
    return shell(`<section class="page-hero compact ${course.track==='gesp'?'gesp-hero':''}"><span class="kicker">${course.track==='regular'?'常规课':'GESP 考级课'} · ${esc(course.level)}</span><h1>${esc(course.title)}</h1><p>${esc(course.description)} 所有关卡直接进入，不设前置锁。</p></section>
      <section class="section"><div class="course-overview"><div><span>课程进度</span><strong>${done}/${course.lessons.length}</strong><p>出口测验四题全对计为掌握；未通过也不锁下一课。</p></div><div><span>课程资产</span><strong>${course.lessons.length*3}</strong><p>共 ${course.lessons.length*3} 道分层练习、${course.lessons.length*4} 道即时测验。</p></div><div><span>学习方式</span><strong>讲练测记</strong><p>讲义、例题、练习、测验和间隔复习在同一页完成。</p></div></div>
      ${course.units.map((unit,u)=>`<div class="unit-section"><div class="section-head sub"><div><span class="kicker">单元 ${u+1}</span><h2>${esc(unit.title)}</h2></div><p>${unit.lessons.length} 节 · 全部开放</p></div><div class="lesson-card-grid">${unit.lessons.map((l,i)=>`<article class="${s.completedLessons.includes(l.id)?'done':''}"><span>${String(l.order).padStart(2,'0')}</span><div><b>${s.completedLessons.includes(l.id)?'已掌握':'可直接学习'}</b><h3>${esc(l.title)}</h3><p>${esc(l.goal)}</p></div><button data-route="course-lesson/${l.id}">${s.completedLessons.includes(l.id)?'复习本课':'开始学习'}</button></article>`).join('')}</div></div>`).join('')}${bonus}</section>`, course.track==='regular'?'regular':'gesp');
  }

  function courseLessonPage(id) {
    const l = courseLessons.find(x=>x.id===id); if (!l) return notFound();
    const course = courseById(l.courseId); const s = store.get(); const result=ui.quizResults[id];
    const previous = course.lessons[l.order-2]; const next = course.lessons[l.order];
    return shell(`<section class="lesson-hero"><div><button class="back" data-route="course/${course.id}">← 返回 ${esc(course.level)} 课程地图</button><span>${esc(course.level)} · 第 ${l.order} 课 · 120 分钟 · 全部开放</span><h1>${esc(l.title)}</h1><p>${esc(l.goal)}</p></div><div class="lesson-progress"><span>最高成绩</span><strong>${s.bestScores[id]||0}<i>/100</i></strong><b>${s.completedLessons.includes(id)?'已掌握 · 可随时复习':'完成出口测验验证掌握'}</b></div></section>
      <div class="lesson-layout"><aside><strong>本课导航</strong><button class="lesson-nav-link" data-scroll-target="lesson-map">课程节奏</button><button class="lesson-nav-link" data-scroll-target="concepts">核心讲义</button><button class="lesson-nav-link" data-scroll-target="worked-example">完整例题</button><button class="lesson-nav-link" data-scroll-target="practice">分层练习</button><button class="lesson-nav-link" data-scroll-target="recall">记忆卡</button><button class="lesson-nav-link" data-scroll-target="quiz">出口测验</button>${s.teacherMode?'<button id="projection-mode">投屏授课</button>':''}</aside>
      <div class="lesson-main" data-note-course-id="${esc(l.id)}" data-note-course-title="${esc(`${course.level} · ${l.title}`)}" data-note-route="course-lesson/${esc(l.id)}">
        <section class="lesson-block" id="lesson-map"><div class="block-title"><span>01</span><div><b>120 分钟闭环</b><h2>先诊断，再建模，最后独立过关</h2></div></div>${timeline(l.schedule,l.id)}</section>
        <section class="lesson-block" id="concepts"><div class="block-title"><span>02</span><div><b>具体知识点</b><h2>本课必须带走的三件事</h2></div></div><div class="concept-grid">${l.concepts.map((c,i)=>`<article data-note-block="${esc(l.id)}-concept-${i}"><span>${String(i+1).padStart(2,'0')}</span><h3>${esc(c[0])}</h3><p>${esc(c[1])}</p></article>`).join('')}</div></section>
        <section class="lesson-block" id="worked-example"><div class="block-title"><span>03</span><div><b>完整例题</b><h2>${esc(l.example.title)}</h2></div></div><div class="worked-problem"><p data-note-block="${esc(l.id)}-statement">${esc(l.example.statement)}</p><ol>${l.example.steps.map((x,i)=>`<li data-note-block="${esc(l.id)}-step-${i}">${esc(x)}</li>`).join('')}</ol><div class="answer-callout"><strong>结果与解释</strong><p>${esc(l.example.answer)}</p></div><h3>可运行 C++ 示例</h3><pre class="code final-code" data-note-block="${esc(l.id)}-code"><code>${esc(l.example.code)}</code></pre></div><div class="trap-box"><strong>本课易错点</strong>${l.traps.map((x,i)=>`<p data-note-block="${esc(l.id)}-trap-${i}">× ${esc(x)}</p>`).join('')}</div></section>
        <section class="lesson-block" id="practice"><div class="block-title"><span>04</span><div><b>分层练习</b><h2>跟做、独立、迁移，不能只看懂</h2></div></div><div class="practice-grid">${l.practices.map((p,i)=>`<article><span>${esc(p.level)}</span><h3>练习 ${i+1}</h3><p>${esc(p.task)}</p><details><summary>完成后核对答案</summary><div>${esc(p.answer)}</div></details></article>`).join('')}</div></section>
        <section class="lesson-block" id="recall"><div class="block-title"><span>05</span><div><b>主动回忆</b><h2>先想五秒，再揭晓</h2></div></div><div class="memory-cards">${l.memory.map(memoryCard).join('')}</div></section>
        <section class="lesson-block" id="quiz"><div class="block-title"><span>06</span><div><b>出口测验</b><h2>四题全对计为掌握，但不锁其他课</h2></div></div><form class="learning-quiz" data-quiz-lesson="${esc(l.id)}">${l.quiz.map((q,i)=>quizQuestion(l,q,i,result,s.teacherMode)).join('')}<button class="primary quiz-submit" type="submit">交卷并生成错因</button></form>${result?quizSummary(l,result):''}</section>
        <div class="lesson-next">${previous?`<button data-route="course-lesson/${previous.id}">← 上一课 · ${esc(previous.title)}</button>`:'<span></span>'}${next?`<button data-route="course-lesson/${next.id}">下一课 · ${esc(next.title)} →</button>`:`<button data-route="course/${course.id}">返回课程地图 →</button>`}</div>
      </div></div>`, course.track==='regular'?'regular':'gesp');
  }

  function levelState(index) {
    const s = store.get();
    if (s.completedLessons.includes(lessons[index].id)) return 'done';
    return index === 0 ? 'current' : 'open';
  }

  function campPage() {
    const s = store.get();
    const campDone=lessons.filter(l=>s.completedLessons.includes(l.id)).length;
    return shell(`<section class="camp-hero"><div><span class="kicker light">CSP-J 集训课 · 全部开放</span><h1>第一轮拿资格，<br>第二轮写真代码。</h1><p>知识关、专项关、真题 Boss 三层递进；所有内容可直接进入，80 分只记录掌握度，不再锁课。</p><div class="camp-meta"><span>每课 120 分钟</span><span>进度自动保存</span><span>${s.teacherMode?'答案与授课点已显示':'学生模式答题后显示解释'}</span></div></div><div class="camp-score"><strong>${Math.round(campDone/lessons.length*100)}%</strong><span>初赛主线进度</span><button data-route="plan">排我的冲刺计划</button></div></section>
      <section class="section track-section"><div class="track-head"><div><span class="track-number">第一轮</span><h2>初赛知识闯关</h2></div><p>8 关全部开放 × 2 小时 + 历年真题 Boss</p></div><div class="level-map">${lessons.map((l,i)=>{const state=levelState(i);const score=s.bestScores[l.id]||0;return `<article class="level-node ${state}" data-route="lesson/${l.id}"><div class="node-pin"><span>${state==='done'?'✓':l.id}</span></div><div class="node-card"><div><span>第 ${i+1} 关 · 120 分钟 · 直接进入</span>${score?`<b>最高 ${score} 分</b>`:''}</div><h3>${l.title}</h3><p>${l.goal}</p><i>${state==='done'?'已掌握 · 可复习':'开始学习 →'}</i></div></article>`}).join('')}<article class="level-node boss" data-route="exams"><div class="node-pin"><span>★</span></div><div class="node-card"><div><span>最终 Boss</span><b>2015–2025</b></div><h3>历年第一轮真题</h3><p>4 届 NOIP 普及组历史卷 + 7 届 CSP-J 年度目录；其中 2015–2024 十套真题可直接打开。</p><i>进入真题库 →</i></div></article></div></section>
      <section class="section final-section"><div class="track-head"><div><span class="track-number orange">第二轮</span><h2>复赛算法闯关</h2></div><p>每专题 3 课 × 2 小时，代码到洛谷真实提交</p></div><div class="final-grid">${A.finalLevels.map(x=>`<article><span>${x.id}</span><h3>${x.title}</h3><p>${x.scope}</p><div><b>${x.lessons} 课</b><b>${x.duration}</b></div><button data-route="final/${x.id}">查看专题</button></article>`).join('')}</div></section>`, 'camp');
  }

  function lessonPage(id) {
    const l = lessonById(id); if (!l) return notFound();
    const s = store.get();
    const result = ui.quizResults[id];
    return shell(`<section class="lesson-hero"><div><button class="back" data-route="camp">← 返回地图</button><span>${l.id} · 120 分钟 · 全部开放</span><h1>${l.title}</h1><p>${l.goal}</p></div><div class="lesson-progress"><span>掌握线</span><strong>${s.bestScores[id]||0}<i>/100</i></strong><b>${s.completedLessons.includes(id)?'已掌握':'完成小测记录掌握度'}</b></div></section>
      <div class="lesson-layout"><aside><strong>本课导航</strong><button class="lesson-nav-link" data-scroll-target="lesson-map">课程节奏</button><button class="lesson-nav-link" data-scroll-target="concepts">核心讲义</button><button class="lesson-nav-link" data-scroll-target="examples">例子与陷阱</button><button class="lesson-nav-link" data-scroll-target="recall">记忆卡</button><button class="lesson-nav-link" data-scroll-target="quiz">出口小测</button>${s.teacherMode?'<button id="projection-mode">投屏授课</button>':''}</aside><div class="lesson-main" data-note-course-id="${esc(l.id)}" data-note-course-title="${esc(`${l.id} · ${l.title}`)}" data-note-route="lesson/${esc(l.id)}">
        <section class="lesson-block" id="lesson-map"><div class="block-title"><span>01</span><div><b>两小时怎么上</b><h2>先想、再学、再练、最后讲回</h2></div></div>${timeline(l.schedule, l.id)}</section>
        <section class="lesson-block" id="concepts"><div class="block-title"><span>02</span><div><b>核心讲义</b><h2>一张地图装下本课知识</h2></div></div><div class="concept-grid">${l.concepts.map((c,i)=>`<article data-note-block="${esc(l.id)}-concept-${i}"><span>${String(i+1).padStart(2,'0')}</span><h3>${c[0]}</h3><p>${c[1]}</p></article>`).join('')}</div></section>
        <section class="lesson-block" id="examples"><div class="block-title"><span>03</span><div><b>例子与陷阱</b><h2>会做之前，先知道会错在哪</h2></div></div><div class="example-box"><div><strong>课堂示例</strong>${l.examples.map((x,i)=>`<p data-note-block="${esc(l.id)}-example-${i}">${esc(x)}</p>`).join('')}</div><div class="trap-box"><strong>高频陷阱</strong>${l.traps.map((x,i)=>`<p data-note-block="${esc(l.id)}-trap-${i}">× ${esc(x)}</p>`).join('')}</div></div>${s.teacherMode?`<div class="teacher-note"><strong>教师授课抓手</strong><p>先让学生公开预测，再揭晓；每个错误都追问“是知识不会、读题失误，还是跟踪过程丢状态”。本课最后随机点一名学生用 60 秒讲回核心地图。</p></div>`:''}</section>
        <section class="lesson-block" id="recall"><div class="block-title"><span>04</span><div><b>主动回忆</b><h2>先回答，点开后再核对</h2></div></div><div class="memory-cards">${l.memory.map(card=>memoryCard(card)).join('')}</div></section>
        <section class="lesson-block" id="quiz"><div class="block-title"><span>05</span><div><b>出口小测</b><h2>80 分过关，只补真正薄弱处</h2></div></div><form id="lesson-quiz">${l.quiz.map((q,i)=>quizQuestion(l,q,i,result,s.teacherMode)).join('')}<button class="primary quiz-submit" type="submit">交卷并生成错因</button></form>${result?quizSummary(l,result):''}</section>
      </div></div>`, 'camp');
  }

  function memoryCard(card) {
    const revealed = ui.revealedCards.has(card.id); const rec = store.get().memory[card.id];
    return `<article class="memory-card ${revealed?'revealed':''}" data-card="${card.id}"><span>${esc(card.tag)}</span><h3>${esc(card.prompt)}</h3>${revealed?`<div class="memory-answer"><p>${esc(card.answer)}</p><div><button data-rate="again" data-card-id="${card.id}">忘了</button><button data-rate="hard" data-card-id="${card.id}">模糊</button><button data-rate="good" data-card-id="${card.id}">会了</button></div></div>`:`<button data-reveal-card="${card.id}">先想 5 秒，再看答案</button>`}${rec?`<small>已复习 ${rec.reviews} 次 · 下次 ${formatDate(rec.dueAt)}</small>`:''}</article>`;
  }

  function quizQuestion(lesson, q, index, result, teacher) {
    const selected = (ui.quizAnswers[lesson.id] || {})[q.id];
    const answered = result || teacher;
    return `<fieldset class="quiz-question"><legend><span>${index+1}</span>${esc(q.stem)}</legend><div class="options">${q.options.map((o,i)=>`<label class="${answered&&i===q.answer?'correct':''} ${result&&selected===i&&i!==q.answer?'wrong':''}"><input type="radio" name="${q.id}" value="${i}" ${selected===i?'checked':''}><span>${String.fromCharCode(65+i)}</span>${esc(o)}</label>`).join('')}</div>${answered?`<div class="explanation"><strong>答案 ${String.fromCharCode(65+q.answer)}</strong><p>${esc(q.explanation)}</p></div>`:''}</fieldset>`;
  }

  function quizSummary(lesson, result) {
    return `<div class="quiz-summary ${result.score>=80?'pass':'retry'}"><strong>${result.score>=80?'本课已掌握':'还差一点，先补错因'}</strong><span>${result.score} 分</span><p>${result.score>=80?'所有课程一直开放；现在把易忘点加入间隔复习，明天再检验一次。':`错了 ${result.wrongIds.length} 题。其他课程不会上锁，回到对应讲义和记忆卡补强即可。`}</p></div>`;
  }

  function examsPage() {
    return shell(`<section class="page-hero compact"><span class="kicker">历年真题 Boss</span><h1>11 个年度，不伪装成“10 届 CSP-J”。</h1><p>CSP-J 始于 2019 年；为了覆盖近十年训练，2015–2018 明确标为 NOIP 普及组历史衔接卷，2019–2025 才是 CSP-J。</p></section><section class="section exam-section"><div class="exam-tabs"><button class="active">第一轮 · 笔试</button><button data-route="second-exams">第二轮 · 上机</button></div><div class="exam-grid">${A.firstRound.map(x=>`<article><div><span>${x.year}</span><b>${x.family}</b></div><h3>${x.name}</h3><p>${x.note}</p><div class="exam-actions">${x.localPaper?`<a href="${x.localPaper}" target="_blank">打开本地试卷</a>`:'<button disabled>官方题面未公开</button>'}${x.localAnswer?`<a class="answer-link teacher-only ${store.get().teacherMode?'show':''}" href="${x.localAnswer}" target="_blank">参考答案</a>`:''}</div></article>`).join('')}</div><div class="integrity-note"><strong>内容诚信线</strong><p>2015–2024 十套第一轮试卷已在站内；2025 只保留年度位置，等待 CCF 公开题面。答案入口只在教师模式出现。</p></div></section>`, 'exams');
  }

  function secondExamsPage() {
    return shell(`<section class="page-hero compact"><span class="kicker">第二轮真题</span><h1>读题、建模、写完、真实提交。</h1><p>每年 4 题，网站负责分层提示与复盘；在线判题直接交给洛谷，避免假判题。</p></section><section class="section"><div class="exam-grid second">${A.secondRound.map(x=>`<article><div><span>${x.year}</span><b>${x.family}</b></div><h3>${x.name}</h3><p>${x.problemCount} 题 · ${x.note}</p><a href="${x.url}" target="_blank" rel="noreferrer">去洛谷题单提交 →</a></article>`).join('')}</div></section>`, 'exams');
  }

  function memoryPage() {
    const cards = allCards(); const due = store.dueCards(cards); const s = store.get();
    const target = due.length ? due.slice(0, 18) : cards.slice(0, 8);
    const wrong = allLearningLessons.flatMap(l=>(l.quiz||[]).map(q=>Object.assign({lesson:l},q))).filter(x=>s.wrongQuestionIds.includes(x.id));
    return shell(`<section class="page-hero compact memory-hero"><span class="kicker">记忆中心</span><h1>今天该想起什么，网站替你记。</h1><p>常规课、考级课和集训课共用同一套复习队列；先回忆、再揭晓、按真实熟练度排下次复习。</p></section><section class="section"><div class="memory-dashboard"><div><span>今日到期</span><strong>${due.length}</strong><p>建议控制在 15 分钟内，宁可少而真。</p></div><div><span>累计复习</span><strong>${Object.values(s.memory).reduce((n,x)=>n+(x.reviews||0),0)}</strong><p>重复看不计数，必须先尝试回忆。</p></div><div><span>待修错题</span><strong>${wrong.length}</strong><p>概念、读题、跟踪、计算、策略五类归因。</p></div></div><div class="section-head sub"><div><span class="kicker">今日队列</span><h2>${due.length?'到期记忆卡':'今天已清空，抽检 8 张'}</h2></div></div><div class="memory-cards wide">${target.map(memoryCard).join('')}</div>${wrong.length?`<div class="wrong-box"><h2>错题修复队列</h2>${wrong.map(x=>`<article><span>${x.lesson.id}</span><div><strong>${esc(x.stem)}</strong><p>返回对应讲义，完成一道同构题。</p></div><button data-route="${x.lesson.courseId?`course-lesson/${x.lesson.id}`:x.lesson.topicId?`final/${x.lesson.topicId}`:`lesson/${x.lesson.id}`}">去修复</button></article>`).join('')}</div>`:''}</section>`, 'memory');
  }

  function planPage() {
    const s=store.get(); const days=ui.planDays==null?daysToExam():ui.planDays; const week=ui.planWeek; const plan=s.plan;
    return shell(`<section class="page-hero compact"><span class="kicker">冲刺计划生成器</span><h1>把剩余时间换成每天能做的动作。</h1><p>只安排未过关内容，按初赛主线顺序，不重不漏；时间不足时自动压缩。</p></section><section class="section plan-layout"><form id="plan-form" class="plan-form"><label>距考试还有多少天<input id="plan-days" type="number" min="1" max="365" value="${days}"></label><label>每周能学几天<select id="plan-week">${[2,3,4,5,6,7].map(x=>`<option ${x===week?'selected':''}>${x}</option>`).join('')}</select></label><button class="primary" type="submit">生成计划</button></form>${plan?renderPlan(plan):'<div class="plan-empty"><strong>先填真实可用时间</strong><p>计划不是把课表塞满，而是保证每次都留出回忆、练习和复盘。</p></div>'}</section>`, 'camp');
  }

  function buildPlan(days, perWeek) {
    const s=store.get(); const pending=lessons.filter(l=>!s.completedLessons.includes(l.id));
    const slots=[]; const start=new Date();
    for(let i=0;i<days;i++){const d=new Date(start.getTime()+i*86400000);const weekIndex=Math.floor(i/7);const inWeek=i%7;if(inWeek<perWeek)slots.push({day:i+1,date:d});}
    const tasks=[]; const core=pending.map(l=>({type:'lesson',label:`${l.id} ${l.title}`,minutes:120}));
    A.firstRound.filter(x=>x.year>=2019).slice(-4).forEach(x=>core.push({type:'exam',label:`${x.year} 第一轮真题`,minutes:120}));
    core.forEach((task,i)=>{const slot=slots[Math.min(i,Math.max(0,slots.length-1))];if(slot)tasks.push(Object.assign({},task,slot));});
    return {createdAt:Date.now(),days,perWeek,available:slots.length,required:core.length,compressed:core.length>slots.length,tasks};
  }

  function renderPlan(plan) {
    return `<div class="plan-result"><div class="plan-status ${plan.compressed?'warn':'ok'}"><strong>${plan.compressed?'需要压缩':'节奏可行'}</strong><p>可学习 ${plan.available} 天，需要完成 ${plan.required} 个核心任务。${plan.compressed?'建议增加每周学习天数，或把部分真题放到课后。':'每个学习日只安排一个 2 小时核心任务。'}</p></div><div class="plan-list">${plan.tasks.map((x,i)=>`<article><span>${formatDate(x.date)}</span><div><b>${x.type==='exam'?'真题':'课程'} ${String(i+1).padStart(2,'0')}</b><strong>${x.label}</strong></div><i>${x.minutes} 分钟</i></article>`).join('')}</div><button id="print-plan" class="secondary">打印计划</button></div>`;
  }

  function finalPage(id) {
    const topic=(window.FINAL_LESSONS||{})[id];
    if(!topic)return notFound();
    const s=store.get();
    const lessonBlocks=topic.lessons.map((l,i)=>{
      const learning=finalLearningLessons.find(x=>x.id===l.id);
      const result=ui.quizResults[l.id];
      return `<section class="lesson-block" id="${esc(l.id)}" data-final-lesson="${esc(l.id)}">
      <div class="block-title"><span>0${i+1}</span><div><b>第 ${i+1} 课 · 120 分钟</b><h2>${esc(l.title)}</h2></div></div>
      <p data-note-block="${esc(topic.id)}-${esc(l.id)}-goal"><strong>本课目标：</strong>${esc(l.goal)}</p>
      <div class="concept-grid">${l.concepts.map((c,j)=>`<article data-final-concept data-note-block="${esc(topic.id)}-${esc(l.id)}-concept-${j}"><span>${String(j+1).padStart(2,'0')}</span><h3>${esc(c[0])}</h3><p>${esc(c[1])}</p></article>`).join('')}</div>
      <div class="example-box"><div><strong>完整例题 · ${esc(l.example.title)}</strong><p data-note-block="${esc(topic.id)}-${esc(l.id)}-statement">${esc(l.example.statement)}</p><h3>分步思路</h3><ol>${l.example.steps.map((x,j)=>`<li data-note-block="${esc(topic.id)}-${esc(l.id)}-step-${j}">${esc(x)}</li>`).join('')}</ol></div><div class="trap-box"><strong>本课易错点</strong>${l.traps.map((x,j)=>`<p data-note-block="${esc(topic.id)}-${esc(l.id)}-trap-${j}">× ${esc(x)}</p>`).join('')}</div></div>
      <h3>可编译 C++ 参考代码</h3><pre class="code final-code" data-note-block="${esc(topic.id)}-${esc(l.id)}-code"><code>${esc(l.example.code)}</code></pre>
      <div class="example-box"><div><strong>逐步讲解</strong>${l.example.walkthrough.map((x,j)=>`<p data-note-block="${esc(topic.id)}-${esc(l.id)}-walkthrough-${j}"><b>第 ${j+1} 步：</b>${esc(x)}</p>`).join('')}</div></div>
      ${s.teacherMode?`<div class="teacher-note final-teacher-tips" data-teacher-tips><strong>教师授课提示</strong>${l.teacherTips.map(x=>`<p>· ${esc(x)}</p>`).join('')}</div>`:''}
      <div class="section-head sub"><div><span class="kicker">本课记忆卡</span><h3>先想，再揭晓</h3></div></div><div class="memory-cards">${learning.memory.map(memoryCard).join('')}</div>
      <div class="section-head sub"><div><span class="kicker">本课出口测验</span><h3>四题全对计为掌握</h3></div></div><form class="learning-quiz" data-quiz-lesson="${esc(l.id)}">${learning.quiz.map((q,j)=>quizQuestion(learning,q,j,result,s.teacherMode)).join('')}<button class="primary quiz-submit" type="submit">提交本课测验</button></form>${result?quizSummary(learning,result):''}
    </section>`;
    }).join('');
    const exercises=topic.exercises.map((p,i)=>`<article class="final-exercise"><span class="problem-no">${i+1}</span><div><strong>${esc(p.luoguId)} · ${esc(p.title)}</strong><p>${esc(p.year)} ${esc(p.source)} · ${esc(p.difficulty)} · ${esc(p.hint)}</p></div><a href="https://www.luogu.com.cn/problem/${esc(p.luoguId)}" target="_blank" rel="noreferrer">去洛谷做题 →</a></article>`).join('');
    return shell(`<section class="page-hero compact final-hero" data-final-topic="${esc(topic.id)}"><span class="kicker">${esc(topic.id)} · 复赛专题</span><h1>${esc(topic.title)}</h1><p>3 课 × 120 分钟：建立模型、完整例题与代码、混合训练与迁移。每课都能直接用于直播讲解。</p></section>
      <div class="lesson-layout"><aside><strong>专题导航</strong>${topic.lessons.map((l,i)=>`<button class="lesson-nav-link" data-scroll-target="${esc(l.id)}">第 ${i+1} 课</button>`).join('')}<button class="lesson-nav-link" data-scroll-target="final-exercises">专题练习</button>${s.teacherMode?'<button id="projection-mode">投屏授课</button>':''}</aside><div class="lesson-main" data-note-course-id="${esc(topic.id)}" data-note-course-title="${esc(`${topic.id} · ${topic.title}`)}" data-note-route="final/${esc(topic.id)}">${lessonBlocks}
      <section class="lesson-block" id="final-exercises"><div class="block-title"><span>04</span><div><b>专题练习</b><h2>6 道历年复赛真题，去洛谷真实提交</h2></div></div><div class="problem-list compact">${exercises}</div></section>
      </div></div>`, 'camp');
  }

  function progressPage(){
    const s=store.get();
    const mastered=allLearningLessons.filter(l=>s.completedLessons.includes(l.id)).length;
    const regularDone=courseLessons.filter(l=>l.track==='regular'&&s.completedLessons.includes(l.id)).length;
    const gespDone=courseLessons.filter(l=>l.track==='gesp'&&s.completedLessons.includes(l.id)).length;
    const campDone=lessons.filter(l=>s.completedLessons.includes(l.id)).length;
    const finalDone=finalLearningLessons.filter(l=>s.completedLessons.includes(l.id)).length;
    return shell(`<section class="page-hero compact"><span class="kicker">我的学习</span><h1>${esc(s.profile.name)}，进度要看真掌握。</h1><p>${esc(s.profile.target)}</p></section><section class="section"><div class="memory-dashboard"><div><span>全部已掌握</span><strong>${mastered}/${allLearningLessons.length}</strong><p>172 节内容课按出口测验计入；2 个真题 Boss 独立训练。</p></div><div><span>最好成绩均值</span><strong>${Math.round(Object.values(s.bestScores).reduce((a,b)=>a+b,0)/Math.max(1,Object.keys(s.bestScores).length))}</strong><p>不拿浏览时长冒充学习效果。</p></div><div><span>待修错题</span><strong>${s.wrongQuestionIds.length}</strong><p>错题清零后再做整卷。</p></div></div><div class="track-progress-grid"><article><span>常规课</span><strong>${regularDone}/70</strong><button data-route="regular">继续学习</button></article><article><span>GESP 考级课</span><strong>${gespDone}/76</strong><button data-route="gesp">继续学习</button></article><article><span>CSP-J 第一轮</span><strong>${campDone}/8</strong><button data-route="camp">继续学习</button></article><article><span>CSP-J 第二轮</span><strong>${finalDone}/18</strong><button data-route="camp">继续学习</button></article></div><div class="activity"><h2>最近真实动作</h2>${s.activity.length?s.activity.map(x=>`<article><span>${new Date(x.at).toLocaleString('zh-CN',{hour12:false})}</span><strong>${esc(x.label)}</strong></article>`).join(''):'<div class="empty-state">完成一次小测或记忆复习后，这里才会出现记录。</div>'}</div><button id="reset-progress" class="danger">清空本机学习进度</button></section>`, '');
  }

  function notFound(){return shell('<section class="locked-page"><strong>这个链接无效或已经更新</strong><p>请回首页重新选择常规课、考级课或集训课；现有课程均已开放。</p><button class="primary" data-route="home">返回首页</button></section>','');}

  function render() {
    const [page,id]=pathParts();
    const pages={home:homePage,regular:regularPage,'regular-l3':regularL3Page,gesp:gespPage,course:()=>coursePage(id),'course-lesson':()=>courseLessonPage(id),camp:campPage,lesson:()=>lessonPage(id),exams:examsPage,'second-exams':secondExamsPage,memory:memoryPage,plan:planPage,final:()=>finalPage(id),progress:progressPage};
    app.innerHTML=(pages[page]||notFound)(); bind(); window.scrollTo(0,0);
    document.dispatchEvent(new CustomEvent('academy:rendered', { detail: { page, id } }));
  }

  function bind() {
    document.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>route(el.dataset.route));
    const teacher=document.getElementById('teacher-mode'); if(teacher)teacher.onclick=()=>{
      if(store.get().teacherMode){store.setTeacherMode(false);toast('已回到学生模式');render();return;}
      const code=window.prompt('请输入教师备课口令'); if(code==='xtl2026'){store.setTeacherMode(true);toast('教师模式已开启','success');render()}else if(code!==null)toast('口令不正确','error');
    };
    document.querySelectorAll('[data-reveal-card]').forEach(el=>el.onclick=()=>{ui.revealedCards.add(el.dataset.revealCard);render()});
    document.querySelectorAll('[data-rate]').forEach(el=>el.onclick=()=>{store.reviewCard(el.dataset.cardId,el.dataset.rate);ui.revealedCards.delete(el.dataset.cardId);toast('已排入下一次复习','success');render()});
    document.querySelectorAll('[data-scroll-target]').forEach(el=>el.onclick=()=>{const target=document.getElementById(el.dataset.scrollTarget);if(target)target.scrollIntoView({behavior:'smooth',block:'start'})});
    document.querySelectorAll('input[type=radio]').forEach(el=>el.onchange=()=>{const lessonId=el.closest('[data-quiz-lesson]')?.dataset.quizLesson||pathParts()[1];ui.quizAnswers[lessonId]=Object.assign({},ui.quizAnswers[lessonId],{[el.name]:Number(el.value)})});
    document.querySelectorAll('#lesson-quiz, .learning-quiz').forEach(quiz=>quiz.onsubmit=e=>{e.preventDefault();const id=quiz.dataset.quizLesson||pathParts()[1],l=lessonById(id),answers=ui.quizAnswers[id]||{};if(Object.keys(answers).length<l.quiz.length){toast('还有题目没作答','error');return}const wrong=l.quiz.filter(q=>answers[q.id]!==q.answer).map(q=>q.id);const score=Math.round((l.quiz.length-wrong.length)/l.quiz.length*100);ui.quizResults[id]={score,wrongIds:wrong};store.recordQuiz(id,score,wrong);toast(score>=80?'本课已掌握':'已生成错因修复队列',score>=80?'success':'error');render()});
    const projection=document.getElementById('projection-mode');if(projection)projection.onclick=()=>{document.body.classList.toggle('projection');toast(document.body.classList.contains('projection')?'已进入投屏视图':'已退出投屏视图')};
    const plan=document.getElementById('plan-form');if(plan)plan.onsubmit=e=>{e.preventDefault();ui.planDays=Number(document.getElementById('plan-days').value);ui.planWeek=Number(document.getElementById('plan-week').value);store.savePlan(buildPlan(ui.planDays,ui.planWeek));render()};
    const print=document.getElementById('print-plan');if(print)print.onclick=()=>window.print();
    document.querySelectorAll('[data-problem-preview]').forEach(el=>el.onclick=()=>showProblem(el.dataset.problemPreview));
    const reset=document.getElementById('reset-progress');if(reset)reset.onclick=()=>{if(window.confirm('确认清空这台浏览器里的全部学习进度？此操作无法撤回。')){store.reset();toast('学习进度已清空');render()}};
  }

  function showProblem(id) {
    const p=(window.REGULAR_L3_PROBLEMS||[]).find(x=>x.id===id);if(!p)return;
    const modal=document.createElement('div');modal.className='modal-layer';modal.innerHTML=`<div class="modal"><button class="modal-close">×</button><span>${esc(p.source||'课后题')}</span><h2>${esc(p.title)}</h2><p class="statement">${esc(p.statement)}</p><h3>输入格式</h3><pre>${esc(p.inputFormat||'见题面')}</pre><h3>输出格式</h3><pre>${esc(p.outputFormat||'见题面')}</pre>${(p.samples||[]).map(x=>`<div class="sample"><div><b>输入</b><pre>${esc(x.in)}</pre></div><div><b>输出</b><pre>${esc(x.out)}</pre></div></div>`).join('')}${store.get().teacherMode&&p.referenceCode?`<h3>教师参考代码</h3><pre class="code">${esc(p.referenceCode)}</pre>`:''}</div>`;document.body.appendChild(modal);modal.onclick=e=>{if(e.target===modal||e.target.classList.contains('modal-close'))modal.remove()};
  }

  window.addEventListener('hashchange',render); render();
})();
