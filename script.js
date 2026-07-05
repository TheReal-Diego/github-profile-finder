// ===============================
// Ambient contribution grid
// ===============================

const gridBg = document.getElementById("grid-bg");

const cols = Math.ceil(window.innerWidth / 18);
const rows = Math.ceil(window.innerHeight / 18);
const total = Math.min(cols * rows, 900);

const squares = [];

for (let i = 0; i < total; i++) {
  const sq = document.createElement("div");
  sq.className = "sq";
  gridBg.appendChild(sq);
  squares.push(sq);
}

const shades = [
  "rgba(57,255,136,.06)",
  "rgba(57,255,136,.14)",
  "rgba(57,255,136,.28)",
  "rgba(57,255,136,.45)",
];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function litUp() {
  if (!squares.length) return;

  const n = Math.floor(squares.length * 0.03);

  for (let i = 0; i < n; i++) {
    const sq = squares[Math.floor(Math.random() * squares.length)];

    const shade = shades[Math.floor(Math.random() * shades.length)];

    sq.style.transition = "background 1.8s ease";
    sq.style.background = shade;

    setTimeout(() => {
      sq.style.background = "var(--surface-2)";
    }, 2200);
  }
}

if (!reduced) {
  setInterval(litUp, 350);
  litUp();
}

// ===============================
// Search Logic
// ===============================

const form = document.getElementById("searchForm");
const input = document.getElementById("username");
const goBtn = document.getElementById("goBtn");

const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.user;

    form.requestSubmit();
  });
});

function setStatus(kind, text) {
  statusEl.className = "status show " + (kind || "");

  if (kind === "load") {
    statusEl.innerHTML = '<span class="spinner"></span>' + text;
  } else {
    statusEl.innerHTML = text;
  }
}

function clearStatus() {
  statusEl.className = "status";
  statusEl.innerHTML = "";
}

function fmt(n) {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }

  return n.toString();
}

function esc(str) {
  const div = document.createElement("div");

  div.textContent = str || "";

  return div.innerHTML;
}

// ===============================
// GitHub API Request
// ===============================

async function lookup(username) {
  resultEl.classList.remove("show");
  resultEl.innerHTML = "";
  setStatus("load", "resolving " + username + " …");
  goBtn.disabled = true;

  try {
    const res = await fetch(
      "https://api.github.com/users/" + encodeURIComponent(username),
    );
    if (res.status === 404) {
      setStatus("err", 'error: user "' + esc(username) + '" not found (404)');
      goBtn.disabled = false;
      return;
    }
    if (res.status === 403) {
      setStatus("err", "error: rate limit hit — try again in a minute");
      goBtn.disabled = false;
      return;
    }
    if (!res.ok) {
      setStatus("err", "error: request failed (" + res.status + ")");
      goBtn.disabled = false;
      return;
    }
    const data = await res.json();
    clearStatus();
    renderProfile(data);
  } catch (err) {
    setStatus("err", "error: network request failed");
  } finally {
    goBtn.disabled = false;
  }
}

function renderProfile(u) {
  const joined = new Date(u.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  resultEl.innerHTML = `
      <div class="profile-card">
        <div class="diff-strip"></div>
        <div class="profile-top">
          <div class="avatar-wrap">
            <img src="${u.avatar_url}" alt="${esc(u.login)} avatar" />
            <div class="pulse"></div>
          </div>
          <div class="profile-info">
            <div class="name-row">
              <h2>${esc(u.name || u.login)}</h2>
              <span class="login">@${esc(u.login)}</span>
            </div>
            <p class="bio">${u.bio ? esc(u.bio) : "No bio provided."}</p>
            <div class="meta-row">
              ${u.location ? `<span>📍 ${esc(u.location)}</span>` : ""}
              ${u.company ? `<span>🏢 ${esc(u.company)}</span>` : ""}
              <span>🗓 joined ${joined}</span>
            </div>
            <a class="profile-link" href="${u.html_url}" target="_blank" rel="noopener noreferrer">view on github.com ↗</a>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-cell repos">
            <div class="stat-label">Repositories</div>
            <div class="stat-value">${fmt(u.public_repos)}</div>
            <div class="bar-track"><div class="bar-fill" data-target="${Math.min(100, u.public_repos)}"></div></div>
          </div>
          <div class="stat-cell followers">
            <div class="stat-label">Followers</div>
            <div class="stat-value">${fmt(u.followers)}</div>
            <div class="bar-track"><div class="bar-fill" data-target="${Math.min(100, u.followers)}"></div></div>
          </div>
          <div class="stat-cell following">
            <div class="stat-label">Following</div>
            <div class="stat-value">${fmt(u.following)}</div>
            <div class="bar-track"><div class="bar-fill" data-target="${Math.min(100, u.following)}"></div></div>
          </div>
        </div>
      </div>
    `;
  requestAnimationFrame(() => {
    resultEl.classList.add("show");
    resultEl.querySelectorAll(".bar-fill").forEach((bar) => {
      const t = parseFloat(bar.dataset.target) || 0;
      setTimeout(() => {
        bar.style.width = Math.max(t, 4) + "%";
      }, 150);
    });
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) {
    setStatus("err", "error: enter a username first");
    return;
  }
  lookup(val);
});
