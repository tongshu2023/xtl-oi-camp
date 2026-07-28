import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadCatalog() {
  const browserWindow = {};
  browserWindow.window = browserWindow;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'course_catalog.js'), 'utf8'),
    { window: browserWindow },
    { filename: 'data/course_catalog.js' }
  );
  return browserWindow.COURSE_CATALOG;
}

test('课程总量固定为常规课 70 节、GESP 76 节', () => {
  const catalog = loadCatalog();
  assert.equal(catalog.courses.length, 12);
  assert.equal(catalog.lessons.filter(x => x.track === 'regular').length, 70);
  assert.equal(catalog.lessons.filter(x => x.track === 'gesp').length, 76);
  assert.equal(new Set(catalog.lessons.map(x => x.id)).size, 146);
});

test('146 节课全部达到可交付内容合同', () => {
  const catalog = loadCatalog();
  for (const lesson of catalog.lessons) {
    assert.ok(lesson.title);
    assert.ok(lesson.goal.length >= 20, lesson.id);
    assert.equal(lesson.schedule.length, 7, lesson.id);
    assert.equal(lesson.concepts.length, 3, lesson.id);
    assert.ok(lesson.example.statement, lesson.id);
    assert.ok(lesson.example.answer, lesson.id);
    assert.ok(lesson.example.code.includes('int main'), lesson.id);
    assert.equal(lesson.practices.length, 3, lesson.id);
    assert.ok(lesson.practices.every(x => x.task && x.answer), lesson.id);
    assert.equal(lesson.memory.length, 3, lesson.id);
    assert.equal(lesson.quiz.length, 4, lesson.id);
    assert.ok(lesson.quiz.every(x => x.answer >= 0 && x.answer < x.options.length), lesson.id);
    assert.equal(lesson.published, true, lesson.id);
  }
});

test('易混课程命中自己的知识模型而不是泛化模板', () => {
  const catalog = loadCatalog();
  const byId = id => catalog.lessons.find(lesson => lesson.id === id);
  assert.equal(byId('regular-l2-10').example.title, '打印乘法表');
  assert.equal(byId('regular-l4-12').example.title, '最低布线成本');
  assert.equal(byId('gesp-7-02').example.title, '网格最小路径和');
  assert.equal(byId('gesp-8-06').example.title, '非负权单源最短路');
  assert.match(byId('regular-l4-18').concepts[0][1], /阶段测评覆盖/);
  assert.ok(!catalog.lessons.some(lesson => lesson.example.title === '最小建模练习'));
});

test('GESP 2026 修订边界已落实', () => {
  const catalog = loadCatalog();
  const grade1 = catalog.courses.find(x => x.id === 'gesp-1');
  const grade3 = catalog.courses.find(x => x.id === 'gesp-3');
  const grade4 = catalog.courses.find(x => x.id === 'gesp-4');
  assert.ok(!grade1.lessons.some(x => x.title.includes('位运算')));
  assert.ok(grade3.lessons.some(x => x.title.includes('位运算')));
  assert.ok(!grade3.lessons.some(x => /函数定义|参数传递|作用域/.test(x.title)));
  assert.ok(grade4.lessons.some(x => x.title.includes('函数')));
});

test('公开课程站不再保留锁课与空菜单文案', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'academy-app.js'), 'utf8');
  assert.ok(app.includes("return index === 0 ? 'current' : 'open'"));
  assert.ok(!app.includes('先完成上一关'));
  assert.ok(!app.includes('查看课程大纲'));
  assert.ok(!app.includes('<button>查看'));
  assert.ok(app.includes('course-lesson'));
});

test('课内导航不改写单页路由，同页多测验各自记录答案', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'academy-app.js'), 'utf8');
  assert.ok(!app.includes('href="#lesson-map"'));
  assert.ok(!app.includes('href="#final-exercises"'));
  assert.ok(app.includes('data-scroll-target'));
  assert.ok(app.includes("el.closest('[data-quiz-lesson]')?.dataset.quizLesson"));
});

test('正式入口和 academy 入口加载同一套完整课程与笔记模块', () => {
  for (const filename of ['index.html', 'academy.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    const catalogAt = html.indexOf('data/course_catalog.js');
    const appAt = html.indexOf('academy-app.js');
    assert.ok(catalogAt > 0 && catalogAt < appAt, filename);
    assert.ok(html.includes('academy-notes-store.js'), filename);
    assert.ok(html.includes('academy-notes.js'), filename);
  }
});

test('CSP-J 第二轮 6 专题共 18 节均有讲义、完整例题和代码', () => {
  const browserWindow = {};
  browserWindow.window = browserWindow;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'final_lessons.js'), 'utf8').replace(/^\uFEFF/, ''),
    { window: browserWindow }
  );
  const lessons = Object.values(browserWindow.FINAL_LESSONS).flatMap(topic => topic.lessons);
  assert.equal(lessons.length, 18);
  for (const lesson of lessons) {
    assert.ok(lesson.goal && lesson.concepts.length >= 2, lesson.id);
    assert.ok(lesson.example.statement && lesson.example.steps.length >= 2, lesson.id);
    assert.ok(lesson.example.code.includes('int main'), lesson.id);
    assert.ok(!lesson.example.code.split('\n').some(line => line.startsWith('+')), lesson.id);
    assert.ok(lesson.traps.length >= 2, lesson.id);
  }
});

test('2015–2024 十套第一轮真题均有本地试卷文件', () => {
  const academy = fs.readFileSync(path.join(__dirname, '..', 'data', 'academy.js'), 'utf8');
  const paperPaths = [...academy.matchAll(/\d{4}:\s*'([^']+_exam\.pdf|[^']+_q\.pdf|[^']+hj_cpp\.pdf)'/g)]
    .map(match => match[1]);
  assert.equal(paperPaths.length, 10);
  for (const paperPath of paperPaths) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', paperPath)), paperPath);
  }
});
