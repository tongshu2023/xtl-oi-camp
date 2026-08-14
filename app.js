(function () {
  const data = window.CSPJ_DATA;
  const { config, levels, quizBank, realExams, problems, articles } = data;
  const store = window.AppStore;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  const ui = {
    quizAnswers: {}, practiceAnswers: {}, examAnswers: {},
    examStartedAt: null, examTimer: null, projectorIndex: 0, projectorReveal: false,
    plan: store.get().plan || null, wikiQuery: '', profileTab: 'overview'
  };

  const esc = value => String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const route = path => { location.hash = `#/${String(path).replace(/^\//, '')}`; };
  const current = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const isTeacher = () => Boolean(store.get().teacherMode);
  const byId = (list, id) => list.find(item => item.id === id);
  const levelById = id => byId(levels, id);
  const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  function toast(message, type = '') {
    toastRoot.innerHTML = `<div class="toast ${type}">${esc(message)}</div>`;
    setTimeout(() => { toastRoot.innerHTML = ''; }, 2400);
  }

  function showModal({ title, content, confirmText = '确认', cancelText = '取消', onConfirm }) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <h2>${esc(title)}</h2><div class="modal-content">${content}</div>
      <div class="modal-actions"><button class="ghost-btn" id="modal-cancel">${esc(cancelText)}</button><button class="primary-btn" id="modal-confirm">${esc(confirmText)}</button></div>
    </section></div>`;
    document.getElementById('modal-cancel').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modal-confirm').onclick = () => {
      const close = onConfirm ? onConfirm() : true;
      if (close !== false) modalRoot.innerHTML = '';
    };
  }

  function enterTeacherMode() {
    showModal({
      title: '教师备课', confirmText: '进入教师模式',
      content: '<p>输入备课口令后，可查看答案、解析与授课要点。</p><label class="field-label" for="teacher-passphrase">备课口令</label><input id="teacher-passphrase" type="password" autocomplete="off" placeholder="请输入口令"><p class="form-error" id="teacher-error" aria-live="polite"></p>',
      onConfirm() {
        const input = document.getElementById('teacher-passphrase');
        if (input.value !== config.teacherPassphrase) {
          document.getElementById('teacher-error').textContent = '口令不正确，请重新输入。';
          input.select();
          return false;
        }
        store.setTeacherMode(true);
        toast('已进入教师模式', 'success');
        render();
        return true;
      }
    });
  }

  function exitTeacherMode() {
    store.setTeacherMode(false);
    toast('已回到学生模式');
    render();
  }

  function header(active) {
    const teacher = isTeacher();
    const navs = [
      ['home', '闯关地图'], ['exams', '模拟考试'], ['wiki', '信奥百科'],
      ['plan', '冲刺计划'], ['wrongbook', '错题本']
    ];
    return `<header class="topbar"><div class="container topbar-inner">
      <button class="brand link-btn" data-route="home"><span class="brand-mark">J</span><span><b>CSP-J</b><small>闯关营</small></span></button>
      <nav class="nav" aria-label="主导航">${navs.map(item => `<button class="nav-link ${active === item[0] ? 'active' : ''}" data-route="${item[0]}">${item[1]}</button>`).join('')}</nav>
      <div class="top-actions">
        ${teacher ? '<span class="mode-badge">教师模式</span><button class="teacher-btn" data-action="exit-teacher">退出备课</button>' : '<button class="teacher-btn" data-action="teacher">教师备课</button>'}
        <button class="user-btn" data-route="profile">个人中心</button>
      </div>
    </div></header>`;
  }

  function footer() {
    return `<footer class="footer"><div class="container"><strong>CSP-J 闯关营</strong><span>数据仅保存在当前浏览器 · 内容标注 SAMPLE 的部分待正式灌装</span></div></footer>`;
  }

  function shell(content, active = '', options = {}) {
    // 无障碍：每个视图都经 shell() 渲染同一条固定顶部导航（切页即重复出现）。给内容里第一个
    // <main> 注入 id="main-content"/tabindex="-1"（只替首个，保证全页恰一个可聚焦主地标），并在
    // 导航前置一个默认藏、聚焦才现身的 skip-link——键盘/读屏用户按一次 Tab 即可跳过重复导航。WCAG 2.4.1。
    const body = content.replace('<main', '<main id="main-content" tabindex="-1"');
    return `<div class="shell"><a class="skip-link" href="#main-content">跳到主内容</a>${header(active)}${body}${options.noFooter ? '' : footer()}</div>`;
  }

  function countdownDays() {
    const target = new Date(`${config.examDate}T00:00:00+08:00`).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / 86400000));
  }

  function trackLevels(track) { return levels.filter(level => level.track === track).sort((a, b) => a.order - b.order); }

  function levelStatus(level) {
    const completed = store.get().completedLevels || [];
    if (completed.includes(level.id)) return 'passed';
    const track = trackLevels(level.track);
    const index = track.findIndex(item => item.id === level.id);
    if (index === 0 || completed.includes(track[index - 1].id)) return 'current';
    return 'locked';
  }

  function progressFor(track) {
    const list = trackLevels(track);
    const count = list.filter(level => store.get().completedLevels.includes(level.id)).length;
    return { count, total: list.length, percent: Math.round(count / list.length * 100) };
  }

  function levelNode(level, index) {
    const status = levelStatus(level);
    const stateText = status === 'passed' ? '已过关' : status === 'current' ? '进行中' : '锁定';
    const canOpen = status !== 'locked' || isTeacher();
    return `<article class="level-node ${status}" data-testid="level-node" data-level-id="${level.id}">
      <div class="node-rail"><span class="node-dot">${status === 'passed' ? '✓' : status === 'locked' ? '锁' : index + 1}</span></div>
      <div class="node-card">
        <div class="node-top"><span class="level-code">${esc(level.id)}</span><span class="state-pill ${status}">${stateText}</span></div>
        <h3>${esc(level.title)}</h3><p>${esc(level.summary)}</p>
        ${canOpen ? `<button class="node-action" data-route="level/${level.id}/lesson">${status === 'passed' ? '回看关卡' : isTeacher() && status === 'locked' ? '教师预览' : '进入关卡'} →</button>` : '<span class="locked-hint">完成上一关后解锁</span>'}
      </div>
    </article>`;
  }

  function trackMap(track, title, subtitle) {
    const list = trackLevels(track);
    const progress = progressFor(track);
    return `<section class="track-panel ${track}" data-testid="track-${track}">
      <div class="track-head"><div><span class="eyebrow">${track === 'preliminary' ? 'ROUND 1' : 'ROUND 2'}</span><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>
      <div class="track-progress"><b>${progress.count}/${progress.total}</b><span>已通过</span><div class="progress"><i style="width:${progress.percent}%"></i></div></div></div>
      <div class="level-path">${list.map(levelNode).join('')}</div>
    </section>`;
  }

  function homePage() {
    const totalPassed = store.get().completedLevels.length;
    return shell(`<main>
      <section class="camp-hero"><div class="container hero-grid"><div>
        <span class="hero-kicker">CSP-J 2026 · 备考作战地图</span>
        <h1>一关一关，把会做变成得分。</h1>
        <p>初赛补知识，复赛练代码；讲义、练习、过关小测和历年真题沿两条主线串成一张地图。</p>
        <div class="hero-stats"><div class="countdown-card" data-testid="countdown"><span>距 ${esc(config.examName)}</span><b>${countdownDays()}</b><em>天</em><small>${config.examDate.replace(/-/g, '.')}</small></div>
        <div class="mini-stat"><b>${totalPassed}</b><span>已攻克关卡</span></div><div class="mini-stat"><b>${store.get().wrongQuestionIds.length}</b><span>待复盘错题</span></div></div>
      </div><div class="hero-emblem" aria-hidden="true"><span>J</span><b>闯关营</b><small>FIRST · FINAL</small></div></div></section>
      <section class="container map-intro"><div><span class="eyebrow orange">TRAINING MAP</span><h2>双主线闯关地图</h2><p>每条主线独立解锁；小测达到 ${config.passScore}% 后，下一关自动点亮。</p></div><button class="secondary-btn" data-route="plan">生成我的冲刺计划</button></section>
      <div class="container map-grid">
        ${trackMap('preliminary', '主线一 · 初赛线（第一轮）', '基础知识 → 阅读程序 → 完善程序 → 历年真题')}
        ${trackMap('final', '主线二 · 复赛线（第二轮）', '算法专题 → 代码草稿 → 洛谷提交 → 历年真题')}
      </div>
    </main>`, 'home');
  }

  function articleForLevel(levelId) { return articles.find(article => article.levelId === levelId); }
  function quizForLevel(levelId) { return quizBank.filter(question => question.levelId === levelId); }
  function problemsForLevel(levelId) { return problems.filter(problem => problem.levelId === levelId); }

  function cppHighlight(code) {
    return esc(code).split('\n').map(line => {
      const marker = line.indexOf('//');
      const main = marker >= 0 ? line.slice(0, marker) : line;
      const comment = marker >= 0 ? line.slice(marker) : '';
      const highlighted = main
        .replace(/\b(include|using|namespace|int|long|double|char|string|bool|void|return|if|else|for|while|break|continue|const|auto|vector|sort|cin|cout)\b/g, '<span class="cpp-key">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="cpp-num">$1</span>');
      return highlighted + (comment ? `<span class="cpp-comment">${comment}</span>` : '');
    }).join('\n');
  }

  function codeBlock(code, label = 'C++') {
    return `<div class="code-wrap"><div class="code-label">${esc(label)}</div><pre class="cpp-code"><code>${cppHighlight(code)}</code></pre></div>`;
  }

  function teacherNotes(article) {
    if (!isTeacher() || !article || !article.teachingNotes) return '';
    return `<aside class="teacher-panel" data-testid="teaching-notes"><div class="teacher-panel-title"><span>教师专属</span><b>授课要点</b></div><ul>${article.teachingNotes.map(note => `<li>${esc(note)}</li>`).join('')}</ul></aside>`;
  }

  function questionGroup(group, context, selectable) {
    const teacher = isTeacher();
    return `<article class="question-group" data-question-id="${group.id}">
      <div class="question-source"><span>${esc(group.source)}</span><span>${group.section === 'choice' ? '单选题' : group.section === 'reading' ? '阅读程序' : '完善程序'}</span></div>
      <h3>${esc(group.stem)}</h3>${group.code ? codeBlock(group.code) : ''}
      <div class="sub-list">${group.subs.map((sub, subIndex) => {
        const key = `${context}:${group.id}:${subIndex}`;
        const selected = context === 'quiz' ? ui.quizAnswers[key] : context === 'exam' ? ui.examAnswers[key] : ui.practiceAnswers[key];
        return `<section class="sub-question" data-sub-key="${key}"><h4>${group.subs.length > 1 ? `${subIndex + 1}. ` : ''}${esc(sub.stem)}</h4>
          <div class="option-list">${sub.options.map((option, optionIndex) => `<button type="button" class="option ${selected === optionIndex ? 'selected' : ''}" ${selectable ? `data-answer-context="${context}" data-answer-key="${key}" data-option-index="${optionIndex}"` : 'disabled'}><span class="option-key">${String.fromCharCode(65 + optionIndex)}</span><span>${esc(option)}</span></button>`).join('')}</div>
          ${teacher ? `<div class="answer-panel" data-testid="teacher-answer"><b>答案 ${String.fromCharCode(65 + sub.answer)}</b><p>${esc(sub.explanation)}</p></div>` : ''}
        </section>`;
      }).join('')}</div>
    </article>`;
  }

  function levelTabs(level, active) {
    let tabs;
    if (level.id === 'J-Boss') tabs = [['exams', '历年真题卷']];
    else if (level.id === 'S-Boss') tabs = [['boss', '历年复赛真题']];
    else if (level.track === 'preliminary') tabs = [['lesson', '讲义'], ['practice', '练习题组'], ['quiz', '过关小测']];
    else tabs = [['lesson', '讲义'], ['problems', '例题与练习']];
    return `<nav class="level-tabs">${tabs.map(tab => `<button class="${active === tab[0] ? 'active' : ''}" data-route="level/${level.id}/${tab[0]}">${tab[1]}</button>`).join('')}</nav>`;
  }

  function levelHero(level, tab) {
    const status = levelStatus(level);
    return `<section class="level-hero ${level.track}"><div class="container"><div>
      <div class="breadcrumb"><a data-route="home">闯关地图</a><span>/</span>${level.track === 'preliminary' ? '初赛线' : '复赛线'}</div>
      <div class="level-title-row"><span class="level-code large">${esc(level.id)}</span><div><h1>${esc(level.title)}</h1><p>${esc(level.summary)}</p></div></div>
      <div class="level-state-line"><span class="state-pill ${status}">${status === 'passed' ? '已过关' : status === 'current' ? '进行中' : '教师预览'}</span>${store.get().levelProgress[level.id] ? `<span>最佳小测 ${store.get().levelProgress[level.id].score} 分</span>` : ''}</div>
    </div>${isTeacher() && level.id !== 'J-Boss' && level.id !== 'S-Boss' ? `<button class="projector-btn" data-route="classroom/${level.id}">▣ 投屏授课视图</button>` : ''}</div></section>${levelTabs(level, tab)}`;
  }

  function levelLesson(level) {
    const article = articleForLevel(level.id);
    if (!article) return `<section class="empty-state"><span>SAMPLE</span><h2>本关讲义结构已接通</h2><p>等待正式内容灌装；关卡、导航、进度与教师视图不受影响。</p></section>`;
    return `<article class="lesson-article"><div class="article-lead"><span>${esc(article.category)} · ${article.readTime} 分钟</span><h2>${esc(article.title)}</h2><p>${esc(article.summary)}</p></div>
      ${article.sections.map((section, index) => `<section><span class="section-number">0${index + 1}</span><div><h3>${esc(section.title)}</h3>${section.paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}</div></section>`).join('')}
      ${teacherNotes(article)}
      <div class="note-card"><label for="level-note"><b>我的关卡笔记</b><span>自动保存在本机</span></label><textarea id="level-note" placeholder="用自己的话写下真正理解的内容…">${esc(store.get().notes[level.id] || '')}</textarea></div>
      <div class="next-action"><span>读完讲义后，用练习检查理解。</span><button class="primary-btn" data-route="level/${level.id}/${level.track === 'preliminary' ? 'practice' : 'problems'}">进入${level.track === 'preliminary' ? '练习题组' : '例题与练习'} →</button></div>
    </article>`;
  }

  function levelPractice(level) {
    const groups = quizForLevel(level.id);
    if (!groups.length) return `<section class="empty-state"><span>SAMPLE</span><h2>本关题库入口已就绪</h2><p>正式题目待灌装；当前不会拿其他知识点冒充本关练习。</p></section>`;
    return `<div class="practice-head"><div><span class="eyebrow orange">PRACTICE</span><h2>练习题组</h2><p>练习可反复作答，不计入过关成绩。</p></div><span>${groups.reduce((sum, group) => sum + group.subs.length, 0)} 小题</span></div>
      <div class="question-stack">${groups.map(group => questionGroup(group, 'practice', true)).join('')}</div>
      <div class="sticky-action"><span>准备好了吗？过关小测达到 ${config.passScore}% 即可解锁下一关。</span><button class="primary-btn" data-route="level/${level.id}/quiz">开始过关小测</button></div>`;
  }

  function levelQuiz(level) {
    const groups = quizForLevel(level.id);
    if (!groups.length) return `<section class="empty-state"><span>SAMPLE</span><h2>过关小测待正式题库灌装</h2><p>数据层、计分器和解锁链已经接通。</p></section>`;
    const count = groups.reduce((sum, group) => sum + group.subs.length, 0);
    return `<section class="quiz-intro"><div><span class="eyebrow orange">CHECKPOINT</span><h2>${esc(level.id)} 过关小测</h2><p>${count} 小题 · 正确率达到 ${config.passScore}% 解锁下一关 · 可重复挑战</p></div><div class="pass-ring"><b>${config.passScore}</b><span>及格线</span></div></section>
      <div class="question-stack">${groups.map(group => questionGroup(group, 'quiz', true)).join('')}</div>
      <div class="submit-bar"><span id="quiz-progress">已作答 0/${count}</span><button class="primary-btn" id="submit-quiz" data-level-id="${level.id}">提交小测</button></div>`;
  }

  function difficultyDots(value) {
    return `<span class="difficulty" aria-label="难度 ${value} 星">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= value ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  function problemCard(problem) {
    return `<article class="problem-card" data-problem-id="${problem.id}"><div><span class="sample-flag">${esc(problem.source)}</span><h3>${esc(problem.title)}</h3><div class="tag-row">${problem.knowledgeTags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div></div><div class="problem-card-side">${difficultyDots(problem.difficulty)}<button class="secondary-btn" data-route="problem/${problem.id}">打开题目</button></div></article>`;
  }

  function levelProblems(level) {
    const list = problemsForLevel(level.id);
    if (!list.length) return `<section class="empty-state"><span>SAMPLE</span><h2>本关编程题入口已就绪</h2><p>正式例题与练习待灌装；草稿、教师解析与洛谷提交链已接通。</p></section>`;
    return `<div class="practice-head"><div><span class="eyebrow blue">CODE LAB</span><h2>例题精讲与练习</h2><p>本地写草稿，完成后去洛谷真实提交。</p></div><span>${list.length} 道 SAMPLE 题</span></div><div class="problem-list">${list.map(problemCard).join('')}</div>`;
  }

  function firstBossPage() {
    return `<div class="boss-head"><span class="eyebrow orange">J-BOSS</span><h2>2019–2024 CSP-J 第一轮真题卷</h2><p>按真实题型分节，限时模考，交卷立即出分。当前卷内题目为结构样例。</p></div>
      <div class="exam-grid">${realExams.map(exam => `<article class="exam-card"><div class="exam-year">${exam.year}</div><span class="sample-flag">${esc(exam.source)}</span><h3>${esc(exam.title)}</h3><div class="exam-meta"><span>${exam.duration} 分钟</span><span>${exam.questionIds.length} 个题组</span></div><button class="primary-btn" data-start-exam="${exam.id}">开始计时模考</button></article>`).join('')}</div>`;
  }

  function secondBossPage() {
    return `<div class="boss-head"><span class="eyebrow blue">S-BOSS</span><h2>2019–2024 CSP-J 第二轮真题</h2><p>每年 4 题的固定槽位已就绪；当前仅灌入少量结构样例。</p></div>
      <div class="year-stack">${config.secondRoundYears.map(year => {
        const list = problems.filter(problem => problem.levelId === 'S-Boss' && problem.year === year);
        return `<section class="year-card"><div class="year-title"><b>${year}</b><span>CSP-J 第二轮 · 4 题</span></div><div class="boss-problem-grid">${[0, 1, 2, 3].map((slot, index) => {
          const problem = list[index];
          return problem ? `<button class="boss-slot ready" data-route="problem/${problem.id}"><span>T${slot + 1}</span><b>${esc(problem.title)}</b><small>${esc(problem.knowledgeTags.join(' · '))}</small></button>` : `<div class="boss-slot"><span>T${slot + 1}</span><b>正式题目待灌装</b><small>SAMPLE SLOT</small></div>`;
        }).join('')}</div></section>`;
      }).join('')}</div>`;
  }

  function levelPage(id, requestedTab) {
    const level = levelById(id);
    if (!level) return notFound();
    const defaultTab = level.id === 'J-Boss' ? 'exams' : level.id === 'S-Boss' ? 'boss' : 'lesson';
    const tab = requestedTab || defaultTab;
    let body = '';
    if (tab === 'lesson') body = levelLesson(level);
    else if (tab === 'practice') body = levelPractice(level);
    else if (tab === 'quiz') body = levelQuiz(level);
    else if (tab === 'problems') body = levelProblems(level);
    else if (tab === 'exams') body = firstBossPage();
    else if (tab === 'boss') body = secondBossPage();
    else body = levelLesson(level);
    return shell(`${levelHero(level, tab)}<main class="container level-main">${body}</main>`, level.id === 'J-Boss' ? 'exams' : 'home');
  }

  function problemPage(id) {
    const problem = byId(problems, id);
    if (!problem) return notFound();
    const draft = store.get().codeDrafts[id] == null ? '#include <iostream>\nusing namespace std;\n\nint main() {\n  // 在这里写下你的思路\n  return 0;\n}\n' : store.get().codeDrafts[id];
    const teacher = isTeacher();
    return shell(`<main class="problem-workspace"><section class="problem-statement"><div class="breadcrumb"><a data-route="home">闯关地图</a><span>/</span><a data-route="level/${problem.levelId}/${problem.levelId === 'S-Boss' ? 'boss' : 'problems'}">${esc(problem.levelId)}</a></div>
      <span class="sample-flag">${esc(problem.source)}</span><h1>${esc(problem.title)}</h1><div class="tag-row">${problem.knowledgeTags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}${difficultyDots(problem.difficulty)}</div>
      <h2>题目描述</h2><p>${esc(problem.statement)}</p><h2>输入格式</h2><p>${esc(problem.inputFormat)}</p><h2>输出格式</h2><p>${esc(problem.outputFormat)}</p>
      <h2>样例</h2>${problem.samples.map((sample, index) => `<div class="sample-grid"><div><span>输入 ${index + 1}</span><pre>${esc(sample.in)}</pre></div><div><span>输出 ${index + 1}</span><pre>${esc(sample.out)}</pre></div></div>`).join('')}
      <h2>提示</h2><p>${esc(problem.hint)}</p>
      ${teacher ? `<section class="teacher-solution" data-testid="teacher-answer"><span>教师专属 · 完整思路</span><p>${esc(problem.solutionIdea)}</p>${codeBlock(problem.referenceCode, '参考代码')}</section>` : ''}
    </section><aside class="draft-panel"><div class="draft-head"><div><span>本地代码草稿</span><small>自动保存 · 不会在线判题</small></div><button class="ghost-btn" id="reset-draft">重置</button></div><textarea id="code-draft" spellcheck="false">${esc(draft)}</textarea>
      <div class="draft-actions">${problem.luoguId ? `<a class="primary-btn external-link" href="https://www.luogu.com.cn/problem/${encodeURIComponent(problem.luoguId)}" target="_blank" rel="noopener">去洛谷提交 ↗</a>` : '<span class="muted">暂无洛谷题号</span>'}<button class="secondary-btn" data-route="level/${problem.levelId}/${problem.levelId === 'S-Boss' ? 'boss' : 'problems'}">返回题单</button></div>
    </aside></main>`, 'home', { noFooter: true });
  }

  function examQuestionGroups(exam) {
    return exam.questionIds.map(id => byId(quizBank, id)).filter(Boolean);
  }

  function examsPage() {
    return shell(`<section class="page-head dark"><div class="container"><span class="eyebrow orange">MOCK EXAMS</span><h1>模拟考试</h1><p>用于 J-Boss 与过关小测：限时完成整套决策，再回到错题本复盘。</p></div></section><main class="container page-section"><div class="exam-grid">${realExams.map(exam => `<article class="exam-card"><div class="exam-year">${exam.year}</div><span class="sample-flag">${esc(exam.source)}</span><h3>${esc(exam.title)}</h3><div class="exam-meta"><span>${exam.duration} 分钟</span><span>${examQuestionGroups(exam).reduce((n, group) => n + group.subs.length, 0)} 小题</span></div><button class="primary-btn" data-start-exam="${exam.id}">开始考试</button></article>`).join('')}</div></main>`, 'exams');
  }

  function examPage(id) {
    const exam = byId(realExams, id);
    if (!exam) return notFound();
    const groups = examQuestionGroups(exam);
    const count = groups.reduce((sum, group) => sum + group.subs.length, 0);
    return shell(`<div class="exam-top"><div><span>限时模考</span><h1>${esc(exam.title)}</h1></div><div class="exam-clock" id="exam-clock">${String(exam.duration).padStart(2, '0')}:00</div><button class="danger-btn" id="submit-exam">交卷</button></div>
      <main class="container exam-paper"><div class="paper-notice"><b>SAMPLE 结构样卷</b><span>答案自动保存在当前页面状态；交卷后不能修改。</span></div><div class="question-stack">${groups.map(group => questionGroup(group, 'exam', true)).join('')}</div><div class="submit-bar"><span id="exam-progress">已作答 0/${count}</span><button class="danger-btn" id="submit-exam-bottom">交卷并出分</button></div></main>`, 'exams', { noFooter: true });
  }

  function reportPage(id) {
    const record = store.get().examRecords.find(item => item.id === id);
    if (!record) return notFound();
    const exam = byId(realExams, record.examId);
    const teacher = isTeacher();
    const groups = examQuestionGroups(exam);
    return shell(`<section class="report-hero"><div class="container"><div class="score-disc"><b>${record.score}</b><span>分</span></div><div><span class="eyebrow orange">EXAM REPORT</span><h1>${record.score >= 80 ? '守住基础，继续向 Boss 推进' : '缺口已经暴露，复盘比重做更重要'}</h1><p>${record.correct}/${record.total} 小题正确 · ${esc(record.durationText)} · ${esc(record.createdAt)}</p></div></div></section>
      <main class="container report-grid"><section class="report-card"><h2>本次表现</h2><div class="metric-grid"><div><b>${record.correct}</b><span>答对</span></div><div><b>${record.total - record.correct}</b><span>待复盘</span></div><div><b>${record.score}%</b><span>正确率</span></div></div><p class="student-report-note">学生模式只展示分数与错题入口，不把正确答案写入页面。去错题本重新作答，才能真正修复薄弱点。</p><button class="primary-btn" data-route="wrongbook">去错题本复盘</button></section>
      ${teacher ? `<section class="report-card teacher-review" data-testid="teacher-answer"><h2>教师逐题解析</h2>${groups.map(group => questionGroup(group, 'report', false)).join('')}</section>` : ''}</main>`, 'exams');
  }

  function questionByWrongId(id) {
    const parts = id.split(':');
    const group = byId(quizBank, parts[0]);
    const subIndex = Number(parts[1]);
    return group && group.subs[subIndex] ? { group, sub: group.subs[subIndex], subIndex } : null;
  }

  function wrongBookPage() {
    const wrong = store.get().wrongQuestionIds.map(questionByWrongId).filter(Boolean);
    return shell(`<section class="page-head"><div class="container"><span class="eyebrow orange">RETRY</span><h1>错题本</h1><p>小测与模考中的错误自动归集；重新答对后会自动移出。</p></div></section><main class="container page-section">
      ${wrong.length ? `<div class="wrong-list">${wrong.map(({ group, sub, subIndex }) => `<article class="wrong-card"><div><span class="tag red">待订正</span><span>${esc(group.levelId)} · ${esc(group.source)}</span></div><h3>${esc(sub.stem)}</h3><div class="option-list">${sub.options.map((option, optionIndex) => `<button class="option" data-wrong-id="${group.id}:${subIndex}" data-wrong-option="${optionIndex}"><span class="option-key">${String.fromCharCode(65 + optionIndex)}</span><span>${esc(option)}</span></button>`).join('')}</div>${isTeacher() ? `<div class="answer-panel" data-testid="teacher-answer"><b>答案 ${String.fromCharCode(65 + sub.answer)}</b><p>${esc(sub.explanation)}</p></div>` : ''}</article>`).join('')}</div>` : emptyState('错题本是空的', '完成小测或模考后，答错的题会自动出现在这里。')}
    </main>`, 'wrongbook');
  }

  function availableStudyDates(days, weeklyDays) {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(today.getTime() + offset * 86400000);
      if (offset % 7 < weeklyDays) result.push(date);
    }
    return result;
  }

  function makePlan(days, weeklyDays) {
    const remaining = levels.filter(level => !store.get().completedLevels.includes(level.id));
    const dates = availableStudyDates(days, weeklyDays);
    if (!dates.length || !remaining.length) return { days, weeklyDays, items: [], compressed: false, remaining: remaining.length };
    const groupSize = Math.ceil(remaining.length / dates.length);
    const usedDates = dates.slice(0, Math.ceil(remaining.length / groupSize));
    const items = usedDates.map((date, index) => ({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      levels: remaining.slice(index * groupSize, Math.min((index + 1) * groupSize, remaining.length)).map(level => level.id)
    })).filter(item => item.levels.length);
    return { days, weeklyDays, items, compressed: groupSize > 1, remaining: remaining.length, createdAt: nowText() };
  }

  function planTable(plan) {
    if (!plan) return '';
    if (!plan.items.length) return `<div class="plan-result">${plan.remaining ? emptyState('没有可用学习日', '增加剩余天数或每周可学天数。') : emptyState('全部关卡已通过', '保持手感，去 J-Boss 做整卷模考。')}</div>`;
    return `<section class="plan-result" data-testid="plan-result"><div class="plan-summary"><div><span class="eyebrow blue">YOUR PLAN</span><h2>${plan.items.length} 个学习日，覆盖 ${plan.remaining} 个未过关卡</h2></div><button class="secondary-btn no-print" id="print-plan">打印计划</button></div>
      ${plan.compressed ? `<div class="compression-note" data-testid="compression-note"><b>时间偏紧，已压缩安排</b><span>部分学习日包含多个关卡；优先完成讲义与小测，复赛代码题至少保留一题独立练习。</span></div>` : '<div class="normal-note">时间充足：每个学习日安排一个关卡，保留复盘余量。</div>'}
      <div class="plan-table"><div class="plan-row head"><span>日期</span><span>训练任务</span><span>完成</span></div>${plan.items.map((item, index) => `<div class="plan-row"><span><b>Day ${index + 1}</b><small>${item.date}</small></span><span>${item.levels.map(id => { const level = levelById(id); return `<button data-route="level/${id}/lesson"><b>${id}</b> ${esc(level.title)}</button>`; }).join('')}</span><span class="check-box">□</span></div>`).join('')}</div></section>`;
  }

  function planPage() {
    const defaultDays = countdownDays();
    const plan = ui.plan;
    return shell(`<section class="page-head plan-head"><div class="container"><span class="eyebrow orange">SPRINT PLANNER</span><h1>冲刺计划生成器</h1><p>把所有未过关卡按主线顺序摊进日历，不重、不漏；时间不够时给出压缩建议。</p></div></section><main class="container page-section"><section class="planner-card"><div class="planner-fields"><label><span>剩余天数</span><input id="remaining-days" type="number" min="1" max="365" value="${plan ? plan.days : defaultDays}"><small>默认按 ${config.examDate} 自动计算</small></label><label><span>每周可学天数</span><select id="weekly-days">${[1, 2, 3, 4, 5, 6, 7].map(value => `<option ${value === (plan ? plan.weeklyDays : 5) ? 'selected' : ''}>${value}</option>`).join('')}</select><small>从今天起按每 7 天周期安排</small></label><button class="primary-btn" id="generate-plan">生成按天计划</button></div></section>${planTable(plan)}</main>`, 'plan');
  }

  function wikiPage() {
    const wiki = articles.filter(article => article.levelId == null || article.category === '信奥百科');
    const list = wiki.filter(article => `${article.title}${article.summary}`.toLowerCase().includes(ui.wikiQuery.toLowerCase()));
    return shell(`<section class="page-head"><div class="container"><span class="eyebrow blue">KNOWLEDGE BASE</span><h1>信奥百科</h1><p>讲义之外的考试路线、学习方法与算法拓展。</p></div></section><main class="container page-section"><div class="wiki-tools"><input id="wiki-search" placeholder="搜索文章" value="${esc(ui.wikiQuery)}"><span>${list.length} 篇 SAMPLE 文章</span></div><div class="article-grid">${list.map(article => `<article class="article-card"><span>${esc(article.category)}</span><h2>${esc(article.title)}</h2><p>${esc(article.summary)}</p><div><small>${article.readTime} 分钟</small>${store.get().readArticles.includes(article.id) ? '<small>已读</small>' : ''}</div><button class="secondary-btn" data-route="article/${article.id}">阅读全文 →</button></article>`).join('')}</div></main>`, 'wiki');
  }

  function articlePage(id) {
    const article = byId(articles, id);
    if (!article) return notFound();
    store.markArticleRead(id);
    const favorite = store.get().articleFavorites.includes(id);
    return shell(`<main class="container article-page"><div class="breadcrumb"><a data-route="wiki">信奥百科</a><span>/</span>${esc(article.category)}</div><article class="lesson-article standalone"><div class="article-lead"><span>${esc(article.category)} · ${article.readTime} 分钟</span><h1>${esc(article.title)}</h1><p>${esc(article.summary)}</p></div>${article.sections.map((section, index) => `<section><span class="section-number">0${index + 1}</span><div><h2>${esc(section.title)}</h2>${section.paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}</div></section>`).join('')}${teacherNotes(article)}<div class="article-actions"><button class="primary-btn" id="favorite-article">${favorite ? '★ 已收藏' : '☆ 收藏文章'}</button><button class="secondary-btn" data-route="wiki">返回百科</button></div></article></main>`, 'wiki');
  }

  function profilePage() {
    const state = store.get();
    const preliminary = progressFor('preliminary');
    const finalRound = progressFor('final');
    const tabs = [['overview', '学习概览'], ['quizzes', '小测记录'], ['exams', '模考记录']];
    let body = '';
    if (ui.profileTab === 'overview') body = `<div class="profile-progress"><div><span>初赛线</span><b>${preliminary.count}/${preliminary.total}</b><div class="progress"><i style="width:${preliminary.percent}%"></i></div></div><div><span>复赛线</span><b>${finalRound.count}/${finalRound.total}</b><div class="progress blue"><i style="width:${finalRound.percent}%"></i></div></div></div><div class="profile-actions"><button class="secondary-btn" data-route="home">回到闯关地图</button><button class="secondary-btn" data-route="plan">更新冲刺计划</button><button class="secondary-btn" data-route="wrongbook">复盘错题</button></div>`;
    if (ui.profileTab === 'quizzes') body = state.quizRecords.length ? `<div class="record-list">${state.quizRecords.map(record => `<div><span class="tag ${record.score >= 80 ? 'green' : 'red'}">${record.score} 分</span><b>${esc(record.levelId)} 过关小测</b><small>${esc(record.createdAt)}</small></div>`).join('')}</div>` : emptyState('还没有小测记录', '从 J1 过关小测开始。');
    if (ui.profileTab === 'exams') body = state.examRecords.length ? `<div class="record-list">${state.examRecords.map(record => `<div><span class="tag blue">${record.score} 分</span><b>${esc(byId(realExams, record.examId).title)}</b><small>${esc(record.createdAt)}</small><button class="link-btn" data-route="report/${record.id}">查看报告</button></div>`).join('')}</div>` : emptyState('还没有模考记录', '去模拟考试完成一套结构样卷。');
    return shell(`<section class="profile-hero"><div class="container"><div class="avatar">J</div><div><span>本地学习档案</span><h1>${esc(state.user.name)}</h1><p>${esc(state.user.motto)} · 所有记录仅保存在当前浏览器</p></div><button class="ghost-light-btn" id="edit-profile">修改昵称</button></div></section><main class="container page-section"><div class="metric-grid profile-metrics"><div><b>${state.completedLevels.length}</b><span>已过关</span></div><div><b>${state.wrongQuestionIds.length}</b><span>待复盘</span></div><div><b>${state.quizRecords.length}</b><span>小测次数</span></div><div><b>${state.examRecords.length}</b><span>模考次数</span></div></div><div class="profile-layout"><nav>${tabs.map(tab => `<button class="${ui.profileTab === tab[0] ? 'active' : ''}" data-profile-tab="${tab[0]}">${tab[1]}</button>`).join('')}</nav><section class="profile-content">${body}</section></div></main>`, 'profile');
  }

  function classroomSlides(level) {
    const article = articleForLevel(level.id);
    const slides = [];
    if (article) article.sections.forEach(section => slides.push({ type: 'lesson', kicker: article.title, title: section.title, body: section.paragraphs }));
    quizForLevel(level.id).forEach(group => group.subs.forEach((sub, index) => slides.push({ type: 'question', kicker: `${group.source} · ${index + 1}/${group.subs.length}`, title: sub.stem, options: sub.options, answer: sub.answer, explanation: sub.explanation, code: group.code })));
    problemsForLevel(level.id).forEach(problem => slides.push({ type: 'problem', kicker: problem.source, title: problem.title, body: [problem.statement], answerText: problem.solutionIdea, code: problem.referenceCode }));
    return slides;
  }

  function classroomPage(id) {
    if (!isTeacher()) return shell(`<main class="container page-section">${emptyState('仅教师模式可进入投屏视图', '请从右上角“教师备课”输入口令。')}</main>`, '');
    const level = levelById(id);
    if (!level) return notFound();
    const slides = classroomSlides(level);
    if (!slides.length) return shell(`<main class="container page-section">${emptyState('本关投屏内容待灌装', '页面入口与教师权限已经接通。')}</main>`, 'home');
    const index = Math.min(ui.projectorIndex, slides.length - 1);
    const slide = slides[index];
    let content = '';
    if (slide.type === 'lesson') content = `<div class="projector-copy">${slide.body.map(text => `<p>${esc(text)}</p>`).join('')}</div>`;
    if (slide.type === 'question') content = `${slide.code ? codeBlock(slide.code) : ''}<div class="projector-options">${slide.options.map((option, optionIndex) => `<div><span>${String.fromCharCode(65 + optionIndex)}</span>${esc(option)}</div>`).join('')}</div>${ui.projectorReveal ? `<div class="projector-answer"><b>答案 ${String.fromCharCode(65 + slide.answer)}</b><p>${esc(slide.explanation)}</p></div>` : '<button class="reveal-btn" id="reveal-answer">点击揭晓答案</button>'}`;
    if (slide.type === 'problem') content = `<div class="projector-copy">${slide.body.map(text => `<p>${esc(text)}</p>`).join('')}</div>${ui.projectorReveal ? `<div class="projector-answer"><b>完整思路</b><p>${esc(slide.answerText)}</p>${codeBlock(slide.code, '参考代码')}</div>` : '<button class="reveal-btn" id="reveal-answer">点击揭晓思路</button>'}`;
    return `<div class="projector"><header><div><span>${esc(level.id)}</span><b>${esc(level.title)}</b></div><div>${index + 1} / ${slides.length}</div><button data-route="level/${level.id}/lesson">退出投屏</button></header><main><span class="projector-kicker">${esc(slide.kicker)}</span><h1>${esc(slide.title)}</h1>${content}</main><footer><button id="prev-slide" ${index === 0 ? 'disabled' : ''}>← 上一页</button><div class="slide-dots" aria-hidden="true">${slides.map((_, dotIndex) => `<i class="${dotIndex === index ? 'active' : ''}"></i>`).join('')}</div><button id="next-slide" ${index === slides.length - 1 ? 'disabled' : ''}>下一页 →</button></footer></div>`;
  }

  function emptyState(title, description) { return `<section class="empty-state"><span>◇</span><h2>${esc(title)}</h2><p>${esc(description)}</p></section>`; }

  function notFound() {
    return shell(`<main class="notfound"><div><b>404</b><h1>这条训练路线还没铺好</h1><p>返回闯关地图，继续当前关卡。</p><button class="primary-btn" data-route="home">返回闯关地图</button></div></main>`, '', { noFooter: true });
  }

  function setAnswer(context, key, optionIndex) {
    if (context === 'quiz') ui.quizAnswers[key] = optionIndex;
    else if (context === 'exam') ui.examAnswers[key] = optionIndex;
    else ui.practiceAnswers[key] = optionIndex;
    render();
  }

  function answerEntries(groups, context) {
    const entries = [];
    groups.forEach(group => group.subs.forEach((sub, subIndex) => {
      const key = `${context}:${group.id}:${subIndex}`;
      const selected = context === 'quiz' ? ui.quizAnswers[key] : ui.examAnswers[key];
      entries.push({ id: `${group.id}:${subIndex}`, key, selected, answer: sub.answer });
    }));
    return entries;
  }

  function submitQuiz(levelId) {
    const groups = quizForLevel(levelId);
    const entries = answerEntries(groups, 'quiz');
    if (entries.some(entry => entry.selected == null)) {
      toast(`还有 ${entries.filter(entry => entry.selected == null).length} 题未作答`, 'error');
      return;
    }
    const correct = entries.filter(entry => entry.selected === entry.answer).length;
    const score = Math.round(correct / entries.length * 100);
    const wrongIds = entries.filter(entry => entry.selected !== entry.answer).map(entry => entry.id);
    store.recordQuiz(levelId, { score, questionIds: entries.map(entry => entry.id), wrongIds, createdAt: nowText() });
    Object.keys(ui.quizAnswers).filter(key => key.startsWith(`quiz:`)).forEach(key => delete ui.quizAnswers[key]);
    const passed = score >= config.passScore;
    showModal({ title: passed ? '过关成功' : '还差一点', confirmText: passed ? '返回地图' : '重新挑战', cancelText: passed ? '留在本关' : '去错题本', content: `<div class="result-score ${passed ? 'passed' : ''}"><b>${score}</b><span>分</span></div><p>${passed ? '下一关已经解锁，地图节点已点亮。' : `正确率需达到 ${config.passScore}%，先复盘错题再试一次。`}</p>`, onConfirm() { if (passed) route('home'); else render(); return true; } });
    const cancel = document.getElementById('modal-cancel');
    if (cancel && !passed) cancel.onclick = () => { modalRoot.innerHTML = ''; route('wrongbook'); };
  }

  function startExam(id) {
    ui.examAnswers = {};
    ui.examStartedAt = Date.now();
    route(`exam/${id}`);
  }

  function submitExam(id) {
    const exam = byId(realExams, id);
    const entries = answerEntries(examQuestionGroups(exam), 'exam');
    const unanswered = entries.filter(entry => entry.selected == null).length;
    showModal({
      title: '确认交卷', confirmText: '确认交卷',
      content: `<p>${unanswered ? `还有 ${unanswered} 小题未作答。` : '所有小题都已作答。'}交卷后不能修改。</p>`,
      onConfirm() {
        clearInterval(ui.examTimer);
        const correct = entries.filter(entry => entry.selected === entry.answer).length;
        const total = entries.length;
        const record = {
          id: `report-${Date.now()}`, examId: id, correct, total,
          score: Math.round(correct / Math.max(1, total) * 100),
          questionIds: entries.map(entry => entry.id),
          wrongIds: entries.filter(entry => entry.selected !== entry.answer).map(entry => entry.id),
          durationText: `${Math.max(1, Math.round((Date.now() - (ui.examStartedAt || Date.now())) / 60000))} 分钟`, createdAt: nowText()
        };
        store.finishExam(record);
        ui.examAnswers = {};
        route(`report/${record.id}`);
        return true;
      }
    });
  }

  function updateProgressLabels() {
    const [page, id] = current();
    if (page === 'level') {
      const entries = answerEntries(quizForLevel(id), 'quiz');
      const label = document.getElementById('quiz-progress');
      if (label) label.textContent = `已作答 ${entries.filter(entry => entry.selected != null).length}/${entries.length}`;
    }
    if (page === 'exam') {
      const exam = byId(realExams, id);
      const entries = answerEntries(examQuestionGroups(exam), 'exam');
      const label = document.getElementById('exam-progress');
      if (label) label.textContent = `已作答 ${entries.filter(entry => entry.selected != null).length}/${entries.length}`;
    }
  }

  function bindGlobal() {
    document.querySelectorAll('[data-route]').forEach(element => element.addEventListener('click', () => { if (!element.disabled) route(element.dataset.route); }));
    document.querySelectorAll('[data-action="teacher"]').forEach(element => element.addEventListener('click', enterTeacherMode));
    document.querySelectorAll('[data-action="exit-teacher"]').forEach(element => element.addEventListener('click', exitTeacherMode));
    document.querySelectorAll('[data-answer-context]').forEach(element => element.addEventListener('click', () => setAnswer(element.dataset.answerContext, element.dataset.answerKey, Number(element.dataset.optionIndex))));
    document.querySelectorAll('[data-start-exam]').forEach(element => element.addEventListener('click', () => showModal({ title: '开始限时模考', confirmText: '开始计时', content: '<p>进入后开始计时。学生模式交卷后只显示分数，不把答案写入页面。</p>', onConfirm() { startExam(element.dataset.startExam); return true; } })));
    updateProgressLabels();
  }

  function bindLevel(levelId, tab) {
    const note = document.getElementById('level-note');
    if (note) { let timer; note.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { store.saveNote(levelId, note.value); toast('笔记已自动保存', 'success'); }, 400); }; }
    const submit = document.getElementById('submit-quiz');
    if (submit) submit.onclick = () => submitQuiz(levelId);
    if (tab === 'exams') document.querySelectorAll('[data-start-exam]').forEach(element => element.addEventListener('click', () => showModal({ title: '开始限时模考', confirmText: '开始计时', content: '<p>进入后开始计时，交卷后立即出分。</p>', onConfirm() { startExam(element.dataset.startExam); return true; } })));
  }

  function bindProblem(id) {
    const editor = document.getElementById('code-draft');
    editor.oninput = () => store.saveCodeDraft(id, editor.value);
    document.getElementById('reset-draft').onclick = () => showModal({ title: '重置代码草稿', confirmText: '确认重置', content: '<p>当前草稿会被清空，此操作无法撤销。</p>', onConfirm() { store.saveCodeDraft(id, ''); render(); toast('草稿已清空'); return true; } });
  }

  function bindExam(id) {
    const exam = byId(realExams, id);
    const start = ui.examStartedAt || Date.now();
    ui.examStartedAt = start;
    clearInterval(ui.examTimer);
    const updateClock = () => {
      const left = Math.max(0, exam.duration * 60 - Math.floor((Date.now() - start) / 1000));
      const label = document.getElementById('exam-clock');
      if (label) label.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      if (left === 0) { clearInterval(ui.examTimer); submitExam(id); }
    };
    updateClock();
    ui.examTimer = setInterval(updateClock, 1000);
    document.getElementById('submit-exam').onclick = () => submitExam(id);
    document.getElementById('submit-exam-bottom').onclick = () => submitExam(id);
  }

  function bindWrongBook() {
    document.querySelectorAll('[data-wrong-id]').forEach(element => element.onclick = () => {
      const item = questionByWrongId(element.dataset.wrongId);
      if (!item) return;
      if (Number(element.dataset.wrongOption) === item.sub.answer) {
        const remaining = store.get().wrongQuestionIds.filter(id => id !== element.dataset.wrongId);
        store.update({ wrongQuestionIds: remaining });
        toast('订正成功，已移出错题本', 'success');
        render();
      } else toast('这次还没对，再检查条件', 'error');
    });
  }

  function bindPlan() {
    document.getElementById('generate-plan').onclick = () => {
      const days = Number(document.getElementById('remaining-days').value);
      const weeklyDays = Number(document.getElementById('weekly-days').value);
      if (!Number.isInteger(days) || days < 1 || days > 365) { toast('剩余天数请输入 1–365 的整数', 'error'); return; }
      ui.plan = makePlan(days, weeklyDays);
      store.savePlan(ui.plan);
      render();
    };
    const print = document.getElementById('print-plan');
    if (print) print.onclick = () => window.print();
  }

  function bindWiki() {
    const search = document.getElementById('wiki-search');
    if (search) search.oninput = () => { ui.wikiQuery = search.value; render(); };
  }

  function bindArticle(id) {
    const button = document.getElementById('favorite-article');
    if (button) button.onclick = () => { const active = store.toggleArticleFavorite(id); toast(active ? '文章已收藏' : '已取消收藏', 'success'); render(); };
  }

  function bindProfile() {
    document.querySelectorAll('[data-profile-tab]').forEach(element => element.onclick = () => { ui.profileTab = element.dataset.profileTab; render(); });
    document.getElementById('edit-profile').onclick = () => showModal({ title: '修改本地昵称', confirmText: '保存', content: `<label class="field-label" for="profile-name">昵称</label><input id="profile-name" maxlength="18" value="${esc(store.get().user.name)}">`, onConfirm() { const value = document.getElementById('profile-name').value.trim(); if (!value) return false; store.setUser({ name: value }); render(); return true; } });
  }

  function bindClassroom(levelId) {
    const slides = classroomSlides(levelById(levelId));
    const previous = document.getElementById('prev-slide');
    const next = document.getElementById('next-slide');
    const reveal = document.getElementById('reveal-answer');
    // 投屏授课是幻灯片式操作：每次翻页都会 render() 重建整页 DOM，被点的按钮随之销毁，
    // 焦点默认掉回 <body>——用键盘/翻页笔连续讲课的老师每翻一页都得重新 Tab 回按钮。
    // 翻页后把焦点交还给正在驱动的控件；若它到头被禁用，则移交对侧按钮，保证键盘流不断。
    const restoreFocus = (preferredId, fallbackId) => {
      const preferred = document.getElementById(preferredId);
      if (preferred && !preferred.disabled) { preferred.focus(); return; }
      const fallback = document.getElementById(fallbackId);
      if (fallback && !fallback.disabled) fallback.focus();
    };
    // render() 每次翻页都 app.innerHTML 整体重建投屏 DOM，放进 <main> 的 aria-live 区域是「刚插入的新
    // 节点」，主流读屏器不会播报其初始内容——所以读屏用户只知道焦点回到了按钮，却不知道翻到了第几页、
    // 讲到哪一张。修法：维护一个独立于 #app 容器、常驻 <body> 的 sr-announcer 活区（不随 render() 销毁），
    // 翻页 / 揭晓后主动写入「第 X 页，共 Y 页：标题」，让读屏用户与看屏幕的老师同步得到页码与进度。
    const announceSlide = () => {
      const idx = Math.min(ui.projectorIndex, slides.length - 1);
      const current = slides[idx];
      if (!current) return;
      const text = `第 ${idx + 1} 页，共 ${slides.length} 页：${current.title}${ui.projectorReveal ? '（已揭晓答案）' : ''}`;
      let region = document.getElementById('sr-announcer');
      if (!region) {
        region = document.createElement('div');
        region.id = 'sr-announcer';
        region.className = 'sr-only';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        document.body.appendChild(region);
      }
      region.textContent = text;
    };
    if (previous) previous.onclick = () => { ui.projectorIndex = Math.max(0, ui.projectorIndex - 1); ui.projectorReveal = false; render(); restoreFocus('prev-slide', 'next-slide'); announceSlide(); };
    if (next) next.onclick = () => { ui.projectorIndex = Math.min(slides.length - 1, ui.projectorIndex + 1); ui.projectorReveal = false; render(); restoreFocus('next-slide', 'prev-slide'); announceSlide(); };
    if (reveal) reveal.onclick = () => { ui.projectorReveal = true; render(); restoreFocus('next-slide', 'prev-slide'); announceSlide(); };
  }

  function render() {
    clearInterval(ui.examTimer);
    const [page, a, b] = current();
    let html;
    if (page === 'home') html = homePage();
    else if (page === 'level') html = levelPage(a, b);
    else if (page === 'problem') html = problemPage(a);
    else if (page === 'exams') html = examsPage();
    else if (page === 'exam') html = examPage(a);
    else if (page === 'report') html = reportPage(a);
    else if (page === 'wrongbook') html = wrongBookPage();
    else if (page === 'plan') html = planPage();
    else if (page === 'wiki') html = wikiPage();
    else if (page === 'article') html = articlePage(a);
    else if (page === 'profile') html = profilePage();
    else if (page === 'classroom') html = classroomPage(a);
    else html = notFound();
    app.innerHTML = html;
    window.scrollTo(0, 0);
    bindGlobal();
    if (page === 'level') bindLevel(a, b);
    if (page === 'problem') bindProblem(a);
    if (page === 'exam') bindExam(a);
    if (page === 'wrongbook') bindWrongBook();
    if (page === 'plan') bindPlan();
    if (page === 'wiki') bindWiki();
    if (page === 'article') bindArticle(a);
    if (page === 'profile') bindProfile();
    if (page === 'classroom') bindClassroom(a);
  }

  window.addEventListener('hashchange', () => { ui.projectorIndex = 0; ui.projectorReveal = false; render(); });
  render();
})();
