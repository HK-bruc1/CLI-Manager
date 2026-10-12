import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, preview, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';

const fixture = resolve('scripts/fixtures');
const modalPath = resolve('src/features/settings/api/SettingsModal.tsx');
const playwrightPath = process.env.SETTINGS_TEST_PLAYWRIGHT ?? join(homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');

// 只替换业务页及桌面服务；设置外壳、布局、焦点陷阱、i18n 和 Mantine 均执行生产代码。
function isolatedSettings() {
  const modules = new Map();
  const virtual = (name, code) => { const id = `\0settings-escape:${name}`; modules.set(id, code); return id; };
  return {
    name: 'isolated-settings-escape',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return;
      const path = resolve(dirname(importer), source);
      // Windows 路径和 Vite 模块 ID 必须统一，否则夹具与生产 i18n 会加载两份 store。
      if ([resolve('src/shared/preferences/settingsStore'), join(fixture, 'settingsEscapeStore')]
        .some(storePath => path.toLowerCase() === storePath.toLowerCase())) {
        return normalizePath(join(fixture, 'settingsEscapeStore.ts'));
      }
      if (resolve(importer).toLowerCase() !== modalPath.toLowerCase()) return;
      const page = source.match(/\/pages\/(\w+)$/)?.[1];
      if (page === 'CcConnectSettingsPage') return normalizePath(join(fixture, 'settingsEscapePage.tsx'));
      const empty = page ?? ({ '../index': 'HookSettingsPage', '../../extensions': 'GlobalExtensionsPage' })[source];
      if (empty) return virtual(empty, `export function ${empty}() { return null; }`);
      if (source.endsWith('/mcpSaving')) return virtual('mcp',
        'const requestLeave = callback => callback(); export const useMcpSaveWorkflow = () => ({ requestLeave, dialog: null });');
      if (source.endsWith('/WorkspaceBackground')) return virtual('background',
        'export const useWorkspaceBackground = () => ({ active: false });');
      if (source.endsWith('/systemFonts')) return virtual('font',
        'export const normalizeFontFamilyStack = font => font;');
      if (source.endsWith('/MantineThemeProvider')) return virtual('theme',
        `import { createElement } from 'react'; import { MantineProvider } from '@mantine/core';
         export const AppMantineThemeProvider = ({ children }) => createElement(MantineProvider,
           { forceColorScheme: new URLSearchParams(location.search).get('theme') ?? 'light' }, children);`);
    },
    load(id) { return modules.get(id); },
  };
}

test('settings Escape ownership and shell focus outlines in Chromium', { timeout: 300000 }, async t => {
  const { chromium } = await import(pathToFileURL(playwrightPath).href);
  const output = await mkdtemp(join(tmpdir(), 'cli-settings-escape-'));
  let server; let browser;
  t.after(async () => {
    await browser?.close();
    await new Promise(done => server ? server.httpServer.close(done) : done());
    await rm(output, { recursive: true, force: true });
  });
  await build({ configFile: false, plugins: [isolatedSettings(), react()], logLevel: 'error',
    build: { outDir: output, emptyOutDir: false, rollupOptions: { input: join(fixture, 'settingsEscape.html') } } });
  server = await preview({ configFile: false, build: { outDir: output },
    preview: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  browser = await chromium.launch({ channel: process.env.SETTINGS_TEST_BROWSER ?? 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = `${server.resolvedUrls.local[0]}scripts/fixtures/settingsEscape.html`;
  const settings = page.locator('.ui-workspace-settings-dialog');
  const openSettings = async () => { await page.locator('#open-settings').click(); await settings.waitFor(); };

  await t.test('Escape does not draw an empty workspace outline; Tab still marks buttons', async () => {
    await page.goto(url);
    const main = page.locator('#main-content');
    await main.click({ position: { x: 500, y: 500 } });
    await page.keyboard.press('Escape');
    assert.equal(await main.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    assert.equal(await main.evaluate(el => document.activeElement === el), true, 'skip-link focus target remains focusable');
    await page.locator('#open-settings').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#keyboard-button').evaluate(el => el.matches(':focus-visible')), true);
    assert.notEqual(await page.locator('#keyboard-button').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  });

  await t.test('hidden keepMounted drawers do not block closing, across language and theme', async () => {
    for (const theme of ['light', 'dark']) for (const language of ['zh-CN', 'en-US']) {
      await page.goto(`${url}?theme=${theme}`);
      await page.evaluate(language => window.escapeTest.language(language), language);
      await openSettings();
      assert.equal(await page.locator('[role="dialog"]').count(), 3, 'both closed drawers stay mounted');
      assert.equal(await settings.getAttribute('aria-label'), language === 'zh-CN' ? '设置窗口' : 'Settings');
      await settings.click({ position: { x: 600, y: 700 } });
      await page.keyboard.press('Escape');
      await settings.waitFor({ state: 'detached', timeout: 2000 });
    }
  });

  await t.test('visible drawer/modal owns one Escape, including zero-duration synchronous close', async () => {
    for (const duration of [200, 0]) for (const layer of ['web-device', 'cc-connect', 'inner-modal']) {
      await page.goto(`${url}?duration=${duration}`);
      await openSettings();
      await page.locator(`#open-${layer}`).click();
      const child = page.locator('[role="dialog"]').filter({ has: page.locator('input[aria-label]') }).filter({ visible: true });
      await child.waitFor();
      await child.locator('input').focus();
      await page.keyboard.press('Escape');
      await child.waitFor({ state: 'hidden' });
      assert.equal(await settings.isVisible(), true, 'child Escape must not also close settings');
      await page.keyboard.press('Escape');
      await settings.waitFor({ state: 'detached', timeout: 2000 });
    }
  });

  await t.test('consumed Escape and IME composition keep settings open without a shell outline', async () => {
    await page.goto(url);
    await openSettings();
    await page.locator('#consuming-input').focus();
    await page.keyboard.press('Escape');
    assert.equal(await settings.isVisible(), true);
    await settings.evaluate(el => {
      el.focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }));
    });
    assert.equal(await settings.isVisible(), true);
    assert.equal(await settings.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  });

  await t.test('visible alertdialog blocks settings; a hidden ancestor or visibility releases it', async () => {
    for (const hiding of ['display', 'visibility']) {
      await page.goto(url);
      await openSettings();
      await page.evaluate(() => {
        const host = document.createElement('div');
        host.id = 'alert-host';
        host.innerHTML = '<div role="alertdialog">Confirmation</div>';
        document.body.append(host);
      });
      await settings.focus();
      await page.keyboard.press('Escape');
      assert.equal(await settings.isVisible(), true);
      await page.evaluate(hiding => {
        const host = document.getElementById('alert-host');
        if (hiding === 'display') host.style.display = 'none';
        else host.style.visibility = 'hidden';
      }, hiding);
      await page.keyboard.press('Escape');
      await settings.waitFor({ state: 'detached', timeout: 2000 });
    }
  });
  assert.deepEqual(errors, []);
});
