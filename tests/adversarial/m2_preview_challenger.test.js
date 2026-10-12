/**
 * tests/adversarial/m2_preview_challenger.test.js
 * Empirical Challenger Verification Suite for Milestone 2:
 * Browser Presentation & Web Integration (Static Hosting, Viewport, Responsive CSS, Adapters)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

describe('Milestone 2 Empirical Challenger: Browser Presentation & Web Integration', () => {

  // =========================================================================
  // 1. Static Hosting & Path Integrity (Zero Root-Relative Paths)
  // =========================================================================
  describe('1. Static Hosting & Relative Path Compliance', () => {

    it('1.1: index.html must not contain root-relative URLs (/...) in href or src', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      // Check href="/..." and src="/..."
      const rootRelativeHref = htmlContent.match(/href=["']\/[^"']*["']/g);
      const rootRelativeSrc = htmlContent.match(/src=["']\/[^"']*["']/g);

      assert.strictEqual(
        rootRelativeHref,
        null,
        `index.html must NOT contain root-relative href: ${JSON.stringify(rootRelativeHref)}`
      );
      assert.strictEqual(
        rootRelativeSrc,
        null,
        `index.html must NOT contain root-relative src: ${JSON.stringify(rootRelativeSrc)}`
      );
    });

    it('1.2: All linked assets in index.html must resolve to existing files on disk', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      // Extract all relative href/src links
      const relativeLinks = [];
      const linkRegex = /(?:href|src)=["'](\.[^"']+)["']/g;
      let match;
      while ((match = linkRegex.exec(htmlContent)) !== null) {
        relativeLinks.push(match[1]);
      }

      assert.ok(relativeLinks.length > 0, 'index.html should have relative links (style.css, main.js, icon)');

      for (const relLink of relativeLinks) {
        const resolvedPath = path.resolve(PROJECT_ROOT, relLink);
        assert.ok(
          fs.existsSync(resolvedPath),
          `Asset referenced in index.html "${relLink}" resolved to "${resolvedPath}" which must exist on disk`
        );
      }
    });

    it('1.3: style.css must not contain root-relative url(/...) or external absolute dependencies', () => {
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      assert.ok(fs.existsSync(cssPath), 'style.css must exist');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      const rootRelativeUrl = cssContent.match(/url\(\s*["']?\/[^"')]+["']?\s*\)/g);
      assert.strictEqual(
        rootRelativeUrl,
        null,
        `style.css must NOT contain root-relative url(/...): ${JSON.stringify(rootRelativeUrl)}`
      );
    });

    it('1.4: All JavaScript ES module imports in main.js and src/ must use relative paths and resolve', () => {
      const filesToScan = [path.join(PROJECT_ROOT, 'main.js')];

      // Scan all js files in src
      const scanDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            filesToScan.push(fullPath);
          }
        }
      };
      scanDir(path.join(PROJECT_ROOT, 'src'));

      const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?|export\s+(?:[\w*\s{},]*\s+from\s+)?)["']([^"']+)["']/g;

      for (const filePath of filesToScan) {
        const content = fs.readFileSync(filePath, 'utf8');
        let impMatch;
        while ((impMatch = importRegex.exec(content)) !== null) {
          const importTarget = impMatch[1];
          assert.ok(
            !importTarget.startsWith('/'),
            `File ${path.relative(PROJECT_ROOT, filePath)} has root-relative import "${importTarget}"`
          );
          assert.ok(
            importTarget.startsWith('./') || importTarget.startsWith('../'),
            `File ${path.relative(PROJECT_ROOT, filePath)} has non-relative import "${importTarget}"`
          );

          // Resolve and check file existence
          const resolvedImport = path.resolve(path.dirname(filePath), importTarget);
          assert.ok(
            fs.existsSync(resolvedImport),
            `Import "${importTarget}" in ${path.relative(PROJECT_ROOT, filePath)} resolves to non-existent "${resolvedImport}"`
          );
        }
      }
    });

  });

  // =========================================================================
  // 2. Responsive Viewport & Touch Control Compliance
  // =========================================================================
  describe('2. Responsive Viewport & Mobile Layout Compliance', () => {

    it('2.1: index.html has comprehensive meta viewport tag with viewport-fit=cover', () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      const viewportMatch = htmlContent.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
      assert.ok(viewportMatch, 'Meta viewport tag must exist in index.html');

      const content = viewportMatch[1];
      assert.ok(content.includes('width=device-width'), 'Viewport must specify width=device-width');
      assert.ok(content.includes('initial-scale=1'), 'Viewport must specify initial-scale=1 (or 1.0)');
      assert.ok(content.includes('viewport-fit=cover'), 'Viewport must specify viewport-fit=cover for edge-to-edge mobile screens');
      assert.ok(content.includes('user-scalable=no'), 'Viewport must disable user scaling for runner action game');
    });

    it('2.2: style.css enforces 16:9 aspect ratio on canvas container', () => {
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      // Check aspect-ratio: 16 / 9 or 16/9
      const hasAspectRatio = /aspect-ratio:\s*16\s*\/\s*9/i.test(cssContent);
      assert.ok(hasAspectRatio, 'style.css must enforce aspect-ratio: 16 / 9 on canvas container');
    });

    it('2.3: style.css enforces touch-action: none on canvas to eliminate mobile gesture latency', () => {
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      // Check canvas { ... touch-action: none ... }
      const canvasBlockMatch = cssContent.match(/canvas\s*\{[^}]*touch-action:\s*none[^}]*\}/s);
      assert.ok(canvasBlockMatch, 'style.css must declare touch-action: none on canvas');
    });

    it('2.4: style.css includes responsive breakpoints for mobile screens (max-width: 640px)', () => {
      const cssPath = path.join(PROJECT_ROOT, 'style.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      const hasMobileBreakpoint = /@media\s*\(\s*max-width:\s*640px\s*\)/i.test(cssContent);
      assert.ok(hasMobileBreakpoint, 'style.css must include mobile breakpoint @media (max-width: 640px)');
    });

  });

  // =========================================================================
  // 3. DOM & UI Element Contract Verification
  // =========================================================================
  describe('3. DOM & UI Element Contract Integrity', () => {

    it('3.1: index.html contains all required HUD elements', () => {
      const htmlContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

      const requiredIds = [
        'game-canvas',
        'hud-timer',
        'hud-speed',
        'hud-score',
        'hud-high',
        'hud-lives'
      ];

      for (const id of requiredIds) {
        assert.ok(
          htmlContent.includes(`id="${id}"`),
          `index.html must contain element with id="${id}"`
        );
      }
    });

    it('3.2: index.html contains all required screen overlay views and buttons', () => {
      const htmlContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

      const requiredScreens = [
        'overlay-container',
        'screen-start',
        'screen-pause',
        'screen-gameover',
        'screen-victory'
      ];
      for (const screenId of requiredScreens) {
        assert.ok(
          htmlContent.includes(`id="${screenId}"`),
          `index.html must contain screen overlay with id="${screenId}"`
        );
      }

      const requiredButtons = [
        'btn-start',
        'btn-resume',
        'btn-pause-restart',
        'btn-restart',
        'btn-victory-restart',
        'sound-toggle'
      ];
      for (const btnId of requiredButtons) {
        assert.ok(
          htmlContent.includes(`id="${btnId}"`),
          `index.html must contain control button with id="${btnId}"`
        );
      }
    });

    it('3.3: index.html contains rank badges and summary statistics on victory screen', () => {
      const htmlContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

      const requiredVictoryIds = [
        'victory-rank',
        'victory-rank-title',
        'victory-score',
        'victory-best'
      ];
      for (const id of requiredVictoryIds) {
        assert.ok(
          htmlContent.includes(`id="${id}"`),
          `index.html victory screen must contain id="${id}"`
        );
      }
    });

  });

  // =========================================================================
  // 4. Browser Adapter Logic & Headless Verification
  // =========================================================================
  describe('4. Browser Adapters & Logic Verification', () => {

    it('4.1: UIRenderer.calculateVictoryRank grades scores deterministically across all tiers', async () => {
      const { calculateVictoryRank } = await import('../../src/browser/UIRenderer.js');

      assert.strictEqual(typeof calculateVictoryRank, 'function');

      // Rank S: >= 11000
      const rankS = calculateVictoryRank(11000);
      assert.strictEqual(rankS.rank, 'S');
      assert.strictEqual(rankS.title, 'CYBER LEGEND');
      assert.strictEqual(rankS.cssClass, 'rank-s');

      const rankSPlus = calculateVictoryRank(15000);
      assert.strictEqual(rankSPlus.rank, 'S');

      // Rank A: 9500 .. 10999
      const rankA = calculateVictoryRank(9500);
      assert.strictEqual(rankA.rank, 'A');
      assert.strictEqual(rankA.title, 'NEON MASTER');
      assert.strictEqual(rankA.cssClass, 'rank-a');

      // Rank B: 8500 .. 9499
      const rankB = calculateVictoryRank(8500);
      assert.strictEqual(rankB.rank, 'B');
      assert.strictEqual(rankB.title, 'GRID RUNNER');
      assert.strictEqual(rankB.cssClass, 'rank-b');

      // Rank C: < 8500
      const rankC = calculateVictoryRank(8499);
      assert.strictEqual(rankC.rank, 'C');
      assert.strictEqual(rankC.title, 'SURVIVOR');
      assert.strictEqual(rankC.cssClass, 'rank-c');

      const rankCZero = calculateVictoryRank(0);
      assert.strictEqual(rankCZero.rank, 'C');
    });

    it('4.2: BrowserGameLoop step() advances engine tick deterministically', async () => {
      const { BrowserGameLoop } = await import('../../src/browser/BrowserGameLoop.js');

      let tickCount = 0;
      let lastTickDt = 0;
      const mockEngine = {
        tick: (dt) => {
          tickCount++;
          lastTickDt = dt;
        },
        getSnapshot: () => ({ state: 'RUNNING' })
      };

      const loop = new BrowserGameLoop({
        engine: mockEngine,
        fixedDt: 1 / 60,
        maxAccumulator: 0.25
      });

      assert.strictEqual(loop.isRunning, false);

      // Perform a manual discrete step
      const snapshot = loop.step(1 / 60);
      assert.strictEqual(tickCount, 1);
      assert.strictEqual(lastTickDt, 1 / 60);
      assert.strictEqual(snapshot.state, 'RUNNING');

      // Verify stop() is safe when not running
      loop.stop();
      assert.strictEqual(loop.isRunning, false);
    });

    it('4.3: AudioAdapter handles mock/headless environment gracefully without crashing', async () => {
      const { AudioAdapter } = await import('../../src/browser/AudioAdapter.js');

      const mockEngine = {
        on: () => () => {}
      };

      const audio = new AudioAdapter(mockEngine, { volume: 0.5, muted: false });
      assert.strictEqual(audio.volume, 0.5);
      assert.strictEqual(audio.isMuted, false);

      // toggleMute(): sets muted to true, returns true
      const mutedState = audio.toggleMute();
      assert.strictEqual(mutedState, true);
      assert.strictEqual(audio.isMuted, true);

      // toggle(): toggles again, returns true (audio enabled)
      const audioEnabled = audio.toggle();
      assert.strictEqual(audioEnabled, true);
      assert.strictEqual(audio.isMuted, false);

      // Volume clamping
      audio.setVolume(1.5);
      assert.strictEqual(audio.volume, 1.0);
      audio.setVolume(-0.5);
      assert.strictEqual(audio.volume, 0.0);

      // Calling play methods in environment without window.AudioContext should not throw
      assert.doesNotThrow(() => {
        audio.playJump();
        audio.playHit();
        audio.playItemCollected();
        audio.playVictory();
        audio.playGameOver();
        audio.playPause();
        audio.playResume();
        audio.unlock();
        audio.destroy();
      });
    });

    it('4.4: InputAdapter instantiates and destroys cleanly in headless environment', async () => {
      const { InputAdapter } = await import('../../src/browser/InputAdapter.js');

      const mockEngine = {
        handleAction: () => {}
      };

      const adapter = new InputAdapter(mockEngine, null, { enableSwipeDuck: true });
      assert.strictEqual(adapter.isEnabled, true);

      // Disable/enable
      adapter.setEnabled(false);
      assert.strictEqual(adapter.isEnabled, false);
      adapter.setEnabled(true);
      assert.strictEqual(adapter.isEnabled, true);

      // Detach without error
      assert.doesNotThrow(() => {
        adapter.detach();
      });
    });

  });

});
