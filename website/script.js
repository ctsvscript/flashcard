(function () {
  const tabsEl = document.getElementById("tabs");
  const tabsLoading = document.getElementById("tabsLoading");
  const stageEl = document.getElementById("stage");
  const emptyStateEl = document.getElementById("emptyState");

  const deckNameEl = document.getElementById("deckName");
  const deckProgressEl = document.getElementById("deckProgress");

  const cardEl = document.getElementById("card");
  const cardInnerEl = document.getElementById("cardInner");
  const qTextEl = document.getElementById("qText");
  const qImgEl = document.getElementById("qImg");
  const frontTagEl = document.getElementById("frontTag");
  const aTextEl = document.getElementById("aText");
  const eTextEl = document.getElementById("eText");
  const levelDotsEl = document.getElementById("levelDots");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const restartBtn = document.getElementById("restartBtn");

  let currentSubject = null;
  let originalDeck = [];
  let deck = [];
  let index = 0;
  let flipped = false;

  function apiUrl(params) {
    const base = CONFIG.APPS_SCRIPT_URL;
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return base + query;
  }

  function showError(msg) {
    tabsLoading.hidden = false;
    tabsLoading.textContent = msg;
    stageEl.hidden = true;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function loadSubjects() {
    try {
      const res = await fetch(apiUrl());
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      renderTabs(data.subjects || []);
    } catch (err) {
      showError(
        "Không tải được danh sách chủ đề. Kiểm tra lại APPS_SCRIPT_URL trong config.js."
      );
      console.error(err);
    }
  }

  function renderTabs(subjects) {
    tabsLoading.hidden = true;
    tabsEl.innerHTML = "";
    if (!subjects.length) {
      showError("Chưa có sheet (chủ đề) nào trong file Google Sheet.");
      return;
    }
    subjects.forEach((name, i) => {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.textContent = name;
      btn.setAttribute("role", "tab");
      btn.addEventListener("click", () => selectSubject(name, btn));
      tabsEl.appendChild(btn);
      if (i === 0) selectSubject(name, btn);
    });
  }

  async function selectSubject(name, btnEl) {
    [...tabsEl.children].forEach((b) => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    currentSubject = name;
    stageEl.hidden = true;
    emptyStateEl.hidden = true;

    try {
      const res = await fetch(apiUrl({ subject: name }));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      originalDeck = data.cards || [];
      if (!originalDeck.length) {
        emptyStateEl.hidden = false;
        emptyStateEl.textContent = `Sheet "${name}" chưa có câu hỏi nào.`;
        return;
      }
      deck = shuffle(originalDeck);
      index = 0;
      flipped = false;
      stageEl.hidden = false;
      renderCard();
    } catch (err) {
      emptyStateEl.hidden = false;
      emptyStateEl.textContent = "Không tải được dữ liệu cho chủ đề này.";
      console.error(err);
    }
  }

  function renderCard() {
    const card = deck[index];
    if (!card) return;

    cardEl.classList.remove("flipped");
    flipped = false;

    deckNameEl.textContent = currentSubject;
    deckProgressEl.textContent = `${index + 1} / ${deck.length}`;

    qTextEl.textContent = card["Câu hỏi"] || "";
    frontTagEl.textContent = card["Tag"] || "";

    const imgVal = (card["Ảnh"] || "").toString().trim();
    if (imgVal) {
      qImgEl.src = CONFIG.GITHUB_RAW_BASE.replace(/\/$/, "") + "/" + imgVal.replace(/^\//, "");
      qImgEl.hidden = false;
    } else {
      qImgEl.hidden = true;
      qImgEl.removeAttribute("src");
    }

    aTextEl.textContent = card["Đáp án"] || "";
    eTextEl.textContent = card["Giải thích"] || "";

    const level = parseInt(card["Mức độ"], 10) || 0;
    levelDotsEl.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement("span");
      if (i <= level) dot.classList.add("on");
      levelDotsEl.appendChild(dot);
    }

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === deck.length - 1;
  }

  function flip() {
    flipped = !flipped;
    cardEl.classList.toggle("flipped", flipped);
  }

  function goNext() {
    if (index < deck.length - 1) {
      index++;
      renderCard();
    }
  }

  function goPrev() {
    if (index > 0) {
      index--;
      renderCard();
    }
  }

  cardEl.addEventListener("click", flip);
  cardEl.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flip();
    }
  });

  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);

  shuffleBtn.addEventListener("click", () => {
    deck = shuffle(originalDeck);
    index = 0;
    renderCard();
  });

  restartBtn.addEventListener("click", () => {
    deck = shuffle(originalDeck);
    index = 0;
    renderCard();
  });

  document.addEventListener("keydown", (e) => {
    if (stageEl.hidden) return;
    if (e.target.tagName === "BUTTON") return;
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });

  loadSubjects();
})();
