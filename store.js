(function () {
  const KEY = 'cspj-camp-state-v1';
  const initial = {
    user: { name: 'CSP-J 训练生', motto: '今天比昨天多过一关' },
    teacherMode: false,
    completedLevels: [], levelProgress: {}, notes: {}, codeDrafts: {},
    articleFavorites: [], readArticles: [], examDrafts: {}, examRecords: [],
    wrongQuestionIds: [], quizRecords: [], plan: null
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Object.assign({}, initial, saved, { user: Object.assign({}, initial.user, saved.user || {}) });
    } catch (_) { return JSON.parse(JSON.stringify(initial)); }
  }

  let state = load();
  const listeners = [];
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => fn(state));
  }
  function update(patch) { state = Object.assign({}, state, typeof patch === 'function' ? patch(state) : patch); save(); return state; }
  function toggleList(key, value) {
    const list = new Set(state[key] || []);
    list.has(value) ? list.delete(value) : list.add(value);
    update({ [key]: [...list] });
    return list.has(value);
  }
  window.AppStore = {
    get: () => state,
    update,
    subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
    setTeacherMode(value) { update({ teacherMode: Boolean(value) }); },
    setUser(patch) { update({ user: Object.assign({}, state.user, patch || {}) }); },
    toggleArticleFavorite(id) { return toggleList('articleFavorites', id); },
    markArticleRead(id) { if (!state.readArticles.includes(id)) update({ readArticles: [...state.readArticles, id] }); },
    saveNote(levelId, value) { update({ notes: Object.assign({}, state.notes, { [levelId]: value }) }); },
    saveCodeDraft(problemId, value) { update({ codeDrafts: Object.assign({}, state.codeDrafts, { [problemId]: value }) }); },
    recordQuiz(levelId, record) {
      const passed = record.score >= 80;
      const completed = passed && !state.completedLevels.includes(levelId) ? [...state.completedLevels, levelId] : state.completedLevels;
      const wrong = new Set(state.wrongQuestionIds || []);
      record.questionIds.forEach(id => wrong.delete(id));
      record.wrongIds.forEach(id => wrong.add(id));
      update({
        completedLevels: completed,
        levelProgress: Object.assign({}, state.levelProgress, { [levelId]: { score: record.score, updatedAt: record.createdAt } }),
        wrongQuestionIds: [...wrong],
        quizRecords: [{ levelId, ...record }, ...state.quizRecords].slice(0, 50)
      });
    },
    saveExamDraft(id, draft) { update({ examDrafts: Object.assign({}, state.examDrafts, { [id]: draft }) }); },
    finishExam(record) {
      const drafts = Object.assign({}, state.examDrafts); delete drafts[record.examId];
      const wrong = new Set(state.wrongQuestionIds || []);
      record.questionIds.forEach(id => wrong.delete(id));
      record.wrongIds.forEach(id => wrong.add(id));
      update({ examDrafts: drafts, examRecords: [record, ...state.examRecords], wrongQuestionIds: [...wrong] });
    },
    savePlan(plan) { update({ plan }); },
    reset() { state = JSON.parse(JSON.stringify(initial)); save(); }
  };
})();
