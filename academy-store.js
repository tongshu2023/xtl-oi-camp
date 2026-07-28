(function () {
  const KEY = 'xiaoturing-academy-v1';
  const DAY = 24 * 60 * 60 * 1000;
  const initial = {
    teacherMode: false,
    completedLessons: [],
    quizAttempts: [],
    bestScores: {},
    wrongQuestionIds: [],
    memory: {},
    plan: null,
    profile: { name: '小图灵同学', target: '通过 CSP-J 第一轮与第二轮' },
    activity: []
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Object.assign(clone(initial), saved, {
        profile: Object.assign({}, initial.profile, saved.profile || {}),
        bestScores: Object.assign({}, saved.bestScores || {}),
        memory: Object.assign({}, saved.memory || {})
      });
    } catch (_) { return clone(initial); }
  }

  let state = load();
  const listeners = [];
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => fn(state));
  }
  function update(patch) { state = Object.assign({}, state, patch); save(); }
  function rememberActivity(type, label) {
    state.activity = [{ type, label, at: Date.now() }, ...(state.activity || [])].slice(0, 30);
  }

  window.AcademyStore = {
    get: () => state,
    subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
    setTeacherMode(value) { update({ teacherMode: Boolean(value) }); },
    setProfile(patch) { update({ profile: Object.assign({}, state.profile, patch) }); },
    recordQuiz(lessonId, score, wrongIds) {
      const now = Date.now();
      const bestScores = Object.assign({}, state.bestScores, { [lessonId]: Math.max(score, state.bestScores[lessonId] || 0) });
      const completed = score >= 80 && !state.completedLessons.includes(lessonId)
        ? [...state.completedLessons, lessonId] : state.completedLessons;
      const wrong = new Set(state.wrongQuestionIds || []);
      const lesson = [
        ...(window.CSPJ_LESSONS || []),
        ...((window.COURSE_CATALOG && window.COURSE_CATALOG.lessons) || []),
        ...(window.FINAL_COURSE_LESSONS || [])
      ].find(x => x.id === lessonId);
      (lesson ? lesson.quiz : []).forEach(q => wrong.delete(q.id));
      wrongIds.forEach(id => wrong.add(id));
      rememberActivity('quiz', `${lessonId} 小测 ${score} 分`);
      update({
        completedLessons: completed,
        bestScores,
        wrongQuestionIds: [...wrong],
        quizAttempts: [{ lessonId, score, wrongIds, at: now }, ...(state.quizAttempts || [])].slice(0, 50),
        activity: state.activity
      });
    },
    reviewCard(cardId, rating) {
      const current = state.memory[cardId] || { stage: 0, reviews: 0, dueAt: Date.now() };
      let stage = current.stage || 0;
      if (rating === 'again') stage = 0;
      if (rating === 'hard') stage = Math.max(1, stage);
      if (rating === 'good') stage += 1;
      const intervals = [0, 1, 3, 7, 14, 30, 60, 120];
      const days = rating === 'again' ? 0 : rating === 'hard' ? 1 : intervals[Math.min(stage, intervals.length - 1)];
      state.memory = Object.assign({}, state.memory, {
        [cardId]: { stage, reviews: (current.reviews || 0) + 1, lastRating: rating, lastReviewedAt: Date.now(), dueAt: Date.now() + days * DAY }
      });
      rememberActivity('memory', `复习记忆卡 ${cardId}`);
      update({ memory: state.memory, activity: state.activity });
    },
    savePlan(plan) { rememberActivity('plan', '更新冲刺计划'); update({ plan, activity: state.activity }); },
    dueCards(cards) {
      const now = Date.now();
      return cards.filter(card => !state.memory[card.id] || state.memory[card.id].dueAt <= now);
    },
    reset() { state = clone(initial); save(); }
  };
})();
