/**
 * 3D 客廳擺位 — Three.js (CDN via importmap)
 * Persist: furniture-design-lite-3d-v1
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const STORAGE_KEY = "furniture-design-lite-3d-v1";
const ROOM = { w: 6, d: 5, h: 2.7 };

const CATALOG = [
  { id: "sofa", name: "沙發", emoji: "🛋️", color: 0xc4a484, size: [2.0, 0.7, 0.85] },
  { id: "table", name: "餐桌", emoji: "🍽️", color: 0xa88b6a, size: [1.2, 0.72, 0.8] },
  { id: "bed", name: "床", emoji: "🛏️", color: 0x8fa3b8, size: [1.6, 0.5, 2.0] },
  { id: "cabinet", name: "櫃", emoji: "🗄️", color: 0x9a8b7a, size: [0.9, 1.5, 0.4] },
  { id: "tv", name: "電視櫃", emoji: "📺", color: 0x6e7f8d, size: [1.4, 0.45, 0.4] },
];

const $ = (s) => document.querySelector(s);
const hud = $("#room3dHud");
const stage = $("#room3dStage");
const canvas = $("#room3dCanvas");
const paletteEl = $("#room3dPalette");

function setHud(msg, cls = "ok") {
  if (!hud) return;
  hud.textContent = msg;
  hud.className = "room3d-hud " + cls;
}

if (!canvas || !stage) {
  console.warn("[room3d] canvas missing");
} else {
  boot().catch((err) => {
    console.error(err);
    setHud("3D 載入失敗：請檢查網絡／允許 jsDelivr CDN。可繼續用相片同平面擺位。", "err");
  });
}

async function boot() {
  setHud("建立 3D 客廳中…");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x1a222c, 1);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a222c, 10, 22);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(4.2, 3.2, 5.2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.15;
  controls.target.set(0, 0.9, 0);
  controls.update();

  // Lights
  scene.add(new THREE.AmbientLight(0xfff5e8, 0.55));
  const sun = new THREE.DirectionalLight(0xfff0dd, 1.05);
  sun.position.set(3.5, 5.5, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 20;
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb8d0ff, 0.35);
  fill.position.set(-4, 3, -2);
  scene.add(fill);

  // Room shell
  const roomRoot = new THREE.Group();
  scene.add(roomRoot);
  buildRoom(roomRoot);

  // Invisible floor for raycast
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd9c7a8, roughness: 0.85, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = "floor";
  roomRoot.add(floor);

  const furnitureRoot = new THREE.Group();
  roomRoot.add(furnitureRoot);

  /** @type {{uid:string,id:string,x:number,z:number,rot:number,mesh:THREE.Object3D}[]} */
  let items = [];
  let selected = null;
  let dragging = false;
  let pendingType = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function uid() {
    return "3d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function catalog(id) {
    return CATALOG.find((c) => c.id === id) || CATALOG[0];
  }

  function makeFurniture(typeId) {
    const def = catalog(typeId);
    const g = new THREE.Group();
    g.userData.furnitureId = def.id;
    g.userData.name = def.name;

    const [sx, sy, sz] = def.size;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7, metalness: 0.08 })
    );
    body.position.y = sy / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // Accent piece for TV / table / sofa
    if (def.id === "tv") {
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(sx * 0.85, 0.55, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x222830, roughness: 0.4 })
      );
      screen.position.set(0, sy + 0.35, -sz * 0.1);
      screen.castShadow = true;
      g.add(screen);
    } else if (def.id === "sofa") {
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(sx, sy * 0.7, sz * 0.28),
        new THREE.MeshStandardMaterial({ color: def.color * 0.9 || def.color, roughness: 0.75 })
      );
      back.position.set(0, sy * 0.85, -sz * 0.35);
      back.castShadow = true;
      g.add(back);
    } else if (def.id === "bed") {
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(sx * 0.7, 0.12, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 })
      );
      pillow.position.set(0, sy + 0.06, -sz * 0.35);
      g.add(pillow);
    }

    // Selection ring (hidden by default)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(sx, sz) * 0.55, Math.max(sx, sz) * 0.62, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    ring.name = "selRing";
    g.add(ring);

    return g;
  }

  function clampPos(x, z, typeId) {
    const def = catalog(typeId);
    const hx = def.size[0] / 2 + 0.15;
    const hz = def.size[2] / 2 + 0.15;
    return {
      x: Math.max(-ROOM.w / 2 + hx, Math.min(ROOM.w / 2 - hx, x)),
      z: Math.max(-ROOM.d / 2 + hz, Math.min(ROOM.d / 2 - hz, z)),
    };
  }

  function selectItem(item) {
    if (selected && selected.mesh) {
      const prev = selected.mesh.getObjectByName("selRing");
      if (prev) prev.visible = false;
    }
    selected = item;
    if (item && item.mesh) {
      const ring = item.mesh.getObjectByName("selRing");
      if (ring) ring.visible = true;
      setHud(`已選：${item.mesh.userData.name || item.id} · 拖地板搬位 · 可旋轉／刪除`);
    } else {
      setHud("撳下方傢俬加入 · 單指轉視角 · 雙指縮放");
    }
  }

  function spawn(typeId, x = 0, z = 0, rot = 0, id = null) {
    const mesh = makeFurniture(typeId);
    const p = clampPos(x, z, typeId);
    mesh.position.set(p.x, 0, p.z);
    mesh.rotation.y = rot;
    furnitureRoot.add(mesh);
    const item = { uid: id || uid(), id: typeId, x: p.x, z: p.z, rot, mesh };
    items.push(item);
    selectItem(item);
    save();
    return item;
  }

  function removeSelected() {
    if (!selected) return;
    furnitureRoot.remove(selected.mesh);
    items = items.filter((i) => i.uid !== selected.uid);
    selected = null;
    setHud("已刪除 · 可再加入傢俬");
    save();
  }

  function rotateSelected() {
    if (!selected) return;
    selected.rot = (selected.rot + Math.PI / 2) % (Math.PI * 2);
    selected.mesh.rotation.y = selected.rot;
    save();
    setHud(`已旋轉：${selected.mesh.userData.name}`);
  }

  function clearAll() {
    items.forEach((i) => furnitureRoot.remove(i.mesh));
    items = [];
    selected = null;
    save();
    setHud("已清空");
  }

  function resetDemo() {
    clearAll();
    spawn("sofa", -1.2, 1.2, Math.PI);
    spawn("tv", 0, -2.0, 0);
    spawn("table", 1.3, 0.2, 0);
    setHud("已重置示範擺位");
  }

  function save() {
    const payload = items.map((i) => ({
      uid: i.uid,
      id: i.id,
      x: i.mesh.position.x,
      z: i.mesh.position.z,
      rot: i.mesh.rotation.y,
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) { /* ignore */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) return false;
      arr.forEach((row) => {
        if (!row || !row.id) return;
        spawn(row.id, row.x || 0, row.z || 0, row.rot || 0, row.uid);
      });
      selectItem(null);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Palette UI
  if (paletteEl) {
    paletteEl.innerHTML = "";
    CATALOG.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-item";
      btn.dataset.id = f.id;
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `<span class="ico" style="background:#${f.color.toString(16).padStart(6, "0")}33">${f.emoji}</span><span class="label">${f.name}</span>`;
      btn.addEventListener("click", () => {
        pendingType = f.id;
        [...paletteEl.querySelectorAll(".palette-item")].forEach((b) =>
          b.classList.toggle("selected", b.dataset.id === f.id)
        );
        const item = spawn(f.id, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.2, 0);
        setHud(`已加入${f.name} · 拖佢搬位`);
        // brief highlight already via select
        void item;
      });
      paletteEl.appendChild(btn);
    });
  }

  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  };
  bind("room3dRotateBtn", rotateSelected);
  bind("room3dDeleteBtn", removeSelected);
  bind("room3dResetBtn", resetDemo);
  bind("room3dClearBtn", clearAll);

  function ndcFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick(ev) {
    ndcFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);
    const meshes = items.map((i) => i.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.furnitureId && obj.parent) obj = obj.parent;
      const item = items.find((i) => i.mesh === obj);
      if (item) {
        selectItem(item);
        return item;
      }
    }
    return null;
  }

  function floorPoint(ev) {
    ndcFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(floor);
    if (!hits.length) return null;
    return hits[0].point;
  }

  let pointerDownAt = null;
  let moved = false;

  canvas.addEventListener("pointerdown", (ev) => {
    pointerDownAt = { x: ev.clientX, y: ev.clientY, t: Date.now() };
    moved = false;
    const item = pick(ev);
    if (item) {
      dragging = true;
      controls.enabled = false;
      canvas.setPointerCapture?.(ev.pointerId);
    }
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (pointerDownAt) {
      const dx = ev.clientX - pointerDownAt.x;
      const dy = ev.clientY - pointerDownAt.y;
      if (dx * dx + dy * dy > 16) moved = true;
    }
    if (!dragging || !selected) return;
    const pt = floorPoint(ev);
    if (!pt) return;
    const p = clampPos(pt.x, pt.z, selected.id);
    selected.mesh.position.x = p.x;
    selected.mesh.position.z = p.z;
    selected.x = p.x;
    selected.z = p.z;
  });

  function endDrag(ev) {
    if (dragging) {
      dragging = false;
      controls.enabled = true;
      save();
      try { canvas.releasePointerCapture?.(ev.pointerId); } catch (_) {}
    }
    // Double-tap delete (quick second tap on same selected)
    if (pointerDownAt && !moved && Date.now() - pointerDownAt.t < 280) {
      // single tap already selected via pick
    }
    pointerDownAt = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.addEventListener("dblclick", (ev) => {
    const item = pick(ev);
    if (item) {
      selectItem(item);
      removeSelected();
    }
  });

  function resize() {
    const w = stage.clientWidth || 320;
    const h = stage.clientHeight || 240;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener("resize", resize);

  let running = false;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function setActive(on) {
    running = on;
    if (on) {
      resize();
      animate();
      setHud(items.length ? "拖傢俬搬位 · 單指轉視角" : "撳下方傢俬加入 · 單指轉視角 · 雙指縮放");
    }
  }

  window.addEventListener("fdl:view", (e) => {
    setActive(e.detail && e.detail.view === "room3d");
  });

  // If already on 3D tab (rare), or prepare
  const view3d = $("#view-room3d");
  if (view3d && !view3d.hidden) setActive(true);

  if (!load()) {
    resetDemo();
  } else {
    setHud("已載入上次 3D 擺位");
  }

  // Expose for debug
  window.__fdl3d = { spawn, clearAll, resetDemo, items };
  setHud("3D 就緒 · 撳傢俬加入 · 拖搬位 · 雙撃刪除");
  console.info("[room3d] ready");
}

function buildRoom(root) {
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf2ebe0,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.BackSide,
  });
  // Use inward-facing box shell without floor (floor separate)
  const hw = ROOM.w / 2;
  const hd = ROOM.d / 2;
  const hh = ROOM.h / 2;

  function wall(w, h, x, y, z, rotY = 0) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: 0xf2ebe0, roughness: 0.92, metalness: 0.02 })
    );
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }

  // Back (+z? we use -z as window wall)
  wall(ROOM.w, ROOM.h, 0, hh, -hd); // facing +z by default... Plane faces +z
  // Actually PlaneGeometry faces +Z. For back wall at -z, rotate 0 means facing camera from -z looking +z — good for inside.
  // Left wall at -x: rotate +90°
  wall(ROOM.d, ROOM.h, -hw, hh, 0, Math.PI / 2);
  // Right wall at +x
  wall(ROOM.d, ROOM.h, hw, hh, 0, -Math.PI / 2);
  // Front wall (door) at +z — facing -z
  wall(ROOM.w, ROOM.h, 0, hh, hd, Math.PI);

  // Ceiling
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    new THREE.MeshStandardMaterial({ color: 0xfaf7f2, roughness: 1 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = ROOM.h;
  root.add(ceil);

  // Window bright panel on back wall
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xb8d4f0,
      emissive: 0x88aacc,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    })
  );
  win.position.set(0.8, 1.5, -hd + 0.02);
  root.add(win);

  // Window frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.35, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.7 })
  );
  frame.position.set(0.8, 1.5, -hd + 0.04);
  root.add(frame);
  // punch "glass" by overlaying again smaller — already have win in front
  win.position.z = -hd + 0.05;

  // Door opening darker cut on front wall (visual only)
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x3a322c, roughness: 0.8 })
  );
  door.position.set(-1.6, 1.05, hd - 0.02);
  door.rotation.y = Math.PI;
  root.add(door);

  // Baseboard lines
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xddd0c0, roughness: 0.8 });
  [[0, -hd + 0.03, 0], [0, hd - 0.03, Math.PI]].forEach(([z, zz, ry]) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w, 0.08, 0.04), trimMat);
    t.position.set(0, 0.04, zz);
    t.rotation.y = ry;
    root.add(t);
  });

  void wallMat;
}
