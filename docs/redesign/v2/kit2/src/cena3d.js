// DEVO v2 — kit2 (revisão): peças 3D de verdade em Three.js (o app usa React Three Fiber com a mesma cena).
// Cada função desenha num <canvas> transparente; a interface fica por cima em DOM.
// Servir a partir da raiz do repositório (o import map aponta para node_modules/three).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TEX = new THREE.TextureLoader();
const carregar = (url) => new Promise((ok) => TEX.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ok(t); }, undefined, () => ok(null)));
let pendentes = 0;
window.__3d = { pendentes: () => pendentes };

function base(canvas, { fov = 32, exposicao = 1.1, amb = 1 } = {}) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setSize(w, h, false);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = exposicao;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  const cena = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r);
  cena.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = amb;
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
  return { r, cena, cam, w, h };
}

// Brilho aditivo (sprite): halo, lampejo, estrela de 4 pontas
function texBrilho(tipo = 'halo') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  if (tipo === 'halo') {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.55)'); gr.addColorStop(.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  } else {
    g.translate(128, 128);
    for (const [len, larg, rot] of [[128, 5, 0], [128, 5, Math.PI / 2], [60, 3, Math.PI / 4], [60, 3, -Math.PI / 4]]) {
      g.save(); g.rotate(rot);
      const gr = g.createLinearGradient(-len, 0, len, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-len, 0); g.lineTo(0, -larg); g.lineTo(len, 0); g.lineTo(0, larg); g.fill(); g.restore();
    }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(-40, -40, 80, 80);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const HALO = texBrilho('halo'), ESTRELA = texBrilho('estrela');
function brilho(cor, tam, pos, tex = HALO, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(tam, tam, 1); s.position.copy(pos); return s;
}

// Engrenagem como forma extrudada
function formaEngrenagem(dentes, rExt, rInt, rFuro, raios = 5) {
  const s = new THREE.Shape();
  const passo = (Math.PI * 2) / dentes;
  for (let i = 0; i < dentes; i++) {
    const a = i * passo;
    const pts = [[rInt, a], [rExt, a + passo * .18], [rExt, a + passo * .45], [rInt, a + passo * .63]];
    pts.forEach(([r, t], j) => { const x = Math.cos(t) * r, y = Math.sin(t) * r; (i === 0 && j === 0) ? s.moveTo(x, y) : s.lineTo(x, y); });
  }
  s.closePath();
  const furo = new THREE.Path(); furo.absarc(0, 0, rFuro, 0, Math.PI * 2, true); s.holes.push(furo);
  // janelas entre os raios
  const rA = rInt * .78, rB = rFuro * 1.9;
  for (let i = 0; i < raios; i++) {
    const a0 = (i / raios) * Math.PI * 2 + .16, a1 = ((i + 1) / raios) * Math.PI * 2 - .16;
    const p = new THREE.Path();
    p.absarc(0, 0, rA, a0, a1, false);
    p.absarc(0, 0, rB, a1 - .05, a0 + .05, true);
    p.closePath();
    s.holes.push(p);
  }
  return s;
}
function engrenagem(dentes, rExt, esp, mat) {
  const g = new THREE.ExtrudeGeometry(formaEngrenagem(dentes, rExt, rExt * .86, rExt * .12), { depth: esp, bevelEnabled: true, bevelThickness: esp * .25, bevelSize: rExt * .015, bevelSegments: 2, curveSegments: 24 });
  g.center();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

// Mostrador pintado em canvas: céu noturno, numerais romanos, faixa de minutos, constelação
function texMostrador(tam = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d'); const R = tam / 2;
  g.translate(R, R);
  const ceu = g.createRadialGradient(0, -R * .2, R * .05, 0, 0, R);
  ceu.addColorStop(0, '#4a3c86'); ceu.addColorStop(.45, '#211a40'); ceu.addColorStop(.85, '#0d0a1a'); ceu.addColorStop(1, '#060509');
  g.fillStyle = ceu; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
  // nebulosa
  for (let i = 0; i < 9; i++) {
    const x = (Math.sin(i * 7.3) * .45) * R, y = (Math.cos(i * 3.1) * .4) * R;
    const n = g.createRadialGradient(x, y, 0, x, y, R * (.25 + (i % 3) * .1));
    n.addColorStop(0, i % 2 ? 'rgba(120,100,220,.18)' : 'rgba(74,98,232,.14)'); n.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = n; g.fillRect(-R, -R, tam, tam);
  }
  // estrelas
  let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 420; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R * .8;
    const t = rnd() * 1.8 + .3; g.fillStyle = `rgba(242,233,216,${rnd() * .7 + .2})`;
    g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, t, 0, Math.PI * 2); g.fill();
  }
  // constelação do Record (linhas finas)
  g.strokeStyle = 'rgba(164,181,255,.45)'; g.lineWidth = 1.6;
  const cs = [[-.32, -.22], [-.12, -.34], [.08, -.18], [.26, -.3], [.18, .02], [-.05, .12]].map(([x, y]) => [x * R, y * R]);
  g.beginPath(); cs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  cs.forEach(([x, y]) => { g.fillStyle = '#dfe6ff'; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); });
  // anéis
  g.strokeStyle = 'rgba(217,204,179,.75)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, R * .965, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, R * .74, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(217,204,179,.35)'; g.beginPath(); g.arc(0, 0, R * .69, 0, Math.PI * 2); g.stroke();
  // minutos
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2; const l = i % 5 ? R * .035 : R * .07;
    g.strokeStyle = i % 5 ? 'rgba(217,204,179,.6)' : '#efe4cc'; g.lineWidth = i % 5 ? 2 : 5;
    g.beginPath(); g.moveTo(Math.sin(a) * (R * .955), -Math.cos(a) * (R * .955)); g.lineTo(Math.sin(a) * (R * .955 - l), -Math.cos(a) * (R * .955 - l)); g.stroke();
  }
  // numerais romanos
  const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  g.fillStyle = '#efe4cc'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6;
  rom.forEach((t, i) => {
    const a = i / 12 * Math.PI * 2;
    g.save(); g.translate(Math.sin(a) * R * .83, -Math.cos(a) * R * .83); g.rotate(a);
    g.font = `600 ${i % 3 ? R * .085 : R * .11}px Cinzel`; g.fillText(t, 0, 0); g.restore();
  });
  g.shadowBlur = 0;
  // estrela de 4 pontas no centro (o sigilo)
  g.fillStyle = 'rgba(211,202,245,.18)';
  g.beginPath(); const e = R * .55, f = R * .07;
  g.moveTo(0, -e); g.lineTo(f, -f); g.lineTo(e, 0); g.lineTo(f, f); g.lineTo(0, e); g.lineTo(-f, f); g.lineTo(-e, 0); g.lineTo(-f, -f); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function ponteiro(compr, larg, mat, z) {
  const s = new THREE.Shape();
  s.moveTo(0, -compr * .18); s.lineTo(larg * .55, 0); s.lineTo(larg * .22, compr * .72);
  s.lineTo(larg * .9, compr * .8); s.lineTo(0, compr); s.lineTo(-larg * .9, compr * .8); s.lineTo(-larg * .22, compr * .72); s.lineTo(-larg * .55, 0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2 });
  const m = new THREE.Mesh(g, mat); m.position.z = z; m.castShadow = true; return m;
}

const METAL = () => new THREE.MeshPhysicalMaterial({ color: 0xd9c9a6, metalness: 1, roughness: .22, clearcoat: .6, clearcoatRoughness: .2 });
const LATAO = () => new THREE.MeshStandardMaterial({ color: 0x8d7650, metalness: 1, roughness: .38 });
const AME = () => new THREE.MeshPhysicalMaterial({ color: 0x8a7cc8, metalness: .1, roughness: .05, transmission: .6, thickness: .3, ior: 1.6, emissive: 0x2a1f5a, emissiveIntensity: .6 });

// ---------------------------------------------------------------- Relógio da home
export async function relogio(canvas, o = {}) {
  pendentes++;
  const { r, cena, cam } = base(canvas, { fov: 26, exposicao: 1.0, amb: .7 });
  cam.position.set(0, -.12, 8.2); cam.lookAt(0, 0, 0);
  const rel = new THREE.Group(); cena.add(rel);
  rel.rotation.set(.17, -.24, .02);

  // Aro: perfil torneado (chanfro, frisos, lábio interno)
  const perfil = [[1.04, -.16], [1.18, -.16], [1.24, -.1], [1.27, 0], [1.25, .07], [1.2, .1], [1.17, .14], [1.12, .2], [1.06, .2], [1.03, .14], [1.02, .04]].map(([x, y]) => new THREE.Vector2(x, y));
  const aro = new THREE.Mesh(new THREE.LatheGeometry(perfil, 160), METAL());
  aro.rotation.x = Math.PI / 2; aro.castShadow = true; rel.add(aro);
  // Coroa de pontas (estrela do sigilo no aro)
  const ponta = new THREE.ConeGeometry(.045, .2, 4);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2; const m = new THREE.Mesh(ponta, METAL());
    const rr = i % 3 ? 1.3 : 1.36;
    m.position.set(Math.sin(a) * rr, Math.cos(a) * rr, .02); m.rotation.z = -a; m.scale.setScalar(i % 3 ? .8 : 1.3); rel.add(m);
  }
  // Gemas ametista nos quartos
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2; const gm = new THREE.Mesh(new THREE.OctahedronGeometry(.07, 0), AME());
    gm.position.set(Math.sin(a) * 1.215, Math.cos(a) * 1.215, .15); gm.scale.set(1, 1.3, .6); rel.add(gm);
    rel.add(brilho(0xb9a8ff, .5, gm.position.clone().add(new THREE.Vector3(0, 0, .05)), HALO, .7));
  }
  // Mostrador
  const mostr = new THREE.Mesh(new THREE.CircleGeometry(1.03, 128), new THREE.MeshStandardMaterial({ map: texMostrador(), roughness: .55, metalness: .1, emissive: 0xffffff, emissiveMap: texMostrador(), emissiveIntensity: .35 }));
  mostr.position.z = .02; mostr.receiveShadow = true; rel.add(mostr);
  // Janela do mecanismo (submostrador vazado com engrenagens dentro)
  const sub = new THREE.Mesh(new THREE.RingGeometry(.2, .235, 64), METAL()); sub.position.set(0, -.44, .035); rel.add(sub);
  const subFundo = new THREE.Mesh(new THREE.CircleGeometry(.2, 64), new THREE.MeshStandardMaterial({ color: 0x0b0910, roughness: .9 })); subFundo.position.set(0, -.44, .028); rel.add(subFundo);
  const gMini = engrenagem(14, .16, .02, LATAO()); gMini.position.set(-.04, -.46, .032); rel.add(gMini);
  const gMini2 = engrenagem(10, .09, .02, METAL()); gMini2.position.set(.1, -.37, .036); rel.add(gMini2);
  // Ponteiros: hora (champanhe) e minuto (ametista), segundos fino
  const hh = ponteiro(.52, .09, METAL(), .07); hh.rotation.z = -(10 / 12) * Math.PI * 2 + .3; rel.add(hh);
  const mm = ponteiro(.86, .07, new THREE.MeshPhysicalMaterial({ color: 0x9d8ee0, metalness: .8, roughness: .2, emissive: 0x3b3168, emissiveIntensity: .5 }), .09); mm.rotation.z = -(42 / 60) * Math.PI * 2; rel.add(mm);
  const ss = new THREE.Mesh(new THREE.BoxGeometry(.012, 1.0, .008), METAL()); ss.geometry.translate(0, .38, 0); ss.position.z = .11; ss.rotation.z = -(9 / 60) * Math.PI * 2; rel.add(ss);
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .08, 32), METAL()); eixo.rotation.x = Math.PI / 2; eixo.position.z = .12; rel.add(eixo);
  const eixoG = new THREE.Mesh(new THREE.OctahedronGeometry(.035), AME()); eixoG.position.z = .17; rel.add(eixoG);
  // Vidro abaulado com reflexo
  const vidro = new THREE.Mesh(new THREE.SphereGeometry(3.2, 96, 32, 0, Math.PI * 2, 0, Math.asin(1.06 / 3.2)), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .02, transmission: 1, thickness: .05, ior: 1.5, transparent: true, opacity: .25, clearcoat: 1, envMapIntensity: 2.2, specularIntensity: 1 }));
  vidro.rotation.x = Math.PI / 2; vidro.position.z = .19 - Math.sqrt(3.2 * 3.2 - 1.06 * 1.06); rel.add(vidro);
  // reflexo especular pintado (faixa diagonal no vidro)
  const refl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .26), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false }));
  refl.position.set(-.1, .35, .24); refl.rotation.z = .62; rel.add(refl);
  const refl2 = refl.clone(); refl2.scale.set(.6, .35, 1); refl2.position.set(.18, .62, .245); rel.add(refl2);

  // Engrenagens em três profundidades, saindo por trás do aro
  const eng = new THREE.Group(); rel.add(eng);
  const E = [[18, .62, -1.05, .78, -.32, .05], [24, .78, 1.02, -.62, -.5, .06], [12, .36, 1.2, .68, -.28, .04], [30, .95, -.9, -1.0, -.85, .07], [10, .24, -1.32, .02, -.22, .035]];
  E.forEach(([d, rr, x, y, z, esp], i) => { const m = engrenagem(d, rr, esp, i % 2 ? LATAO() : METAL()); m.position.set(x, y, z); m.rotation.z = i * .3; eng.add(m); });
  // Pêndulo atrás
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.4, 12), METAL()); haste.position.set(.1, -1.5, -.4); haste.rotation.z = .12; rel.add(haste);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .04, 48), METAL()); disco.rotation.x = Math.PI / 2; disco.position.set(.18, -2.18, -.4); rel.add(disco);

  // Órbita dos apps: anel inclinado que passa atrás do relógio
  const orb = new THREE.Mesh(new THREE.TorusGeometry(1.95, .008, 8, 256), new THREE.MeshBasicMaterial({ color: 0xd9ccb3, transparent: true, opacity: .55 }));
  orb.rotation.set(1.28, 0, .22); cena.add(orb);
  const orb2 = new THREE.Mesh(new THREE.TorusGeometry(2.05, .003, 6, 256), new THREE.MeshBasicMaterial({ color: 0xa4b5ff, transparent: true, opacity: .35 }));
  orb2.rotation.copy(orb.rotation); cena.add(orb2);

  // Luz: o mostrador é a fonte; rim quente de cima à direita; ametista de baixo
  cena.add(new THREE.AmbientLight(0x6a5c9e, .35));
  const key = new THREE.SpotLight(0xfff1dc, 60, 20, .5, .6); key.position.set(3, 4, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); cena.add(key);
  const rim = new THREE.DirectionalLight(0xb7a6ff, 2.4); rim.position.set(-4, -2, -2); cena.add(rim);
  const frente = new THREE.PointLight(0x8a7cc8, 6, 6); frente.position.set(0, 0, 1.4); cena.add(frente);
  // lampejos no aro (bloom falso, aditivo)
  cena.add(brilho(0xfff4dd, .9, new THREE.Vector3(.75, .95, .3), ESTRELA, .95));
  cena.add(brilho(0xd3caf5, .55, new THREE.Vector3(-1.08, -.42, .3), ESTRELA, .7));
  cena.add(brilho(0x8a7cc8, 3.6, new THREE.Vector3(0, 0, -.6), HALO, .45));

  r.render(cena, cam);
  pendentes--;
  return { r, cena, cam };
}

// ---------------------------------------------------------------- Tabuleiro de mármore (Deadly Vote)
function espada(mat, matPunho, comp = 1.6) {
  const g = new THREE.Group();
  const s = new THREE.Shape(); const L = comp, w = .055;
  s.moveTo(-w, 0); s.lineTo(w, 0); s.lineTo(w * .8, L * .85); s.lineTo(0, L); s.lineTo(-w * .8, L * .85); s.closePath();
  const lam = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .012, bevelEnabled: true, bevelThickness: .012, bevelSize: .02, bevelSegments: 1 }), mat);
  lam.geometry.translate(0, 0, -.006); lam.rotation.z = Math.PI; lam.castShadow = true; g.add(lam);
  const guarda = new THREE.Mesh(new THREE.BoxGeometry(.42, .045, .06), matPunho); guarda.castShadow = true; g.add(guarda);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.OctahedronGeometry(.045), AME()); p.position.set(sx * .23, 0, 0); g.add(p); }
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(.028, .032, .36, 16), new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: .7 })); cabo.position.y = .2; cabo.castShadow = true; g.add(cabo);
  const pomo = new THREE.Mesh(new THREE.SphereGeometry(.05, 24, 16), matPunho); pomo.position.y = .41; g.add(pomo);
  return g;
}
function pecaTorneada(perfil, mat) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 64), mat); m.castShadow = true; m.receiveShadow = true; return m;
}
export async function tabuleiro(canvas) {
  pendentes++;
  const { r, cena, cam } = base(canvas, { fov: 30, exposicao: 1.0, amb: .18 });
  cam.position.set(0, 3.9, 7.4); cam.lookAt(0, .1, 0);
  const [mb, mn] = await Promise.all([carregar('img/os/marmore-branco.webp'), carregar('img/os/marmore-negro.webp')]);
  const tab = new THREE.Group(); cena.add(tab); tab.rotation.y = .5;
  const casa = .5;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const claro = (i + j) % 2 === 0; const t = (claro ? mb : mn).clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.5, .5); t.offset.set((i * 37 % 10) / 10, (j * 53 % 10) / 10);
    const m = new THREE.Mesh(new THREE.BoxGeometry(casa * .985, .08, casa * .985), new THREE.MeshPhysicalMaterial({ map: t, color: claro ? 0xd8d2ca : 0x1c1922, roughness: .14, metalness: 0, clearcoat: .9, clearcoatRoughness: .08 }));
    m.position.set((i - 3.5) * casa, 0, (j - 3.5) * casa); m.receiveShadow = true; m.castShadow = true; tab.add(m);
  }
  // moldura de aço champanhe com chanfro + base de mármore negro
  const mold = new THREE.Mesh(new THREE.BoxGeometry(4.4, .16, 4.4), METAL()); mold.position.y = -.07; mold.receiveShadow = true; tab.add(mold);
  const bt = mn.clone(); bt.needsUpdate = true; bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(1.2, .2);
  const baseM = new THREE.Mesh(new THREE.BoxGeometry(4.8, .5, 4.8), new THREE.MeshPhysicalMaterial({ map: bt, color: 0x3a3442, roughness: .25, clearcoat: .7 })); baseM.position.y = -.38; baseM.castShadow = true; baseM.receiveShadow = true; tab.add(baseM);
  const friso = new THREE.Mesh(new THREE.BoxGeometry(4.86, .04, 4.86), METAL()); friso.position.y = -.14; tab.add(friso);
  // espadas cravadas
  const lamina = new THREE.MeshPhysicalMaterial({ color: 0xe6e3ee, metalness: 1, roughness: .12, clearcoat: 1 });
  [[-1.1, .6, .25, -.2], [.9, -.9, -.3, .15], [1.55, 1.2, .18, .35], [-.4, -1.5, -.12, -.4]].forEach(([x, z, rx, rz], i) => {
    const e = espada(lamina, METAL(), 1.7); e.position.set(x, .62, z); e.rotation.set(rx, i * .9, rz); tab.add(e);
  });
  // peças: rei branco, rei negro caído, peões
  const brancoM = new THREE.MeshPhysicalMaterial({ map: mb, color: 0xf6f2ea, roughness: .2, clearcoat: .8 });
  const negroM = new THREE.MeshPhysicalMaterial({ map: mn, color: 0x2b2633, roughness: .2, clearcoat: .8 });
  const rei = [[0, 0], [.2, 0], [.2, .05], [.15, .08], [.1, .3], [.08, .55], [.13, .6], [.13, .64], [.07, .68], [.1, .8], [.04, .86], [0, .86]];
  const peao = [[0, 0], [.15, 0], [.15, .05], [.1, .08], [.06, .25], [.1, .28], [.06, .31], [.09, .36], [.08, .42], [.04, .46], [0, .46]];
  const rb = pecaTorneada(rei, brancoM); rb.position.set(-.25, .04, -.25); tab.add(rb);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(.04, .2, .04), brancoM); cr.position.set(-.25, .98, -.25); tab.add(cr);
  const cr2 = new THREE.Mesh(new THREE.BoxGeometry(.13, .04, .04), brancoM); cr2.position.set(-.25, 1.0, -.25); tab.add(cr2);
  const rn = pecaTorneada(rei, negroM); rn.rotation.z = Math.PI / 2 - .12; rn.position.set(.75, .2, .25); rn.rotation.y = .7; tab.add(rn);
  [[-1.25, -1.25, 1], [1.25, -.75, 0], [-.75, 1.25, 0], [.25, .75, 1], [-1.75, .25, 0], [1.75, -1.75, 1]].forEach(([x, z, b]) => { const p = pecaTorneada(peao, b ? brancoM : negroM); p.position.set(x, .04, z); tab.add(p); });
  // luz: holofote de cima (fonte que se explica: um lustre fora de quadro), rim ametista, rubi de baixo
  cena.add(new THREE.AmbientLight(0x4b3f7a, .4));
  const sp = new THREE.SpotLight(0xfff0dc, 140, 30, .42, .55, 1.4); sp.position.set(-1.5, 8, 1.5); sp.target.position.set(0, 0, 0); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -.0004; cena.add(sp, sp.target);
  const rim = new THREE.DirectionalLight(0x9d8ee0, 2.2); rim.position.set(4, 1.5, -5); cena.add(rim);
  const rb2 = new THREE.PointLight(0xa3121f, 8, 6); rb2.position.set(1.6, .3, 2.6); cena.add(rb2);
  // cone de luz visível (volumétrico falso)
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: .035, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  cone.position.set(-.75, 4, .75); cone.rotation.z = .19; cena.add(cone);
  // lampejos nas lâminas
  cena.add(brilho(0xffffff, .7, new THREE.Vector3(-.9, 1.3, .9), ESTRELA, .9));
  cena.add(brilho(0xd3caf5, .5, new THREE.Vector3(1.6, 1.25, -.2), ESTRELA, .8));
  r.render(cena, cam);
  pendentes--;
}

// ---------------------------------------------------------------- Mapa orbital das Torres
export async function orbita(canvas, torres) {
  pendentes++;
  const { r, cena, cam } = base(canvas, { fov: 36, exposicao: 1.05, amb: .35 });
  cam.position.set(0, 4.2, 9.4); cam.lookAt(0, .1, 0);
  const grupo = new THREE.Group(); cena.add(grupo); grupo.rotation.z = -.08;
  // núcleo: a agulha principal sobre um astrolábio
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(.42, 64, 32), new THREE.MeshPhysicalMaterial({ color: 0x2a2148, roughness: .1, metalness: .2, clearcoat: 1, emissive: 0x3b3168, emissiveIntensity: .8 }));
  grupo.add(nucleo);
  grupo.add(brilho(0x8a7cc8, 3.2, new THREE.Vector3(0, 0, 0), HALO, .7));
  grupo.add(brilho(0xfff4dd, 1.4, new THREE.Vector3(0, .05, .3), ESTRELA, .9));
  const raios = [1.35, 2.15, 2.95];
  raios.forEach((rr, i) => {
    const anel = new THREE.Mesh(new THREE.TorusGeometry(rr, i === 1 ? .014 : .008, 8, 256), i === 1 ? METAL() : new THREE.MeshBasicMaterial({ color: 0xd9ccb3, transparent: true, opacity: .5 }));
    anel.rotation.x = Math.PI / 2; grupo.add(anel);
    // marcas de grau
    for (let k = 0; k < 48; k++) {
      const a = k / 48 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.012, .005, k % 4 ? .05 : .12), new THREE.MeshBasicMaterial({ color: 0xd9ccb3, transparent: true, opacity: .6 }));
      m.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); m.rotation.y = -a; grupo.add(m);
    }
  });
  // arco meridiano (astrolábio)
  const mer = new THREE.Mesh(new THREE.TorusGeometry(3.1, .01, 8, 200, Math.PI), METAL()); mer.rotation.y = .5; grupo.add(mer);
  // estrelas
  const pts = []; let s = 5; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 900; i++) pts.push((rnd() - .5) * 30, (rnd() - .3) * 18, -rnd() * 14 - 2);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  cena.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8e2ff, size: .045, transparent: true, opacity: .8 })));
  // torres como planos pintados sobre pedestais de pedra flutuantes
  const texs = await Promise.all(torres.map((t) => carregar(t.img)));
  const pedra = await carregar('img/torres/pedra-negra.webp');
  torres.forEach((t, i) => {
    const a = t.ang, rr = raios[t.anel];
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const ilha = new THREE.Mesh(new THREE.CylinderGeometry(.34, .06, .5, 7, 1), new THREE.MeshStandardMaterial({ map: pedra, color: 0x6c6478, roughness: .9 }));
    ilha.position.set(x, -.12, z); ilha.castShadow = true; grupo.add(ilha);
    const topo = new THREE.Mesh(new THREE.CylinderGeometry(.35, .34, .04, 7), METAL()); topo.position.set(x, .14, z); grupo.add(topo);
    if (texs[i]) {
      const im = texs[i].image; const asp = im.width / im.height; const h = t.alt || 1.5;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i], color: t.trancada ? 0x5a566a : 0xffffff }));
      sp.scale.set(h * asp, h, 1); sp.center.set(.5, .03); sp.position.set(x, .14, z); grupo.add(sp);
    }
    grupo.add(brilho(t.trancada ? 0x5a566a : (t.cor || 0x8a7cc8), 1.4, new THREE.Vector3(x, .2, z), HALO, .55));
  });
  cena.add(new THREE.AmbientLight(0x6a5c9e, .6));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.5); key.position.set(3, 5, 4); cena.add(key);
  const rim = new THREE.DirectionalLight(0x8a7cc8, 2); rim.position.set(-4, 1, -4); cena.add(rim);
  r.render(cena, cam);
  // devolve a posição de tela de cada torre para a interface (rótulos)
  const out = torres.map((t) => {
    const v = new THREE.Vector3(Math.cos(t.ang) * raios[t.anel], .14, Math.sin(t.ang) * raios[t.anel]).applyMatrix4(grupo.matrixWorld).project(cam);
    return [(v.x + 1) / 2 * canvas.clientWidth, (1 - v.y) / 2 * canvas.clientHeight];
  });
  pendentes--;
  return out;
}

// ---------------------------------------------------------------- Pedestal da vitrine (cosméticos)
export async function pedestal(canvas, figura) {
  pendentes++;
  const { r, cena, cam } = base(canvas, { fov: 28, exposicao: 1.05, amb: .2 });
  cam.position.set(0, 2.2, 6.4); cam.lookAt(0, .9, 0);
  const mb = await carregar('img/os/marmore-negro.webp');
  if (mb) { mb.wrapS = mb.wrapT = THREE.RepeatWrapping; mb.repeat.set(2, 1); }
  const perfil = [[0, 0], [1.25, 0], [1.3, .06], [1.3, .16], [1.2, .2], [1.1, .22], [1.1, .3], [1.18, .34], [1.18, .4], [1.0, .44], [0, .44]];
  const ped = pecaTorneada(perfil, new THREE.MeshPhysicalMaterial({ map: mb, color: 0x4a4256, roughness: .2, clearcoat: 1 }));
  cena.add(ped);
  for (const [y, rr] of [[.16, 1.305], [.38, 1.185]]) { const a = new THREE.Mesh(new THREE.TorusGeometry(rr, .018, 12, 160), METAL()); a.rotation.x = Math.PI / 2; a.position.y = y; cena.add(a); }
  // gemas em volta
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const g = new THREE.Mesh(new THREE.OctahedronGeometry(.05), AME()); g.position.set(Math.cos(a) * 1.19, .27, Math.sin(a) * 1.19); cena.add(g); }
  // chão espelhado escuro
  const chao = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshPhysicalMaterial({ color: 0x0c0a12, roughness: .35, metalness: .2, clearcoat: .6 }));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; cena.add(chao);
  // figura pintada sobre o pedestal
  if (figura) {
    const t = await carregar(figura);
    if (t) {
      const asp = t.image.width / t.image.height, h = 2.45;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(h * asp, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .05, roughness: .9 }));
      p.position.set(0, .44 + h / 2, .1); p.castShadow = true; cena.add(p);
    }
  }
  // luz de vitrine: cone de cima, rim ametista e champanhe
  cena.add(new THREE.AmbientLight(0x5a4c8e, .5));
  const sp = new THREE.SpotLight(0xfff3e0, 90, 20, .3, .5, 1.2); sp.position.set(0, 7, 2); sp.target.position.set(0, .5, 0); sp.castShadow = true; cena.add(sp, sp.target);
  const r1 = new THREE.PointLight(0x8a7cc8, 12, 6); r1.position.set(-1.8, 1.6, -1); cena.add(r1);
  const r2 = new THREE.PointLight(0xf2a15e, 6, 6); r2.position.set(1.8, 1.2, -1); cena.add(r2);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6.5, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: .05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  cone.position.set(0, 3.7, 0); cena.add(cone);
  cena.add(brilho(0x8a7cc8, 3.5, new THREE.Vector3(0, .3, -.5), HALO, .5));
  r.render(cena, cam);
  pendentes--;
}

// ---------------------------------------------------------------- Escada (fallback 3D da Torre, se a pintura não existir)
export async function escada(canvas) {
  pendentes++;
  const { r, cena, cam } = base(canvas, { fov: 40, exposicao: 1.2 });
  cam.position.set(.4, 7.5, 2.6); cam.lookAt(0, 0, 0);
  const mb = await carregar('img/torres/marmore.webp');
  const mat = new THREE.MeshPhysicalMaterial({ map: mb, color: 0xe8e2da, roughness: .3, clearcoat: .6 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 14, 48), new THREE.MeshStandardMaterial({ color: 0x2a2530, roughness: .7 })); col.position.y = -5; cena.add(col);
  for (let i = 0; i < 64; i++) {
    const a = i * .32, y = -i * .17;
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.5, .1, .42), mat); d.position.set(Math.cos(a) * 1.15, y, Math.sin(a) * 1.15); d.rotation.y = -a; d.castShadow = d.receiveShadow = true; cena.add(d);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .5, 8), METAL()); b.position.set(Math.cos(a) * 1.88, y + .28, Math.sin(a) * 1.88); cena.add(b);
  }
  cena.add(new THREE.AmbientLight(0x6a5c9e, .3));
  const ocul = new THREE.SpotLight(0xe6ecff, 120, 30, .5, .6); ocul.position.set(0, 10, 0); ocul.castShadow = true; cena.add(ocul);
  const lant = new THREE.PointLight(0xf2a15e, 10, 4); lant.position.set(1.2, -1.2, .4); cena.add(lant);
  cena.fog = new THREE.Fog(0x0a090d, 6, 14);
  r.render(cena, cam);
  pendentes--;
}

// Ajudantes reaproveitados pelas cenas dos cosméticos (cos3d.js)
export { base, brilho, engrenagem, ponteiro, pecaTorneada, carregar, texMostrador, HALO, ESTRELA, METAL, LATAO, AME };
