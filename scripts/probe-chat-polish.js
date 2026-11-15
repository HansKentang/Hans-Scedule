/* Probe the ChickBot panel polish pass on the real PWA.
   Verifies: Ctrl/Cmd+K opens + focuses, Esc releases the composer without
   closing, composer autogrow, footer kbd chips, busy dot wiring, no console
   errors. Run with: NODE_PATH="C:/Users/ASUS/node_modules" node scripts/probe-chat-polish.js */
const puppeteer = require("puppeteer");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://127.0.0.1:8321/index.html?dev=true";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1280,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // The hub bounces anonymous visitors to landing.html; mark the tab as guest
  // so the probe reaches the actual app shell (and therefore the chat panel).
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem("haven-guest", "1"); } catch (e) {}
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 45000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));

  const out = {};

  // 1. Ctrl+K
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.evaluate(() => new Promise((r) => setTimeout(r, 450)));

  out.shortcut = await page.evaluate(() => {
    const p = document.getElementById("aiChatPanel");
    return {
      exists: !!p,
      open: !!p && !p.classList.contains("hidden") && p.classList.contains("open"),
      focused: document.activeElement && document.activeElement.id,
    };
  });

  // 2. kbd chips in footer hint
  out.kbd = await page.evaluate(() => {
    const k = document.querySelector("#aiChatPanel .ai-panel-footer-hint .ai-kbd");
    return k ? k.textContent.trim() : null;
  });

  // 3. Composer autogrow
  out.autogrow = await page.evaluate(async () => {
    const el = document.getElementById("aiChatInput");
    if (!el) return null;
    el.focus();
    const panel = document.getElementById("aiChatPanel");
    const before = el.getBoundingClientRect().height;
    const panelBefore = panel.getBoundingClientRect().height;
    el.value = "one\ntwo\nthree\nfour\nfive\nsix";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => r()));
    const after = el.getBoundingClientRect().height;
    const panelAfter = panel.getBoundingClientRect().height;
    return { before: Math.round(before), after: Math.round(after), panelBefore: Math.round(panelBefore), panelAfter: Math.round(panelAfter) };
  });

  // 4. Esc blurs, keeps the draft, panel stays open
  await page.keyboard.press("Escape");
  await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));
  out.escape = await page.evaluate(() => ({
    focused: document.activeElement ? document.activeElement.id || document.activeElement.tagName : null,
    draft: (document.getElementById("aiChatInput") || {}).value,
    stillOpen: !document.getElementById("aiChatPanel").classList.contains("hidden"),
  }));

  // 5. Busy state: dots phase, then the streaming-cursor phase
  out.busy = await page.evaluate(async () => {
    const list = document.getElementById("aiChatMessages");
    const panel = document.getElementById("aiChatPanel");
    const el = document.createElement("div");
    el.className = "ai-message ai-message-assistant";
    el.innerHTML = '<div class="ai-avatar"></div><div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
    list.appendChild(el);
    await new Promise((r) => setTimeout(r, 120));
    const badge = document.querySelector("#aiChatPanel .ai-live");
    const sub = document.querySelector("#aiChatPanel .ai-panel-subtitle");
    const res = {
      dotsAttr: panel.getAttribute("data-ai-busy"),
      badge: badge ? getComputedStyle(badge).display : null,
      badgeText: badge ? badge.textContent : null,
      subtitleHidden: sub ? getComputedStyle(sub).visibility : null,
      dotsFlaggedStreaming: list.querySelectorAll(".ai-bubble.is-streaming").length,
    };
    // shared.js swaps the dots for text + .ai-cursor in the same bubble
    el.querySelector(".ai-bubble").innerHTML = "Here is your day<span class=\"ai-cursor\"></span>";
    await new Promise((r) => setTimeout(r, 120));
    res.cursorAttr = panel.getAttribute("data-ai-busy");
    res.cursorFlaggedStreaming = list.querySelectorAll(".ai-bubble.is-streaming").length;
    el.remove();
    await new Promise((r) => setTimeout(r, 120));
    res.attrAfter = panel.getAttribute("data-ai-busy");
    return res;
  });

  // 6. Layout: user turns hug the right edge, assistant turns the left.
  //    Two rules (justify-content: flex-end + flex-direction: row-reverse) used
  //    to cancel out and left every message hard against the left edge.
  out.layout = await page.evaluate(() => {
    const list = document.getElementById("aiChatMessages");
    list.innerHTML =
      '<div class="ai-message ai-message-user"><div class="ai-bubble">hi</div></div>' +
      '<div class="ai-message ai-message-assistant"><div class="ai-avatar"></div><div class="ai-bubble">hello</div></div>';
    const rows = list.querySelectorAll(".ai-message");
    const measure = (row) => {
      const bubble = row.querySelector(".ai-bubble");
      const r = row.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      return { left: Math.round(b.left - r.left), right: Math.round(r.right - b.right) };
    };
    const user = measure(rows[0]);
    const bot = measure(rows[1]);
    list.innerHTML = "";
    return {
      userRightGap: user.right,
      userLeftGap: user.left,
      assistantLeftGap: bot.left,
      rightAligned: user.right === 0 && user.left > 0,
      leftAligned: bot.left > 0,
    };
  });

  // 7. Chrome: header folded into 3 buttons, quota reduced to one line
  out.chrome = await page.evaluate(() => {
    const header = document.querySelector("#aiChatPanel .ai-panel-header-actions");
    const visible = [...header.querySelectorAll("button")]
      .filter((b) => !b.closest(".ai-menu") && getComputedStyle(b).display !== "none").length;
    const bar = document.getElementById("aiTokenBar");
    const more = header.querySelector(".ai-more");
    if (more) more.click();
    const menuOpen = !!header.querySelector(".ai-menu.open");
    const items = [...header.querySelectorAll(".ai-menu-item")].map((b) => b.textContent);
    if (more) more.click();
    return {
      visibleHeaderButtons: visible,
      tokenBarHeight: Math.round(bar.getBoundingClientRect().height),
      menuOpens: menuOpen,
      menuItems: items,
    };
  });

  // 8. Brand: every bot avatar in the panel is the chick, not the old robot
  out.brand = await page.evaluate(() => {
    const panel = document.getElementById("aiChatPanel");
    const all = panel.querySelectorAll("svg");
    const chick = panel.querySelectorAll("svg[data-chick='1']");
    const header = panel.querySelector(".ai-panel-avatar svg");
    return {
      svgsInPanel: all.length,
      chickSvgs: chick.length,
      headerIsFilled: header ? header.getAttribute("fill") : null,
      headerPaths: header ? header.children.length : 0,
    };
  });

  // 9. Clear the draft so the probe leaves nothing behind
  await page.evaluate(() => {
    const el = document.getElementById("aiChatInput");
    if (el) { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); }
  });

  out.errors = errors.filter((e) => !/favicon|net::ERR_FILE|Failed to load resource/i.test(e));

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => { console.error("PROBE FAILED:", e.message); process.exit(1); });
