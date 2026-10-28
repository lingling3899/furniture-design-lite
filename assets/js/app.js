(() => {
  "use strict";

  const CACHE = "20261028a";
  const STORAGE_KEY = "furniture-design-lite-floor-v1";

  const FURNITURE = [
    { id: "sofa", name: "沙發", emoji: "🛋️", color: "#d4b896", group: "wood" },
    { id: "table", name: "餐桌", emoji: "🍽️", color: "#c9a87c", group: "wood" },
    { id: "coffee", name: "茶几", emoji: "🪵", color: "#d4b896", group: "wood" },
    { id: "bed", name: "床", emoji: "🛏️", color: "#e2d0b0", group: "wood" },
    { id: "cabinet", name: "櫃", emoji: "🗄️", color: "#d4b896", group: "wood" },
    { id: "tv", name: "電視櫃", emoji: "📺", color: "#c9a87c", group: "wood" },
    { id: "shelf", name: "層架", emoji: "📚", color: "#d4b896", group: "wood" },
    { id: "cattree", name: "貓爬架", emoji: "🐱", color: "#c9a87c", group: "cat" },
    { id: "catshelf", name: "牆上層架", emoji: "🪜", color: "#e2d0b0", group: "cat" },
    { id: "catcave", name: "貓洞櫃", emoji: "🏠", color: "#d4b896", group: "cat" },
    { id: "feed", name: "餵食站", emoji: "🥣", color: "#c9a87c", group: "cat" },
  ];

  const STYLE_PRESETS = {
    modern: {
      name: "現代簡約",
      filter: "contrast(1.08) saturate(0.85) brightness(1.05)",
      tint: "rgba(120,140,160,0.18)",
      floorHint: "淺灰木地板 · 簡潔線條",
      placements: [
        { label: "沙發區", x: 18, y: 58 },
        { label: "茶几", x: 42, y: 62 },
        { label: "電視牆", x: 68, y: 40 },
        { label: "收納櫃", x: 78, y: 72 },
      ],
    },
    nordic: {
      name: "北歐",
      filter: "contrast(1.02) saturate(0.78) brightness(1.12) sepia(0.12)",
      tint: "rgba(210,190,160,0.22)",
      floorHint: "淺木色 · 柔和布藝",
      placements: [
        { label: "布藝沙發", x: 22, y: 55 },
        { label: "圓形茶几", x: 48, y: 60 },
        { label: "綠植角", x: 12, y: 35 },
        { label: "開放層架", x: 75, y: 45 },
      ],
    },
    japanese: {
      name: "日式",
      filter: "contrast(1.05) saturate(0.7) brightness(1.08) sepia(0.18)",
      tint: "rgba(180,160,130,0.2)",
      floorHint: "榻榻米感 · 低矮傢俬",
      placements: [
        { label: "矮桌", x: 40, y: 55 },
        { label: "坐墊區", x: 25, y: 65 },
        { label: "和風櫃", x: 72, y: 50 },
        { label: "紙燈角", x: 15, y: 30 },
      ],
    },
    muji: {
      name: "無印淺木",
      filter: "contrast(1.04) saturate(0.82) brightness(1.14) sepia(0.14)",
      tint: "rgba(220,195,155,0.24)",
      floorHint: "淺橡木 · 暖白牆 · 明亮通透",
      placements: [
        { label: "淺木電視櫃", x: 70, y: 38 },
        { label: "開放層架", x: 18, y: 42 },
        { label: "布藝沙發", x: 28, y: 62 },
        { label: "茶几", x: 48, y: 58 },
      ],
    },
    cat: {
      name: "貓友善",
      filter: "contrast(1.03) saturate(0.88) brightness(1.1) sepia(0.1)",
      tint: "rgba(200,210,185,0.2)",
      floorHint: "淺木＋寵物友善整合",
      placements: [
        { label: "牆上層架", x: 78, y: 28 },
        { label: "貓爬架", x: 82, y: 58 },
        { label: "貓洞櫃", x: 16, y: 55 },
        { label: "餵食角", x: 22, y: 78 },
      ],
    },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => {
    if (el) el.addEventListener(ev, fn, opts);
  };

  const views = {
    photo: $("#view-photo"),
    floor: $("#view-floor"),
    room3d: $("#view-room3d"),
    about: $("#view-about"),
  };

  const photoInput = $("#photoInput");
  const photoInputReplace = $("#photoInputReplace");
  const photoPickBtn = $("#photoPickBtn");
  const uploadZone = $("#uploadZone");
  const uploadHero = $("#uploadHero");
  const immersiveCompare = $("#immersiveCompare");
  const beforeImg = $("#beforeImg");
  const afterCanvas = $("#afterCanvas");
  const placementLabels = $("#placementLabels");
  const aiHelpBox = $("#aiHelpBox");
  const beforeTag = $("#beforeTag");
  const afterTag = $("#afterTag");
  const beforeMeta = $("#beforeMeta");
  const palette = $("#furniturePalette");
  const floorRoom = $("#floorRoom");

  let currentStyle = "modern";
  let sourceImage = null;
  let sourceObjectUrl = null;
  let activeView = "photo";

  function syncImmersiveChrome() {
    const onImmersive =
      activeView === "photo" &&
      immersiveCompare &&
      !immersiveCompare.hidden;
    document.body.classList.toggle("mode-immersive", !!onImmersive);
  }

  function notifyViewChange(view) {
    try {
      window.dispatchEvent(new CustomEvent("fdl:view", { detail: { view } }));
    } catch (_) { /* ignore */ }
  }

  $$(".nav-tabs button").forEach((btn) => {
    on(btn, "click", () => {
      const view = btn.dataset.view;
      activeView = view;
      $$(".nav-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
      Object.entries(views).forEach(([key, el]) => {
        if (!el) return;
        const show = key === view;
        el.hidden = !show;
        el.classList.toggle("active", show);
      });
      syncImmersiveChrome();
      notifyViewChange(view);
    });
  });

  function setHasPhoto(has) {
    if (uploadHero) uploadHero.hidden = !!has;
    if (immersiveCompare) immersiveCompare.hidden = !has;
    syncImmersiveChrome();
    $$("#styleRow .style-card").forEach((c) => {
      c.disabled = false;
    });
  }

  function setStyleActive(style) {
    currentStyle = style;
    $$(".style-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.style === style);
    });
  }

  function revokeUrl() {
    if (sourceObjectUrl) {
      URL.revokeObjectURL(sourceObjectUrl);
      sourceObjectUrl = null;
    }
  }

  function openFilePicker(input) {
    if (!input) return;
    try {
      input.value = "";
      input.click();
    } catch (_) { /* ignore */ }
  }

  function loadFile(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      if (file) alert("請揀圖片檔（JPG／PNG）。");
      return;
    }
    revokeUrl();
    sourceObjectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      if (beforeImg) beforeImg.src = sourceObjectUrl;
      setHasPhoto(true);
      renderSuggestion();
    };
    img.onerror = () => {
      alert("相片讀取失敗，請再試另一張。");
    };
    img.src = sourceObjectUrl;
  }

  on(photoInput, "change", (e) => {
    const file = e.target.files && e.target.files[0];
    loadFile(file);
  });
  on(photoInputReplace, "change", (e) => {
    const file = e.target.files && e.target.files[0];
    loadFile(file);
  });
  on(photoPickBtn, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openFilePicker(photoInput);
  });

  if (uploadZone) {
    ["dragenter", "dragover"].forEach((ev) => {
      on(uploadZone, ev, (e) => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      on(uploadZone, ev, (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
      });
    });
    on(uploadZone, "drop", (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      loadFile(file);
    });
  }

  $$(".style-card").forEach((card) => {
    on(card, "click", () => {
      if (card.disabled) return;
      setStyleActive(card.dataset.style);
      if (sourceImage) renderSuggestion();
    });
  });

  on($("#regenBtn"), "click", () => {
    if (sourceImage) renderSuggestion();
  });
  on($("#aiHelpBtn"), "click", () => {
    if (aiHelpBox) aiHelpBox.hidden = !aiHelpBox.hidden;
  });
  on($("#clearPhotoBtn"), "click", () => {
    revokeUrl();
    sourceImage = null;
    if (beforeImg) beforeImg.removeAttribute("src");
    if (afterCanvas) {
      const ctx = afterCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
    }
    if (placementLabels) placementLabels.innerHTML = "";
    if (photoInput) photoInput.value = "";
    if (photoInputReplace) photoInputReplace.value = "";
    if (aiHelpBox) aiHelpBox.hidden = true;
    setHasPhoto(false);
  });

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function renderSuggestion() {
    if (!sourceImage || !afterCanvas) return;
    const preset = STYLE_PRESETS[currentStyle] || STYLE_PRESETS.modern;
    const maxW = 1200;
    const scale = Math.min(1, maxW / sourceImage.naturalWidth);
    const w = Math.round(sourceImage.naturalWidth * scale) || 800;
    const h = Math.round(sourceImage.naturalHeight * scale) || 600;
    afterCanvas.width = w;
    afterCanvas.height = h;
    const ctx = afterCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.filter = preset.filter;
    ctx.drawImage(sourceImage, 0, 0, w, h);
    ctx.restore();

    ctx.fillStyle = preset.tint;
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(
      w * 0.5, h * 0.45, h * 0.2,
      w * 0.5, h * 0.5, h * 0.85
    );
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(30,24,18,0.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(232, 214, 180, 0.2)";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    const icons = [
      { emoji: "🛋️", x: 0.2, y: 0.62, s: 0.09 },
      { emoji: "🪴", x: 0.12, y: 0.38, s: 0.06 },
      { emoji: "🖼️", x: 0.72, y: 0.28, s: 0.07 },
      { emoji: "💡", x: 0.5, y: 0.18, s: 0.05 },
    ];
    if (currentStyle === "japanese") {
      icons[0] = { emoji: "🪑", x: 0.38, y: 0.58, s: 0.08 };
      icons[1] = { emoji: "🎋", x: 0.15, y: 0.4, s: 0.06 };
    } else if (currentStyle === "nordic") {
      icons[0] = { emoji: "🛋️", x: 0.25, y: 0.58, s: 0.09 };
      icons[1] = { emoji: "🌿", x: 0.1, y: 0.42, s: 0.07 };
    } else if (currentStyle === "muji") {
      icons[0] = { emoji: "🛋️", x: 0.26, y: 0.6, s: 0.09 };
      icons[1] = { emoji: "📚", x: 0.14, y: 0.4, s: 0.06 };
      icons[2] = { emoji: "📺", x: 0.74, y: 0.36, s: 0.07 };
      icons[3] = { emoji: "🪵", x: 0.48, y: 0.55, s: 0.055 };
    } else if (currentStyle === "cat") {
      icons[0] = { emoji: "🐱", x: 0.78, y: 0.52, s: 0.08 };
      icons[1] = { emoji: "🪜", x: 0.82, y: 0.28, s: 0.06 };
      icons[2] = { emoji: "🏠", x: 0.16, y: 0.55, s: 0.07 };
      icons[3] = { emoji: "🥣", x: 0.22, y: 0.78, s: 0.055 };
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    icons.forEach((ic) => {
      const size = Math.max(22, w * ic.s);
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.ellipse(w * ic.x, h * ic.y, size * 0.7, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText(ic.emoji, w * ic.x, h * ic.y);
    });

    const cap = `${preset.name} · ${preset.floorHint}`;
    ctx.font = `600 ${Math.max(11, Math.round(w * 0.018))}px "PingFang HK", "Noto Sans TC", sans-serif`;
    const tw = ctx.measureText(cap).width;
    const pad = 10;
    const bx = 14;
    const by = h - 36;
    ctx.fillStyle = "rgba(12,10,8,0.55)";
    roundRect(ctx, bx, by, tw + pad * 2, 26, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(cap, bx + pad, by + 13);

    if (placementLabels) {
      placementLabels.innerHTML = "";
      preset.placements.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = p.label;
        li.style.left = `${p.x}%`;
        li.style.top = `${p.y}%`;
        placementLabels.appendChild(li);
      });
    }

    if (beforeTag) beforeTag.textContent = "客廳";
    if (afterTag) afterTag.textContent = "客廳";
    if (beforeMeta) beforeMeta.textContent = "客廳 · 原相";
  }

  // ——— Floor plan ———
  let floorItems = [];

  function uid() {
    return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function saveFloor() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(floorItems));
    } catch (_) { /* ignore */ }
  }

  function loadFloor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) floorItems = parsed;
    } catch (_) {
      floorItems = [];
    }
  }

  function appendPaletteItem(parent, f) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-item";
    btn.dataset.id = f.id;
    btn.setAttribute("role", "listitem");
    btn.innerHTML = `<span class="ico" style="background:${f.color}33">${f.emoji}</span><span class="label">${f.name}</span>`;
    on(btn, "pointerdown", (e) => {
      e.preventDefault();
      startPaletteDrag(e, f);
    });
    parent.appendChild(btn);
  }

  function renderPalette() {
    if (!palette) return;
    palette.innerHTML = "";
    const wood = FURNITURE.filter((f) => f.group === "wood");
    const cat = FURNITURE.filter((f) => f.group === "cat");

    function group(label, list) {
      const wrap = document.createElement("div");
      wrap.className = "palette-group";
      const title = document.createElement("div");
      title.className = "palette-group-label";
      title.textContent = label;
      wrap.appendChild(title);
      const row = document.createElement("div");
      row.className = "palette-group-row";
      list.forEach((f) => appendPaletteItem(row, f));
      wrap.appendChild(row);
      palette.appendChild(wrap);
    }

    group("淺木家俬", wood);
    group("貓／寵物", cat);
  }

  function renderFloorItems() {
    if (!floorRoom) return;
    $$(".floor-item", floorRoom).forEach((el) => el.remove());
    floorItems.forEach((item) => {
      const el = document.createElement("div");
      el.className = "floor-item";
      el.dataset.uid = item.uid;
      el.style.left = `calc(${item.x}% - 32px)`;
      el.style.top = `calc(${item.y}% - 28px)`;
      el.innerHTML = `<span class="emoji">${item.emoji}</span><span>${item.name}</span>`;
      el.title = "拖動搬位 · 雙撃刪除";
      on(el, "pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startItemDrag(e, item.uid);
      });
      on(el, "dblclick", () => {
        floorItems = floorItems.filter((x) => x.uid !== item.uid);
        saveFloor();
        renderFloorItems();
      });
      floorRoom.appendChild(el);
    });
  }

  function roomPointFromEvent(e) {
    const rect = floorRoom.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  }

  function startPaletteDrag(e, furn) {
    if (!floorRoom) return;
    const ghost = document.createElement("div");
    ghost.className = "floor-item dragging";
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.innerHTML = `<span class="emoji">${furn.emoji}</span><span>${furn.name}</span>`;
    document.body.appendChild(ghost);
    const move = (ev) => {
      ghost.style.left = `${ev.clientX - 32}px`;
      ghost.style.top = `${ev.clientY - 28}px`;
    };
    move(e);
    const up = (ev) => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      ghost.remove();
      const rect = floorRoom.getBoundingClientRect();
      if (
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom
      ) {
        const pt = roomPointFromEvent(ev);
        floorItems.push({
          uid: uid(),
          id: furn.id,
          name: furn.name,
          emoji: furn.emoji,
          x: pt.x,
          y: pt.y,
        });
        saveFloor();
        renderFloorItems();
      }
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  function startItemDrag(e, itemUid) {
    const item = floorItems.find((x) => x.uid === itemUid);
    if (!item || !floorRoom) return;
    const el = floorRoom.querySelector(`[data-uid="${itemUid}"]`);
    if (el) el.classList.add("dragging");
    const move = (ev) => {
      const pt = roomPointFromEvent(ev);
      item.x = pt.x;
      item.y = pt.y;
      if (el) {
        el.style.left = `calc(${item.x}% - 32px)`;
        el.style.top = `calc(${item.y}% - 28px)`;
      }
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      if (el) el.classList.remove("dragging");
      saveFloor();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  on($("#resetFloorBtn"), "click", () => {
    floorItems = [
      { uid: uid(), id: "sofa", name: "沙發", emoji: "🛋️", x: 30, y: 65 },
      { uid: uid(), id: "coffee", name: "茶几", emoji: "🪵", x: 48, y: 58 },
      { uid: uid(), id: "tv", name: "電視櫃", emoji: "📺", x: 75, y: 30 },
      { uid: uid(), id: "cattree", name: "貓爬架", emoji: "🐱", x: 82, y: 70 },
    ];
    saveFloor();
    renderFloorItems();
  });
  on($("#clearFloorBtn"), "click", () => {
    floorItems = [];
    saveFloor();
    renderFloorItems();
  });

  if (uploadHero) uploadHero.hidden = false;
  if (immersiveCompare) immersiveCompare.hidden = true;
  syncImmersiveChrome();

  renderPalette();
  loadFloor();
  if (!floorItems.length) {
    floorItems = [
      { uid: uid(), id: "sofa", name: "沙發", emoji: "🛋️", x: 28, y: 62 },
      { uid: uid(), id: "tv", name: "電視櫃", emoji: "📺", x: 72, y: 32 },
      { uid: uid(), id: "cattree", name: "貓爬架", emoji: "🐱", x: 82, y: 68 },
    ];
  }
  renderFloorItems();
  setStyleActive("modern");

  console.info(`[furniture-design-lite] ready v=${CACHE}`);
})();
