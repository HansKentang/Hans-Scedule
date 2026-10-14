const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8899;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('nf'); return;
      }
      const ext = path.extname(fp).toLowerCase();
      const buf = fs.readFileSync(fp);
      // gzip to mimic GitHub Pages
      const zlib = require('zlib');
      const accepts = req.headers['accept-encoding'] || '';
      if (accepts.includes('gzip') && buf.length > 1024) {
        const gz = zlib.gzipSync(buf);
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Content-Encoding': 'gzip',
          'Content-Length': gz.length,
          'Cache-Control': 'max-age=600'
        });
        res.end(gz);
      } else {
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': buf.length });
        res.end(buf);
      }
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const tmp = 'C:/Users/ASUS/AppData/Local/Temp/haven-perf-' + Date.now();

  const CANDIDATES = [
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
  ];
  const exe = CANDIDATES.find(p => fs.existsSync(p));
  if (!exe) { console.error('no browser found'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    userDataDir: tmp,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const pagesToTest = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const desktop = process.argv.includes('--desktop');
  const warm = process.argv.includes('--warm');
  const runsArg = process.argv.find(a => a.startsWith('--runs='));
  const RUNS = runsArg ? Math.max(1, parseInt(runsArg.split('=')[1], 10) || 1) : 1;
  const targets = pagesToTest.length ? pagesToTest : ['index.html', 'schedule.html', 'progress.html', 'goals.html', 'finance.html', 'gallery.html'];
  const remote = process.argv.includes('--remote');
  const BASE = remote ? 'https://hanskentang.github.io/Hans-Scedule' : `http://127.0.0.1:${PORT}`;
  const summary = [];

  for (let run = 0; run < RUNS; run++) {
  for (const target of targets) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    if (desktop) {
      await page.emulate({
        viewport: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
      });
    } else {
      await page.emulate({
        viewport: { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'
      });
    }

    const cloudSim = process.argv.includes('--cloud');
    await page.evaluateOnNewDocument((isCloud) => {
      try {
        if (isCloud) {
          localStorage.setItem('haven-gsi-accounts', JSON.stringify([
            { id: 'probecloud', name: 'Probe', authUid: '11111111-1111-1111-1111-111111111111', createdAt: Date.now() }
          ]));
          localStorage.setItem('haven-gsi-active', 'probecloud');
        } else {
          sessionStorage.setItem('haven-guest', '1');
          localStorage.setItem('haven-gsi-active', 'guest');
        }
      } catch (e) {}
    }, cloudSim);

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    const delayArg = process.argv.find(a => a.startsWith('--delay='));
    if (delayArg) {
      const spec = delayArg.split('=')[1];
      const [host, msRaw] = spec.split(':');
      const ms = parseInt(msRaw, 10) || 3000;
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.url().includes(host)) {
          setTimeout(() => req.continue().catch(() => {}), ms);
        } else {
          req.continue().catch(() => {});
        }
      });
      console.log('[probe] delaying ' + host + ' by ' + ms + 'ms');
    }

    const blockArg = process.argv.find(a => a.startsWith('--block='));
    if (blockArg) {
      const hosts = blockArg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const u = req.url();
        if (hosts.some(h => u.includes(h))) {
          errors.push('BLOCKED: ' + u.slice(0, 70));
          req.abort('failed').catch(() => {});
        } else {
          req.continue().catch(() => {});
        }
      });
      console.log('[probe] blocking hosts: ' + hosts.join(', '));
    }

    await client.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1 * 1024 * 1024) / 8
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const bytes = {};
    const timings = {};
    const errors = [];
    page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0, 200));
    });
    page.on('requestfailed', (r) => {
      errors.push('REQFAIL: ' + r.url().slice(-60) + ' ' + (r.failure() ? r.failure().errorText : ''));
    });
    page.on('response', async (r) => {
      try {
        const h = r.headers();
        const len = parseInt(h['content-length'] || '0', 10);
        const u = new URL(r.url());
        const key = u.origin === `http://127.0.0.1:${PORT}` ? u.pathname : 'EXTERNAL ' + u.host;
        bytes[key] = (bytes[key] || 0) + (len || 0);
      } catch (e) {}
    });

    const t0 = Date.now();
    try {
      await page.goto(`${BASE}/${target}?dev=true`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      console.log(target, 'goto failed', e.message);
      await page.close();
      continue;
    }
    timings.domContentLoaded = Date.now() - t0;

    // measure when the main visual content is actually present
    const visual = await page.evaluate(() => {
      return new Promise((resolve) => {
        const t0 = performance.now();
        let n = 0;
        const iv = setInterval(() => {
          n++;
          const b = document.querySelector('.bento-grid');
          const main = document.querySelector('.hub-main');
          const done = (b && b.children.length > 0) || (!b && main);
          if (done || n > 800) {
            clearInterval(iv);
            resolve({
              ready: !!done,
              waitedMs: Math.round(performance.now() - t0),
              bentoKids: b ? b.children.length : -1,
              bentoExists: !!b,
              mobileDisabled: document.documentElement.classList.contains('hub-mobile-disabled')
            });
          }
        }, 50);
      });
    });
    timings.visualReady = Date.now() - t0;
    timings.bentoKids = visual.bentoKids;
    timings.bentoWaited = visual.waitedMs;
    timings.bentoExists = visual.bentoExists;
    timings.mobileDisabled = visual.mobileDisabled;

    const perf = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource') || [];
      const paints = {};
      performance.getEntriesByType('paint').forEach(p => { paints[p.name] = Math.round(p.startTime); });
      let jsBytes = 0, cssBytes = 0, jsCount = 0;
      const slow = [];
      res.forEach(r => {
        const b = r.encodedBodySize || 0;
        if (/\.js(\?|$)/.test(r.name)) { jsBytes += b; jsCount++; }
        if (/\.css(\?|$)/.test(r.name)) cssBytes += b;
        slow.push({ n: r.name.split('/').pop(), d: Math.round(r.duration), b });
      });
      slow.sort((a, b) => b.d - a.d);
      return {
        fcp: paints['first-paint'] || 0,
        fp: paints['first-contentful-paint'] || 0,
        domInteractive: Math.round(n.domInteractive || 0),
        domContentLoaded: Math.round(n.domContentLoadedEventEnd || 0),
        loadEvent: Math.round(n.loadEventEnd || 0),
        transferKB: Math.round(res.reduce((a, r) => a + (r.encodedBodySize || 0), 0) / 1024),
        jsKB: Math.round(jsBytes / 1024),
        cssKB: Math.round(cssBytes / 1024),
        jsCount,
        top: slow.slice(0, 5)
      };
    });

    const totalKB = Math.round(Object.values(bytes).reduce((a, b) => a + b, 0) / 1024);
    console.log('\n===== ' + target + ' =====');
    console.log('final URL: ' + page.url());
    console.log('title:     ' + await page.title());
    console.log('DOMContentLoaded (wall): ' + timings.domContentLoaded + ' ms');
    console.log('visual ready (wall):     ' + timings.visualReady + ' ms');
    console.log('bento children:          ' + timings.bentoKids + (timings.bentoExists ? '' : ' (element absent)'));
    console.log('bento render wait:       ' + timings.bentoWaited + ' ms' + (timings.mobileDisabled ? '  [hub-mobile-disabled]' : ''));
    console.log('first paint:             ' + perf.fp + ' ms   (FCP ' + perf.fcp + ' ms)');
    console.log('nav timing: DCL=' + perf.domContentLoaded + 'ms load=' + perf.loadEvent + 'ms');
    console.log('transferred: ' + perf.transferKB + ' KB  (js ' + perf.jsKB + ' KB in ' + perf.jsCount + ' files, css ' + perf.cssKB + ' KB)');
    console.log('server-side bytes: ' + totalKB + ' KB');
    console.log('slowest resources:');
    perf.top.forEach(t => console.log('   ' + String(t.d).padStart(5) + 'ms  ' + String(t.b).padStart(7) + 'B  ' + t.n));

    const health = await page.evaluate(() => {
      const out = {};
      out.supabaseSdk = typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function';
      out.supabaseDb = (() => { try { return typeof getSupabaseDb === 'function' ? !!getSupabaseDb() : 'n/a'; } catch (e) { return 'ERR ' + e.message; } })();
      out.havenBoot = typeof havenBoot === 'function';
      out.readyState = document.readyState;
      out.hubCanvas = !!document.querySelector('.bento-grid');
      out.cloudNeeded = typeof CLOUD_NEEDED !== 'undefined' ? CLOUD_NEEDED : 'n/a';
      out.cloudHydrated = typeof CLOUD_HYDRATED !== 'undefined' ? CLOUD_HYDRATED : 'n/a';
      out.blockedOverlay = !!document.getElementById('cloudBlockedOverlay');
      return out;
    });
    console.log('health: supabaseSdk=' + health.supabaseSdk + ' db=' + health.supabaseDb + ' havenBoot=' + health.havenBoot +
      ' canvas=' + health.hubCanvas + ' cloudNeeded=' + health.cloudNeeded + ' hydrated=' + health.cloudHydrated +
      ' blockedOverlay=' + health.blockedOverlay);
    if (errors.length) {
      console.log('ERRORS (' + errors.length + '):');
      [...new Set(errors)].slice(0, 8).forEach(e => console.log('   ' + e));
    } else {
      console.log('errors: none');
    }

    summary.push({ target, fp: perf.fp, dcl: perf.domContentLoaded, bento: timings.bentoWaited, js: perf.jsKB, errs: errors.length });

    if (process.argv.includes('--shot')) {
      const dir = 'C:/Users/ASUS/AppData/Local/Temp/';
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('light') ? 'light' : 'dark'));
      const name = 'haven-' + target.replace('.html', '') + '-' + theme + '.png';
      await page.screenshot({ path: dir + name, fullPage: false });
      console.log('shot: ' + dir + name + '  (theme=' + theme + ')');
    }

    if (warm) {
      await new Promise(r => setTimeout(r, 1500));
      const swState = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return 'unsupported';
        const r = navigator.serviceWorker.getRegistration();
        const reg = await r;
        if (!reg) return 'none';
        if (reg.active) return 'active';
        return reg.installing ? 'installing' : 'waiting';
      });
      const w0 = Date.now();
      await page.goto(`${BASE}/${target}?dev=true&w=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const wDcl = Date.now() - w0;
      const wVis = await page.evaluate(() => new Promise((resolve) => {
        const t = performance.now();
        let n = 0;
        const iv = setInterval(() => {
          n++;
          const b = document.querySelector('.bento-grid');
          const main = document.querySelector('.hub-main');
          const done = (b && b.children.length > 0) || (!b && main);
          if (done || n > 800) { clearInterval(iv); resolve(Math.round(performance.now() - t)); }
        }, 50);
      }));
      const wPerf = await page.evaluate(() => {
        const res = performance.getEntriesByType('resource') || [];
        return {
          kb: Math.round(res.reduce((a, r) => a + (r.encodedBodySize || 0), 0) / 1024),
          n: res.length
        };
      });
      console.log('WARM repeat load  (sw=' + swState + '):');
      console.log('   DCL:            ' + wDcl + ' ms');
      console.log('   visual ready:   ' + wVis + ' ms');
      console.log('   transferred:    ' + wPerf.kb + ' KB in ' + wPerf.n + ' requests');
    }

    await page.close();
    await ctx.close();
  }
  }

  if (RUNS > 1) {
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    console.log('\n===== SUMMARY (median of ' + RUNS + ') =====');
    console.log('page             FCP      DCL    bento   jsKB  errs');
    const byPage = {};
    summary.forEach(s => { (byPage[s.target] = byPage[s.target] || []).push(s); });
    Object.keys(byPage).forEach((p) => {
      const rs = byPage[p];
      console.log(
        p.padEnd(16) +
        String(med(rs.map(r => r.fp))).padStart(6) +
        String(med(rs.map(r => r.dcl))).padStart(9) +
        String(med(rs.map(r => r.bento))).padStart(9) +
        String(med(rs.map(r => r.js))).padStart(7) +
        String(rs.reduce((a, r) => a + r.errs, 0)).padStart(6)
      );
    });
  }

  await browser.close();
  srv.close();
})().catch(e => { console.error('PROBE ERROR', e); process.exit(1); });
