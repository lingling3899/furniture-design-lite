/**
 * 3D 客廳擺位 — Three.js (CDN via importmap)
 * Persist: furniture-design-lite-3d-v2（淺木＋貓友善形狀）
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const STORAGE_KEY = "furniture-design-lite-3d-v2";
const LEGACY_KEY = "furniture-design-lite-3d-v1";
const ROOM = { w: 6, d: 5, h: 2.7 };

const WOOD = 0xd4b896;
const WOOD_DEEP = 0xc9a87c;
const WOOD_LIGHT = 0xe2d0b0;
const CREAM = 0xf0e6d8;
const SISAL = 0xa89070;
const BOWL = 0xc0c8d0;

/** @type {{id:string,name:string,emoji:string,color:number,size:[number,number,number],group:string}[]} */
const CATALOG = [
  { id: "sofa", name: "沙發", emoji: "🛋️", color: WOOD, size: [2.0, 0.72, 0.9], group: "wood" },
  { id: "table", name: "餐桌", emoji: "🍽️", color: WOOD_DEEP, size: [1.2, 0.72, 0.8], group: "wood" },
  { id: "coffee", name: "茶几", emoji: "🪵", color: WOOD, size: [0.9, 0.35, 0.55], group: "wood" },
  { id: "bed", name: "床", emoji: "🛏️", color: WOOD_LIGHT, size: [1.6, 0.5, 2.0], group: "wood" },
  { id: "cabinet", name: "櫃", emoji: "🗄️", color: WOOD, size: [0.95, 1.7, 0.42], group: "wood" },
  { id: "tv", name: "電視櫃", emoji: "📺", color: WOOD_DEEP, size: [1.5, 0.42, 0.4], group: "wood" },
  { id: "shelf", name: "層架", emoji: "📚", color: WOOD, size: [0.9, 1.4, 0.32], group: "wood" },
  { id: "cattree", name: "貓爬架", emoji: "🐱", color: WOOD, size: [0.7, 1.8, 0.7], group: "cat" },
  { id: "catshelf", name: "牆上層架", emoji: "🪜", color: WOOD_LIGHT, size: [0.55, 1.6, 0.28], group: "cat" },
  { id: "catcave", name: "貓洞櫃", emoji: "🏠", color: WOOD, size: [1.0, 1.1, 0.5], group: "cat" },
  { id: "feed", name: "餵食站", emoji: "🥣", color: WOOD_DEEP, size: [0.7, 0.28, 0.4], group: "cat" },
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

function woodMat(color = WOOD, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
  });
}

function fabricMat(color = CREAM, roughness = 0.88) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
  });
}

function addBox(parent, w, h, d, x, y, z, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (cast) m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCyl(parent, rTop, rBot, h, x, y, z, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat);
  m.position.set(x, y, z);
  if (cast) m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
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
  renderer.setClearColor(0xe8dfd0, 1);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe8dfd0, 12, 28);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  camera.position.set(4.0, 3.0, 5.0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.15;
  controls.target.set(0, 0.9, 0);
  controls.update();

  // Warm daylight loft lighting
  scene.add(new THREE.AmbientLight(0xfff6ea, 0.72));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.15);
  sun.position.set(3.2, 5.8, 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 20;
  sun.shadow.camera.left = -6;
  sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -6;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe8d0, 0.4);
  fill.position.set(-3.5, 2.8, -1.5);
  scene.add(fill);
  const hemi = new THREE.HemisphereLight(0xfff8f0, 0xd4c4a8, 0.35);
  scene.add(hemi);

  const roomRoot = new THREE.Group();
  scene.add(roomRoot);
  buildRoom(roomRoot);

  // Light oak floor with subtle plank strips
  const floorMat = woodMat(0xe0d0b4, 0.82);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = "floor";
  roomRoot.add(floor);

  const plankMat = woodMat(0xd8c6a4, 0.85);
  for (let i = 0; i < 8; i++) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.w - 0.08, 0.015),
      plankMat
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.002, -ROOM.d / 2 + 0.35 + i * 0.58);
    roomRoot.add(strip);
  }

  const furnitureRoot = new THREE.Group();
  roomRoot.add(furnitureRoot);

  /** @type {{uid:string,id:string,x:number,z:number,rot:number,mesh:THREE.Object3D}[]} */
  let items = [];
  let selected = null;
  let dragging = false;

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

    switch (def.id) {
      case "sofa":
        buildSofa(g);
        break;
      case "table":
        buildTable(g);
        break;
      case "coffee":
        buildCoffee(g);
        break;
      case "bed":
        buildBed(g);
        break;
      case "cabinet":
        buildCabinet(g);
        break;
      case "tv":
        buildTv(g);
        break;
      case "shelf":
        buildShelf(g);
        break;
      case "cattree":
        buildCatTree(g);
        break;
      case "catshelf":
        buildCatShelf(g);
        break;
      case "catcave":
        buildCatCave(g);
        break;
      case "feed":
        buildFeed(g);
        break;
      default:
        addBox(g, def.size[0], def.size[1], def.size[2], 0, def.size[1] / 2, 0, woodMat(def.color));
    }

    const [sx, , sz] = def.size;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(sx, sz) * 0.55, Math.max(sx, sz) * 0.62, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    ring.name = "selRing";
    g.add(ring);

    return g;
  }

  function buildSofa(g) {
    const wood = woodMat(WOOD_DEEP, 0.7);
    const fabric = fabricMat(0xefe6da, 0.9);
    const seat = fabricMat(0xf5eee4, 0.88);
    // seat base
    addBox(g, 2.0, 0.28, 0.82, 0, 0.28, 0, seat);
    // cushion
    addBox(g, 1.9, 0.14, 0.72, 0, 0.48, 0.02, fabric);
    // back
    addBox(g, 2.0, 0.55, 0.22, 0, 0.62, -0.32, fabric);
    // arms
    addBox(g, 0.16, 0.42, 0.82, -0.92, 0.48, 0, fabric);
    addBox(g, 0.16, 0.42, 0.82, 0.92, 0.48, 0, fabric);
    // wood legs
    [[-0.85, 0.08, -0.32], [0.85, 0.08, -0.32], [-0.85, 0.08, 0.32], [0.85, 0.08, 0.32]].forEach(
      ([x, y, z]) => addCyl(g, 0.035, 0.04, 0.16, x, y, z, wood)
    );
  }

  function buildTable(g) {
    const top = woodMat(WOOD, 0.65);
    const leg = woodMat(WOOD_DEEP, 0.7);
    addBox(g, 1.2, 0.05, 0.8, 0, 0.72, 0, top);
    [[-0.5, 0.36, -0.32], [0.5, 0.36, -0.32], [-0.5, 0.36, 0.32], [0.5, 0.36, 0.32]].forEach(
      ([x, y, z]) => addCyl(g, 0.035, 0.04, 0.72, x, y, z, leg)
    );
  }

  function buildCoffee(g) {
    const top = woodMat(WOOD_LIGHT, 0.68);
    const leg = woodMat(WOOD_DEEP, 0.72);
    addBox(g, 0.9, 0.04, 0.55, 0, 0.34, 0, top);
    [[-0.35, 0.17, -0.2], [0.35, 0.17, -0.2], [-0.35, 0.17, 0.2], [0.35, 0.17, 0.2]].forEach(
      ([x, y, z]) => addCyl(g, 0.028, 0.032, 0.34, x, y, z, leg)
    );
  }

  function buildBed(g) {
    const frame = woodMat(WOOD, 0.7);
    const sheet = fabricMat(0xfaf7f2, 0.92);
    const pillow = fabricMat(0xf2efe8, 0.9);
    addBox(g, 1.6, 0.28, 2.0, 0, 0.22, 0, frame);
    addBox(g, 1.5, 0.12, 1.85, 0, 0.42, 0.02, sheet);
    addBox(g, 0.55, 0.12, 0.32, -0.35, 0.52, -0.72, pillow);
    addBox(g, 0.55, 0.12, 0.32, 0.35, 0.52, -0.72, pillow);
    addBox(g, 1.6, 0.55, 0.08, 0, 0.55, -0.96, frame);
  }

  function buildCabinet(g) {
    const body = woodMat(WOOD, 0.7);
    const slat = woodMat(WOOD_DEEP, 0.65);
    addBox(g, 0.95, 1.7, 0.4, 0, 0.85, 0, body);
    // vertical slat accent on face
    for (let i = 0; i < 5; i++) {
      addBox(g, 0.04, 1.5, 0.03, -0.36 + i * 0.18, 0.9, 0.22, slat, false);
    }
    addBox(g, 0.95, 0.04, 0.42, 0, 1.68, 0, woodMat(WOOD_LIGHT, 0.68));
  }

  function buildTv(g) {
    const consoleM = woodMat(WOOD, 0.68);
    const screenM = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.35,
      metalness: 0.2,
    });
    addBox(g, 1.5, 0.42, 0.4, 0, 0.21, 0, consoleM);
    // open niches
    addBox(g, 0.55, 0.22, 0.32, -0.4, 0.2, 0.02, woodMat(WOOD_DEEP, 0.75), false);
    addBox(g, 0.55, 0.22, 0.32, 0.4, 0.2, 0.02, woodMat(WOOD_DEEP, 0.75), false);
    addBox(g, 1.2, 0.7, 0.05, 0, 0.85, -0.05, screenM);
  }

  function buildShelf(g) {
    const wood = woodMat(WOOD, 0.7);
    const side = woodMat(WOOD_DEEP, 0.72);
    addBox(g, 0.06, 1.4, 0.3, -0.42, 0.7, 0, side);
    addBox(g, 0.06, 1.4, 0.3, 0.42, 0.7, 0, side);
    [0.08, 0.45, 0.82, 1.18, 1.38].forEach((y) => {
      addBox(g, 0.88, 0.035, 0.3, 0, y, 0, wood);
    });
  }

  function buildCatTree(g) {
    const post = woodMat(SISAL, 0.85);
    const wood = woodMat(WOOD, 0.7);
    addCyl(g, 0.06, 0.06, 1.7, 0, 0.85, 0, post);
    addCyl(g, 0.05, 0.05, 1.2, 0.22, 0.7, 0.15, post);
    // platforms
    addBox(g, 0.55, 0.05, 0.55, 0, 0.35, 0, wood);
    addBox(g, 0.48, 0.05, 0.48, 0.1, 0.9, 0.08, wood);
    addBox(g, 0.42, 0.05, 0.42, -0.05, 1.4, -0.05, wood);
    addBox(g, 0.55, 0.05, 0.55, 0, 0.05, 0, wood);
    // small cave cylinder on mid
    const cave = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.28, 16, 1, true),
      woodMat(WOOD_DEEP, 0.75)
    );
    cave.rotation.z = Math.PI / 2;
    cave.position.set(0.05, 0.55, 0.05);
    cave.castShadow = true;
    g.add(cave);
  }

  function buildCatShelf(g) {
    const wood = woodMat(WOOD_LIGHT, 0.7);
    // stacked wall steps (floor-placed near wall)
    const steps = [
      [0, 0.45, 0.12],
      [0.08, 0.85, -0.02],
      [-0.05, 1.25, 0.05],
      [0.1, 1.55, -0.05],
    ];
    steps.forEach(([x, y, z], i) => {
      const w = 0.5 - i * 0.02;
      addBox(g, w, 0.05, 0.26, x, y, z, wood);
      // small bracket
      addBox(g, 0.04, 0.12, 0.04, x - w * 0.35, y - 0.06, z, woodMat(WOOD_DEEP, 0.7), false);
      addBox(g, 0.04, 0.12, 0.04, x + w * 0.35, y - 0.06, z, woodMat(WOOD_DEEP, 0.7), false);
    });
  }

  function buildCatCave(g) {
    const body = woodMat(WOOD, 0.7);
    const dark = new THREE.MeshStandardMaterial({
      color: 0x2a2420,
      roughness: 0.9,
      metalness: 0.02,
    });
    addBox(g, 1.0, 1.1, 0.5, 0, 0.55, 0, body);
    // arched dark opening (approx with box + half-cyl)
    addBox(g, 0.42, 0.45, 0.08, 0, 0.28, 0.26, dark, false);
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16, 1, false, 0, Math.PI),
      dark
    );
    arch.rotation.x = Math.PI / 2;
    arch.position.set(0, 0.5, 0.26);
    g.add(arch);
    // soft bed hint
    addBox(g, 0.35, 0.04, 0.3, 0, 0.06, 0.05, fabricMat(0xb8b0a8, 0.95), false);
    // upper cubby
    addBox(g, 0.35, 0.28, 0.08, 0, 0.85, 0.26, dark, false);
  }

  function buildFeed(g) {
    const wood = woodMat(WOOD_DEEP, 0.7);
    addBox(g, 0.7, 0.12, 0.4, 0, 0.12, 0, wood);
    addBox(g, 0.65, 0.04, 0.35, 0, 0.2, 0, woodMat(WOOD, 0.68));
    const bowlMat = new THREE.MeshStandardMaterial({
      color: BOWL,
      roughness: 0.35,
      metalness: 0.45,
    });
    addCyl(g, 0.09, 0.07, 0.06, -0.16, 0.25, 0, bowlMat);
    addCyl(g, 0.09, 0.07, 0.06, 0.16, 0.25, 0, bowlMat);
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
    if (!CATALOG.some((c) => c.id === typeId)) typeId = "sofa";
    const mesh = makeFurniture(typeId);
    let sx = x;
    let sz = z;
    // wall shelves prefer back wall
    if (typeId === "catshelf" && Math.abs(x) < 0.01 && Math.abs(z) < 0.01) {
      sx = -1.8;
      sz = -2.0;
    }
    const p = clampPos(sx, sz, typeId);
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
    spawn("coffee", -0.9, 0.4, 0);
    spawn("cattree", 1.8, -1.5, 0);
    spawn("catcave", 2.0, 0.8, -Math.PI / 2);
    setHud("已重置示範擺位（淺木＋貓友善）");
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

  function loadFrom(raw) {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return false;
    arr.forEach((row) => {
      if (!row || !row.id) return;
      spawn(row.id, row.x || 0, row.z || 0, row.rot || 0, row.uid);
    });
    selectItem(null);
    return true;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && loadFrom(raw)) return true;
      // graceful migrate from v1
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && loadFrom(legacy)) {
        save();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // Palette UI — two groups
  if (paletteEl) {
    paletteEl.innerHTML = "";
    function addGroup(label, list) {
      const wrap = document.createElement("div");
      wrap.className = "palette-group";
      const title = document.createElement("div");
      title.className = "palette-group-label";
      title.textContent = label;
      wrap.appendChild(title);
      const row = document.createElement("div");
      row.className = "palette-group-row";
      list.forEach((f) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "palette-item";
        btn.dataset.id = f.id;
        btn.setAttribute("role", "listitem");
        const hex = "#" + f.color.toString(16).padStart(6, "0");
        btn.innerHTML = `<span class="ico" style="background:${hex}33">${f.emoji}</span><span class="label">${f.name}</span>`;
        btn.addEventListener("click", () => {
          [...paletteEl.querySelectorAll(".palette-item")].forEach((b) =>
            b.classList.toggle("selected", b.dataset.id === f.id)
          );
          let x = (Math.random() - 0.5) * 1.5;
          let z = (Math.random() - 0.5) * 1.2;
          if (f.id === "catshelf") {
            x = -1.5 + Math.random() * 0.4;
            z = -2.0;
          }
          spawn(f.id, x, z, 0);
          setHud(`已加入${f.name} · 拖佢搬位`);
        });
        row.appendChild(btn);
      });
      wrap.appendChild(row);
      paletteEl.appendChild(wrap);
    }
    addGroup("淺木家俬", CATALOG.filter((c) => c.group === "wood"));
    addGroup("貓／寵物", CATALOG.filter((c) => c.group === "cat"));
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
      try {
        canvas.releasePointerCapture?.(ev.pointerId);
      } catch (_) {}
    }
    void moved;
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

  const view3d = $("#view-room3d");
  if (view3d && !view3d.hidden) setActive(true);

  if (!load()) {
    resetDemo();
  } else {
    setHud("已載入上次 3D 擺位");
  }

  window.__fdl3d = { spawn, clearAll, resetDemo, items };
  setHud("3D 就緒 · 淺木＋貓友善 · 拖搬位 · 雙撃刪除");
  console.info("[room3d] ready v2");
}

function buildRoom(root) {
  const wallColor = 0xf7f2ea;
  const hw = ROOM.w / 2;
  const hd = ROOM.d / 2;
  const hh = ROOM.h / 2;

  function wall(w, h, x, y, z, rotY = 0) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.94, metalness: 0.02 })
    );
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }

  wall(ROOM.w, ROOM.h, 0, hh, -hd);
  wall(ROOM.d, ROOM.h, -hw, hh, 0, Math.PI / 2);
  wall(ROOM.d, ROOM.h, hw, hh, 0, -Math.PI / 2);
  wall(ROOM.w, ROOM.h, 0, hh, hd, Math.PI);

  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    new THREE.MeshStandardMaterial({ color: 0xfffaf4, roughness: 1 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = ROOM.h;
  root.add(ceil);

  // Bright window
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.3),
    new THREE.MeshStandardMaterial({
      color: 0xd8eaf8,
      emissive: 0xc8daf0,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    })
  );
  win.position.set(0.8, 1.55, -hd + 0.05);
  root.add(win);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 1.45, 0.06),
    woodMat(0xe8dcc8, 0.7)
  );
  frame.position.set(0.8, 1.55, -hd + 0.04);
  root.add(frame);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 2.1),
    woodMat(0xc4a888, 0.75)
  );
  door.position.set(-1.6, 1.05, hd - 0.02);
  door.rotation.y = Math.PI;
  root.add(door);

  const trimMat = woodMat(0xe6d8c4, 0.8);
  [ -hd + 0.03, hd - 0.03 ].forEach((zz) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w, 0.08, 0.04), trimMat);
    t.position.set(0, 0.04, zz);
    root.add(t);
  });
}
