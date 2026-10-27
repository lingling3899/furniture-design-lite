(() => {
  "use strict";

  const CACHE = "20261027a";
  const STORAGE_KEY = "furniture-design-lite-floor-v1";

  const FURNITURE = [
    { id: "sofa", name: "沙發", emoji: "🛋️", color: "#c4a484" },
    { id: "table", name: "餐桌", emoji: "🍽️", color: "#a88b6a" },
    { id: "bed", name: "床", emoji: "🛏️", color: "#8fa3b8" },
    { id: "cabinet", name: "櫃", emoji: "🗄️", color: "#9a8b7a" },
    { id: "tv", name: "電視櫃", emoji: "📺", color: "#6e7f8d" },
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
  };

  // ——— DOM ———
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const views = {
    photo: $("#view-photo"),
    floor: $("#view-floor"),
    about: $("#view-about"),
  };

  // Photo
  const photoInput = $("#photoInput");
  const uploadZone = $("#uploadZone");
  const styleRow = $("#styleRow");
  const comparePanel = $("#comparePanel");
  const beforeImg = $("#beforeImg");
  const afterCanvas = $("#afterCanvas");
  const placementLabels = $("#placementLabels");
  const photoActions = $("#photoActions");
  const aiHelpBox = $("#aiHelpBox");
  const beforeTag = $("#beforeTag");
  const afterTag = $("#afterTag");

  // Floor
  const palette = $("#furniturePalette");
  const floorRoom = $("#floorRoom");

  let currentStyle = "modern";
  let sourceImage = null; // HTMLImageElement
  let sourceObjectUrl = null;

  // ——— Tabs ———
  $$(".nav-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      $$(".nav-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
      Object.entries(views).forEach(([key, el]) => {
        const on = key === view;
        el.hidden = !on;
        el.classList.toggle("active", on);
      });
    });
  });

  // ——— Photo upload ———
  function setHasPhoto(has) {
    styleRow.hidden = !has;
    comparePanel.hidden = !has;
    photoActions.hidden = !has;
    $("#uploadPrompt").hidden = has;
  }

  function revokeUrl() {
    if (sourceObjectUrl) {
      URL.revokeObjectURL(sourceObjectUrl);
      sourceObjectUrl = null;
    }
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    revokeUrl();
    sourceObjectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      beforeImg.src = sourceObjectUrl;
      setHasPhoto(true);
      renderSuggestion();
    };
    img.onerror = () => {
      alert("相片讀取失敗，請再試另一張。");
    };
    img.src = sourceObjectUrl;
  }

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    loadFile(file);
  });

  ["dragenter", "dragover"].forEach((ev) => {
    uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
    });
  });
  uploadZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(file);
  });

  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      currentStyle = chip.dataset.style;
      $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      if (sourceImage) renderSuggestion();
    });
  });

  $("#regenBtn").addEventListener("click", () => {
    if (sourceImage) renderSuggestion();
  });

  $("#aiHelpBtn").addEventListener("click", () => {
    aiHelpBox.hidden = !aiHelpBox.hidden;
  });

  $("#clearPhotoBtn").addEventListener("click", () => {
    revokeUrl();
    sourceImage = null;
    beforeImg.removeAttribute("src");
    const ctx = afterCanvas.getContext("2d");
    ctx && ctx.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
    placementLabels.innerHTML = "";
    photoInput.value = "";
    aiHelpBox.hidden = true;
    setHasPhoto(false);
  });

  function renderSuggestion() {
    if (!sourceImage) return;
    const preset = STYLE_PRESETS[currentStyle] || STYLE_PRESETS.modern;
    const maxW = 900;
    const scale = Math.min(1, maxW / sourceImage.naturalWidth);
    const w = Math.round(sourceImage.naturalWidth * scale);
    const h = Math.round(sourceImage.naturalHeight * scale);
    afterCanvas.width = w;
    afterCanvas.height = h;
    const ctx = afterCanvas.getContext("2d");

    // Base photo with style filter
    ctx.save();
    ctx.filter = preset.filter;
    ctx.drawImage(sourceImage, 0, 0, w, h);
    ctx.restore();

    // Warm/cool tint overlay
    ctx.fillStyle = preset.tint;
    ctx.fillRect(0, 0, w, h);

    // Soft vignette for "polished render" feel
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(30,24,18,0.22)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floor strip suggestion (bottom third light wash)
    ctx.fillStyle = "rgba(232, 214, 180, 0.18)";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    // Furniture icon overlays (simple geometric + emoji)
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
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    icons.forEach((ic) => {
      const size = Math.max(22, w * ic.s);
      // soft plate behind emoji
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.ellipse(w * ic.x, h * ic.y, size * 0.7, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText(ic.emoji, w * ic.x, h * ic.y);
    });

    // Style caption bar
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    roundRect(ctx, 12, 12, Math.min(w - 24, 280), 36, 18);
    ctx.fill();
    ctx.fillStyle = "#6e5238";
    ctx.font = `600 ${Math.max(12, Math.round(w * 0.022))}px "PingFang HK", "Noto Sans TC", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`🎨 ${preset.name} · ${preset.floorHint}`, 24, 30);

    // Floating placement labels (DOM, responsive %)
    placementLabels.innerHTML = "";
    preset.placements.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.label;
      li.style.left = `${p.x}%`;
      li.style.top = `${p.y}%`;
      placementLabels.appendChild(li);
    });

    beforeTag.textContent = "客廳";
    afterTag.textContent = "客廳 · " + preset.name;
  }

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

  // ——— Floor plan ———
  let floorItems = []; // { uid, id, name, emoji, x, y }  x/y percent 0-100
  let dragState = null;

  function uid() {
    return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function saveFloor() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(floorItems));
    } catch (_) { /* ignore quota */ }
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

  function renderPalette() {
    palette.innerHTML = "";
    FURNITURE.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-item";
      btn.dataset.id = f.id;
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `<span class="ico" style="background:${f.color}33">${f.emoji}</span><span class="label">${f.name}</span>`;
      // Pointer-based drag from palette → room
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startPaletteDrag(e, f);
      });
      palette.appendChild(btn);
    });
  }

  function renderFloorItems() {
    $$(".floor-item", floorRoom).forEach((el) => el.remove());
    floorItems.forEach((item) => {
      const el = document.createElement("div");
      el.className = "floor-item";
      el.dataset.uid = item.uid;
      el.style.left = `calc(${item.x}% - 32px)`;
      el.style.top = `calc(${item.y}% - 28px)`;
      el.innerHTML = `<span class="emoji">${item.emoji}</span><span>${item.name}</span>`;
      el.title = "拖動搬位 · 雙撃刪除";
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startItemDrag(e, item.uid);
      });
      el.addEventListener("dblclick", () => {
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
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }
  }

  function startItemDrag(e, itemUid) {
    const item = floorItems.find((x) => x.uid === itemUid);
    if (!item) return;
    const el = floorRoom.querySelector(`[data-uid="${itemUid}"]`);
    if (el) el.classList.add("dragging");
    dragState = { uid: itemUid };
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
      dragState = null;
      saveFloor();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  $("#resetFloorBtn").addEventListener("click", () => {
    // Default demo layout
    floorItems = [
      { uid: uid(), id: "sofa", name: "沙發", emoji: "🛋️", x: 30, y: 65 },
      { uid: uid(), id: "table", name: "餐桌", emoji: "🍽️", x: 55, y: 45 },
      { uid: uid(), id: "tv", name: "電視櫃", emoji: "📺", x: 75, y: 30 },
    ];
    saveFloor();
    renderFloorItems();
  });

  $("#clearFloorBtn").addEventListener("click", () => {
    floorItems = [];
    saveFloor();
    renderFloorItems();
  });

  // Init
  renderPalette();
  loadFloor();
  if (!floorItems.length) {
    floorItems = [
      { uid: uid(), id: "sofa", name: "沙發", emoji: "🛋️", x: 28, y: 62 },
      { uid: uid(), id: "tv", name: "電視櫃", emoji: "📺", x: 72, y: 32 },
    ];
  }
  renderFloorItems();

  console.info(`[furniture-design-lite] ready v=${CACHE}`);
})();
