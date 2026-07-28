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

  try {
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await waitFor("document.readyState === 'complete' && document.querySelector('.lesson-layout')");

    await setViewport(1440, 1100, false);
    const desktop = await evaluate(`(() => {
      const layout=document.querySelector('.lesson-layout').getBoundingClientRect();
      const main=document.querySelector('.lesson-main').getBoundingClientRect();
      const aside=document.querySelector('.lesson-layout aside').getBoundingClientRect();
      return {
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        layoutWidth: Math.round(layout.width),
        mainWidth: Math.round(main.width),
        asideWidth: Math.round(aside.width),
        conceptColumns: getComputedStyle(document.querySelector('.concept-grid')).gridTemplateColumns.split(' ').length
      };
    })()`);
    assert.equal(desktop.scrollWidth, desktop.viewport, '桌面端不应出现横向溢出');
    assert.ok(desktop.layoutWidth >= 1320, `桌面课程总宽不足：${desktop.layoutWidth}`);
    assert.ok(desktop.mainWidth >= 1100, `桌面正文仍过窄：${desktop.mainWidth}`);
    assert.ok(desktop.asideWidth <= 180, `左侧目录占位过宽：${desktop.asideWidth}`);
    assert.equal(desktop.conceptColumns, 3, '宽屏核心内容应为三栏');
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
    const mobile = await evaluate(`(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      asideDisplay: getComputedStyle(document.querySelector('.lesson-layout aside')).display,
      conceptColumns: getComputedStyle(document.querySelector('.concept-grid')).gridTemplateColumns.split(' ').length
    }))()`);
    assert.equal(mobile.viewport, 390, '手机视口必须是真实 390px');
    assert.equal(mobile.scrollWidth, mobile.viewport, '手机端不应出现横向溢出');
    assert.equal(mobile.asideDisplay, 'none', '手机端应隐藏左侧目录');
    assert.equal(mobile.conceptColumns, 1, '手机端核心内容应回到单栏');
    await screenshot('layout-mobile-e2e.png');

    console.log(JSON.stringify({ desktop, notesOpen, mobile }, null, 2));
  } finally {
    await client.close();
    await fetch(`${cdpBase}/json/close/${target.id}`).catch(() => {});
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
