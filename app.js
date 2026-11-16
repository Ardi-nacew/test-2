const STORE_KEY = "doozy.v1";

const TAGS = {
  work: "var(--sky)",
  home: "var(--peach)",
  health: "var(--butter)",
  fun: "var(--lilac)",
  errand: "var(--lime)",
};

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const CHEERS = [
  "Boom. One less thing.",
  "Look at you go.",
  "Crossed off. Feels good, right?",
  "Tiny win banked.",
  "That one's history.",
];

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function fromIso(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(d) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (c.getDay() + 6) % 7;
  return addDays(c, -offset);
}

const todayIso = () => iso(new Date());

function seed() {
  const t = new Date();
  const d = (n) => iso(addDays(t, n));
  const tasks = [
    ["Send the Q4 deck to Priya", "work", 3, d(0), false],
    ["Book a dentist appointment", "health", 2, d(0), false],
    ["Water the monstera (it's sulking)", "home", 1, d(0), false],
    ["Pick up oat milk + lemons", "errand", 1, d(0), false],
    ["30 min run along the canal", "health", 2, d(0), true],
    ["Reply to Sam about the cabin weekend", "fun", 1, d(0), true],
    ["Fix the leaky kitchen tap", "home", 2, d(-1), false],
    ["Review Jon's pull request", "work", 2, d(-1), true],
    ["Draft the newsletter intro", "work", 2, d(1), false],
    ["Return the library books", "errand", 1, d(1), false],
    ["Yoga class at 7", "health", 1, d(2), false],
    ["1:1 with Mara", "work", 2, d(2), false],
    ["Plan Saturday's dinner party", "fun", 2, d(3), false],
    ["Pay the electricity bill", "home", 3, d(3), false],
    ["Farmers market", "errand", 1, d(5), false],
    ["Learn three chords on the ukulele", "fun", 1, null, false],
    ["Repaint the hallway", "home", 3, null, false],
    ["Try that ramen place on 5th", "fun", 1, null, false],
  ];
  return {
    tasks: tasks.map(([title, tag, spice, date, done], i) => ({
      id: `t${i + 1}`,
      title,
      tag,
      spice,
      date,
      done,
    })),
    history: Object.fromEntries(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [d(-n), 2 + (n % 3)])
    ),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const s = seed();
  save(s);
  return s;
}

function save(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function streak(state) {
  const doneToday = state.tasks.some((t) => t.done && t.date === todayIso());
  let n = doneToday ? 1 : 0;
  let cursor = addDays(new Date(), -1);
  while (state.history[iso(cursor)]) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

function parseQuick(text) {
  let title = text;
  let tag = null;
  let spice = 1;
  let date = todayIso();
  let when = "today";

  const tagMatch = title.match(/#(\w+)/);
  if (tagMatch) {
    tag = tagMatch[1].toLowerCase();
    title = title.replace(tagMatch[0], "");
  }

  const bangs = title.match(/(^|\s)(!{1,3})(?=\s|$)/);
  if (bangs) {
    spice = bangs[2].length;
    title = title.replace(bangs[2], "");
  }

  const whenMatch = title.match(/\b(today|tomorrow|someday|mon|tue|wed|thu|fri|sat|sun)\b/i);
  if (whenMatch) {
    const w = whenMatch[1].toLowerCase();
    title = title.replace(whenMatch[0], "");
    when = w;
    if (w === "tomorrow") date = iso(addDays(new Date(), 1));
    else if (w === "someday") date = null;
    else if (w !== "today") {
      const target = DAY_NAMES.indexOf(w);
      const now = new Date();
      let diff = (target - now.getDay() + 7) % 7;
      date = iso(addDays(now, diff));
    }
  }

  return { title: title.replace(/\s+/g, " ").trim(), tag: tag || "home", tagGiven: !!tag, spice, date, when };
}

function tagChip(tag) {
  const color = TAGS[tag] || "var(--card)";
  return `<span class="tag" style="background:${color}">#${tag}</span>`;
}

function spiceDots(n) {
  return `<span class="spice" title="Effort">${"●".repeat(n)}<span style="opacity:.2">${"●".repeat(3 - n)}</span></span>`;
}

const CHECK_SVG =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-7" stroke="#1b1a17" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function confetti(x, y) {
  const layer = document.createElement("div");
  layer.className = "confetti";
  const colors = ["#ff5a36", "#c6f432", "#8ec5ff", "#c9b6ff", "#ffd66b"];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 110;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist + 60}px`);
    p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1000);
}

let toastTimer;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function cheer(evt) {
  const r = evt.currentTarget.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2);
  toast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
}

function setDateChip() {
  const chip = document.querySelector("[data-date-chip]");
  if (chip) {
    chip.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
}
