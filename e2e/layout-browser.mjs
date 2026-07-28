import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cdpBase = process.env.CDP_URL || 'http://127.0.0.1:9338';
const projectDir = process.env.PROJECT_DIR || process.cwd();
const pageUrl = process.env.PAGE_URL || `${pathToFileURL(path.join(projectDir, 'academy.html')).href}#/course-lesson/regular-l1-01`;
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function newTarget(url) {
  const response = await fetch(`${cdpBase}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`无法创建 Chrome 测试页：HTTP ${response.status}`);
  return response.json();
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chrome 调试连接超时')), 8000);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Chrome 调试连接失败')); }, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (!this.socket || this.socket.readyState >= 2) return;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 500);
      this.socket.addEventListener('close', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.close();
    });
  }
}

async function main() {
  const target = await newTarget(pageUrl);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  async function evaluate(expression) {
    const response = await client.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || '页面脚本执行失败');
    return response.result?.value;
  }

  async function waitFor(expression, timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await evaluate(expression)) return;
      await delay(80);
    }
    throw new Error(`等待页面状态超时：${expression}`);
  }

  async function setViewport(width, height, mobile) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile
    });
    await delay(250);
  }

  async function screenshot(name) {
    const image = await client.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    await writeFile(path.join(projectDir, name), Buffer.from(image.data, 'base64'));
  }

  async function goToCourseRoute(route) {
    await evaluate(`location.hash=${JSON.stringify(`#/${route}`)}`);
    await waitFor(
      `location.hash===${JSON.stringify(`#/${route}`)} && !!document.querySelector(${JSON.stringify(`[data-note-route="${route}"]`)})`
    );
    await delay(20);
  }

  async function inspectLayout() {
    return evaluate(`(() => {
      const layout=document.querySelector('.lesson-layout').getBoundingClientRect();
      const main=document.querySelector('.lesson-main').getBoundingClientRect();
      const aside=document.querySelector('.lesson-layout aside');
      const conceptGrids=[...document.querySelectorAll('.concept-grid')];
      return {
        route: document.querySelector('.lesson-main').dataset.noteRoute,
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        layoutWidth: Math.round(layout.width),
        mainWidth: Math.round(main.width),
        asideWidth: Math.round(aside.getBoundingClientRect().width),
        asideDisplay: getComputedStyle(aside).display,
        conceptColumns: conceptGrids.map(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
      };
    })()`);
  }

  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await waitFor("document.readyState === 'complete' && document.querySelector('.lesson-layout')");

    const routeGroups = await evaluate(`(() => ({
      regularAndGesp: window.COURSE_CATALOG.lessons.map(lesson => 'course-lesson/' + lesson.id),
      cspjFirstRound: window.CSPJ_LESSONS.map(lesson => 'lesson/' + lesson.id),
      cspjSecondRound: Object.keys(window.FINAL_LESSONS).map(id => 'final/' + id)
    }))()`);
    const routes = Object.values(routeGroups).flat();
    assert.equal(routeGroups.regularAndGesp.length, 146, '常规课与 GESP 应覆盖 146 节');
    assert.equal(routeGroups.cspjFirstRound.length, 8, 'CSP-J 第一轮应覆盖 8 个关卡');
    assert.equal(routeGroups.cspjSecondRound.length, 6, 'CSP-J 第二轮应覆盖 6 个专题');

    await setViewport(1440, 1100, false);
    const desktopResults = [];
    for (const route of routes) {
      await goToCourseRoute(route);
      const result = await inspectLayout();
      desktopResults.push(result);
      assert.ok(result.scrollWidth <= result.viewport, `${route} 桌面端出现横向溢出：${result.scrollWidth}/${result.viewport}`);
      assert.ok(result.layoutWidth >= 1320, `${route} 桌面课程总宽不足：${result.layoutWidth}`);
      assert.ok(result.mainWidth >= 1100, `${route} 桌面正文仍过窄：${result.mainWidth}`);
      assert.ok(result.asideWidth <= 180, `${route} 左侧目录占位过宽：${result.asideWidth}`);
      assert.ok(result.conceptColumns.every(columns => columns === 3), `${route} 宽屏核心内容未统一为三栏`);
    }
    const desktop = desktopResults[0];
    await goToCourseRoute(routeGroups.regularAndGesp[0]);
    await screenshot('layout-desktop-e2e.png');

    await evaluate("document.querySelector('.notes-header-btn').click()");
    await delay(300);
    const notesOpen = await evaluate(`(() => ({
      mainWidth: Math.round(document.querySelector('.lesson-main').getBoundingClientRect().width),
      asideDisplay: getComputedStyle(document.querySelector('.lesson-layout aside')).display
    }))()`);
    assert.ok(notesOpen.mainWidth >= 950, `打开笔记后正文仍过窄：${notesOpen.mainWidth}`);
    assert.equal(notesOpen.asideDisplay, 'none', '中等桌面打开笔记后应收起重复目录');

    await evaluate("document.querySelector('.notes-close').click()");
    await setViewport(390, 844, true);
    const mobileResults = [];
    for (const route of routes) {
      await goToCourseRoute(route);
      const result = await inspectLayout();
      mobileResults.push(result);
      assert.equal(result.viewport, 390, `${route} 手机视口必须是真实 390px`);
      assert.ok(result.scrollWidth <= result.viewport, `${route} 手机端出现横向溢出：${result.scrollWidth}/${result.viewport}`);
      assert.equal(result.asideDisplay, 'none', `${route} 手机端未隐藏左侧目录`);
      assert.ok(result.conceptColumns.every(columns => columns === 1), `${route} 手机端核心内容未回到单栏`);
    }
    const mobile = mobileResults[0];
    await goToCourseRoute(routeGroups.regularAndGesp[0]);
    await screenshot('layout-mobile-e2e.png');

    console.log(JSON.stringify({
      checkedRoutes: routes.length,
      routeGroups: Object.fromEntries(Object.entries(routeGroups).map(([key, value]) => [key, value.length])),
      desktop,
      notesOpen,
      mobile
    }, null, 2));
  } finally {
    await client.close();
    await fetch(`${cdpBase}/json/close/${target.id}`).catch(() => {});
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
