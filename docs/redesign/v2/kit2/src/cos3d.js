// DEVO v2 — cosméticos (rodada 2): a peça Arcano em 3D de verdade (ref-20).
// Cristal com transmissão, dispersão e iridescência; mecanismo de relógio DENTRO do aro; ponteiro que atravessa a
// janela; sino de cristal; três cartas em órbita com sombra; pedestal de mármore negro. No app: a mesma cena em R3F
// (<MeshPhysicalMaterial transmission dispersion iridescence/>), girando devagar na vitrine e na revelação do Poço.
import * as THREE from 'three';
import { base, brilho, engrenagem, ponteiro, pecaTorneada, carregar, HALO, ESTRELA, METAL, LATAO } from './cena3d.js';

let pend = 0;
window.__cos3d = { pendentes: () => pend };

const CRISTAL = (o = {}) => new THREE.MeshPhysicalMaterial({
  color: 0xf4f0ff, metalness: 0, roughness: .04, transmission: 1, thickness: o.esp ?? .45, ior: 1.62,
  dispersion: 4, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 620],
  clearcoat: 1, clearcoatRoughness: .03, specularIntensity: 1, envMapIntensity: 2.4, attenuationColor: new THREE.Color(0xd3caf5), attenuationDistance: 2.2,
  transparent: true, ...o.extra,
});
const ACO_AZUL = () => new THREE.MeshPhysicalMaterial({ color: 0x3d4f9e, metalness: 1, roughness: .28, clearcoat: .8, iridescence: .6, iridescenceIOR: 1.4 });

function retratoTex(img, tam = 512) {
  const c = document.createElement('canvas'); c.width = c.height = tam; const g = c.getContext('2d');
  g.save(); g.beginPath(); g.arc(tam / 2, tam / 2, tam / 2, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#2a2333'; g.fillRect(0, 0, tam, tam);
  if (img) { const s = tam * 1.38 / img.width; g.drawImage(img, (tam - img.width * s) / 2, -tam * .06, img.width * s, img.height * s); }
  const v = g.createRadialGradient(tam * .5, tam * .5, tam * .3, tam * .5, tam * .5, tam * .5);
  v.addColorStop(0, 'rgba(10,8,16,0)'); v.addColorStop(1, 'rgba(10,8,16,.6)'); g.fillStyle = v; g.fillRect(0, 0, tam, tam);
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function carregarImg(url) { return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = url; }); }

// Corpo da relíquia: aro de cristal grosso (lathe), mecanismo dentro, ponteiro, sino, cartas
async function reliquia(o) {
  const g = new THREE.Group();
  // aro de cristal: perfil arredondado e grosso, com chanfro (lê como joia)
  const perfil = [[.98, -.17], [1.12, -.2], [1.26, -.15], [1.33, -.04], [1.33, .05], [1.27, .15], [1.13, .2], [1.0, .17], [.95, .08], [.95, -.08]].map(([x, y]) => new THREE.Vector2(x, y));
  const aro = new THREE.Mesh(new THREE.LatheGeometry(perfil, 180), CRISTAL({ esp: .35 }));
  aro.rotation.x = Math.PI / 2; g.add(aro);
  // ogiva no alto (o relógio é mais alto que largo): arco pontudo de cristal com uma gema
  const ogS = new THREE.Shape(); ogS.moveTo(-.55, 0); ogS.quadraticCurveTo(-.5, .62, 0, 1.0); ogS.quadraticCurveTo(.5, .62, .55, 0);
  ogS.lineTo(.36, 0); ogS.quadraticCurveTo(.33, .42, 0, .7); ogS.quadraticCurveTo(-.33, .42, -.36, 0); ogS.closePath();
  const og = new THREE.Mesh(new THREE.ExtrudeGeometry(ogS, { depth: .16, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 4, curveSegments: 32 }), CRISTAL({ esp: .3 }));
  og.position.set(0, 1.18, -.1); g.add(og);
  const gemaT = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), new THREE.MeshPhysicalMaterial({ color: 0xb9aef0, transmission: .7, thickness: .3, ior: 2, roughness: 0, iridescence: 1, emissive: 0x3b3168, emissiveIntensity: .7 }));
  gemaT.scale.set(.8, 1.3, .6); gemaT.position.set(0, 1.62, .02); g.add(gemaT);
  // filete champanhe nos dois lados do aro (o ouro só no detalhe)
  for (const [r, z] of [[1.335, 0], [.955, .1], [.955, -.1]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 10, 200), METAL()); t.position.z = z; g.add(t); }
  // mecanismo DENTRO da espessura do aro (visto através do cristal), sobre uma placa escura que dá contraste
  const placa = new THREE.Mesh(new THREE.RingGeometry(.97, 1.3, 128), new THREE.MeshStandardMaterial({ color: 0x0d0a18, roughness: .6, metalness: .3 }));
  placa.position.z = -.16; g.add(placa);
  const mec = new THREE.Group(); g.add(mec);
  const N = 14;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + .2; const rr = 1.14 + (i % 2 ? .04 : -.03);
    const tam = [.16, .1, .13][i % 3];
    const e = engrenagem([14, 9, 11][i % 3], tam, .04, i % 2 ? LATAO() : (i % 3 ? METAL() : ACO_AZUL()));
    e.position.set(Math.cos(a) * rr, Math.sin(a) * rr, (i % 2 ? -.06 : -.1)); e.rotation.z = i; mec.add(e);
  }
  // marcas de hora gravadas (barrinhas de metal sob o cristal)
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(i % 3 ? .02 : .04, i % 3 ? .1 : .16, .02), METAL());
    m.position.set(Math.sin(a) * 1.02, Math.cos(a) * 1.02, .14); m.rotation.z = -a; g.add(m);
  }
  // janela: retrato do jogador (ou céu)
  const img = o.retrato ? await carregarImg(o.retrato) : null;
  const jan = new THREE.Mesh(new THREE.CircleGeometry(.95, 96), new THREE.MeshBasicMaterial({ map: retratoTex(img), color: 0xa49cb6 }));
  jan.position.z = -.02; g.add(jan);
  // ponteiro longo atravessando a janela na diagonal e saindo do aro
  const pt = ponteiro(2.25, .11, new THREE.MeshPhysicalMaterial({ color: 0xe9dcbf, metalness: 1, roughness: .16, clearcoat: 1, emissive: 0x8a7350, emissiveIntensity: .55 }), .24);
  pt.rotation.z = -.72; pt.position.set(-.35, -.42, 0); g.add(pt);
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .06, 32), METAL()); eixo.rotation.x = Math.PI / 2; eixo.position.set(-.35, -.42, .26); g.add(eixo);
  // corpo de torre em cristal (como a pintura): duas colunas com pináculos, arco ogival entre elas e base facetada
  const colMat = CRISTAL({ esp: .25 });
  for (const sx of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(.2, 2.3, .26, 1, 1, 1), colMat); col.position.set(sx * 1.0, -1.25, -.02); g.add(col);
    const pin = new THREE.Mesh(new THREE.ConeGeometry(.13, .7, 4), colMat); pin.position.set(sx * 1.18, 1.05, -.04); pin.rotation.y = Math.PI / 4; g.add(pin);
    const fil = new THREE.Mesh(new THREE.BoxGeometry(.012, 2.3, .012), METAL()); fil.position.set(sx * 1.0, -1.25, .14); g.add(fil);
  }
  const arcS = new THREE.Shape(); arcS.moveTo(-1.1, 0); arcS.lineTo(1.1, 0); arcS.lineTo(1.1, -.5); arcS.lineTo(.9, -.5); arcS.quadraticCurveTo(.85, -.08, 0, -.02); arcS.quadraticCurveTo(-.85, -.08, -.9, -.5); arcS.lineTo(-1.1, -.5); arcS.closePath();
  const arc = new THREE.Mesh(new THREE.ExtrudeGeometry(arcS, { depth: .2, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 3, curveSegments: 24 }), colMat);
  arc.position.set(0, -1.15, -.12); g.add(arc);
  const baseC = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, .32, 8), CRISTAL({ esp: .5 })); baseC.scale.set(1, 1, .38); baseC.position.set(0, -2.48, 0); baseC.rotation.y = Math.PI / 8; g.add(baseC);
  const baseF = new THREE.Mesh(new THREE.TorusGeometry(1.5, .012, 8, 8), METAL()); baseF.rotation.x = Math.PI / 2; baseF.scale.set(1, .38, 1); baseF.position.set(0, -2.33, 0); g.add(baseF);
  // sino de cristal + corrente
  const sino = pecaTorneada([[0, 0], [.2, 0], [.19, .03], [.14, .1], [.11, .22], [.09, .3], [.04, .33], [0, .34]], CRISTAL({ esp: .15 }));
  sino.rotation.x = Math.PI; sino.position.set(0, -1.5, 0); g.add(sino);
  const badalo = new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 12), METAL()); badalo.position.set(.02, -1.78, 0); g.add(badalo);
  for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(.028, .007, 8, 16), METAL()); l.position.set(0, -1.49 + k * .05, 0); l.rotation.y = k % 2 ? Math.PI / 2 : 0; g.add(l); }
  // pêndulo curto de cristal abaixo do sino
  const pen = new THREE.Mesh(new THREE.OctahedronGeometry(.09, 0), CRISTAL({ esp: .2 })); pen.scale.set(.7, 1.6, .5); pen.position.set(0, -2.02, 0); g.add(pen);
  // cartas em órbita (três profundidades, inclinadas)
  const tc = o.carta ? await carregar(o.carta) : null;
  const cartas = new THREE.Group(); g.add(cartas);
  const orbita = new THREE.Mesh(new THREE.TorusGeometry(1.75, .004, 6, 220), new THREE.MeshBasicMaterial({ color: 0xd3caf5, transparent: true, opacity: .55 }));
  orbita.rotation.set(1.18, .34, .2); g.add(orbita);
  const C = [[.62, 0], [2.6, .1], [4.15, -.05]];
  C.forEach(([t, sp], i) => {
    const frente = new THREE.MeshPhysicalMaterial({ map: tc, color: tc ? 0xffffff : 0xf2efe9, roughness: .35, clearcoat: .8, side: THREE.DoubleSide });
    const c = new THREE.Mesh(new THREE.BoxGeometry(.42, .62, .008), [METAL(), METAL(), METAL(), METAL(), frente, frente]);
    const p = new THREE.Vector3(Math.cos(t) * 1.75, Math.sin(t) * 1.75, 0).applyEuler(orbita.rotation);
    c.position.copy(p); c.rotation.set(.2 + sp, -.5 + i * .3, -.3 + i * .25); c.castShadow = true; cartas.add(c);
    g.add(brilho(0xfff4dd, .35, p.clone().add(new THREE.Vector3(.12, .2, .05)), ESTRELA, .9));
  });
  return g;
}

// Pedestal de mármore negro com frisos champanhe, gemas, chão escuro e feixe que segura a peça no ar
async function montarPedestal(cena) {
    const mb = await carregar('img/os/marmore-negro.webp');
    if (mb) { mb.wrapS = mb.wrapT = THREE.RepeatWrapping; mb.repeat.set(2, 1); }
    const marm = new THREE.MeshPhysicalMaterial({ map: mb, color: 0x4a4256, roughness: .2, clearcoat: 1 });
    // pedestal alto: base em degraus, fuste com frisos champanhe, taça que recebe a peça
    const ped = pecaTorneada([[0, 0], [1.3, 0], [1.34, .08], [1.3, .18], [1.12, .22], [1.08, .34], [.86, .38], [.56, .46], [.42, .56], [.36, .7], [.34, 1.1], [.38, 1.18], [.5, 1.24], [.74, 1.34], [.86, 1.42], [.84, 1.48], [0, 1.48]], marm);
    cena.add(ped);
    for (const [y, rr] of [[.18, 1.31], [.36, 1.08], [.7, .37], [1.12, .36], [1.44, .86]]) { const a = new THREE.Mesh(new THREE.TorusGeometry(rr, .018, 12, 160), METAL()); a.rotation.x = Math.PI / 2; a.position.y = y; cena.add(a); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const gm = new THREE.Mesh(new THREE.OctahedronGeometry(.045), new THREE.MeshPhysicalMaterial({ color: 0xb9aef0, transmission: .6, roughness: 0, emissive: 0x3b3168, emissiveIntensity: .8 })); gm.position.set(Math.cos(a) * 1.1, .28, Math.sin(a) * 1.1); cena.add(gm); }
    // chão escuro com fade radial (sem horizonte)
    const fc = document.createElement('canvas'); fc.width = fc.height = 256; const fg = fc.getContext('2d');
    const gr = fg.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(.45, '#888'); gr.addColorStop(1, '#000');
    fg.fillStyle = gr; fg.fillRect(0, 0, 256, 256);
    const chao = new THREE.Mesh(new THREE.CircleGeometry(5, 64), new THREE.MeshStandardMaterial({ color: 0x14101e, roughness: .35, metalness: .4, envMapIntensity: .2, transparent: true, alphaMap: new THREE.CanvasTexture(fc) }));
    chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; cena.add(chao);
    // feixe que segura a peça no ar
    const feixe = new THREE.Mesh(new THREE.CylinderGeometry(.5, .78, 1.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xd3caf5, transparent: true, opacity: .07, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    feixe.position.y = 2.05; cena.add(feixe);
    // círculo de raridade aceso no chão (a placa Arcano acende)
    const anel = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.5, 128), new THREE.MeshBasicMaterial({ color: 0xd3caf5, transparent: true, opacity: .8, blending: THREE.AdditiveBlending }));
    anel.rotation.x = -Math.PI / 2; anel.position.y = 1.485; anel.scale.setScalar(.6); cena.add(anel);
    cena.add(brilho(0xb9aef0, 3.2, new THREE.Vector3(0, .1, 0), HALO, .45));
  }

// Cena completa: relíquia sobre o pedestal, luz de vitrine, partículas. o.cam: 'vitrine' | 'perto'
export async function arcanoCristal(canvas, o = {}) {
  pend++;
  const { r, cena, cam } = base(canvas, { fov: o.fov ?? 30, exposicao: 1.1, amb: .55 });
  r.transmissionResolutionScale = 1;
  const perto = o.cam === 'perto';
  cam.position.set(o.camX ?? 0, perto ? .3 : 2.9, perto ? 7.4 : (o.camZ ?? 12.4)); cam.lookAt(o.camX ?? 0, perto ? .25 : (o.olharY ?? 2.3), 0);
  // fundo atrás do cristal (a transmissão precisa de algo para refratar): céu de mostrador + halos
  const fundo = o.semFundo ? new THREE.Group() : new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshBasicMaterial({ map: o.fundo ? await carregar(o.fundo) : null, color: o.fundo ? 0x8a80a8 : 0x0d0b16 }));
  fundo.position.set(0, 3, -4); cena.add(fundo);
  let rel;
  if (o.figura) {
    rel = new THREE.Group();
    const t = await carregar(o.figura);
    const asp = t.image.width / t.image.height, h = o.alturaFig ?? 3.6;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(h * asp, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .04, color: 0xe9e4f2 }));
    p.castShadow = true; p.position.y = h / 2 - 1.75; rel.add(p);
  } else rel = await reliquia(o);
  const yRel = perto ? .2 : (o.figura ? 3.55 : 4.45); rel.position.set(0, yRel, 0); rel.rotation.set(.05, o.figura ? -.18 : -.32, .04); cena.add(rel);
  if (!perto) await montarPedestal(cena);
  // luz: cone frio de cima, rim ametista atrás, cobalto lateral, quente fraco de baixo
  cena.add(new THREE.AmbientLight(0x5a4c8e, .5));
  const sp = new THREE.SpotLight(0xf3eeff, 120, 24, .34, .5, 1.2); sp.position.set(.5, 8, 3); sp.target.position.set(0, 2.4, 0); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); cena.add(sp, sp.target);
  const r1 = new THREE.PointLight(0x8a7cc8, 18, 7); r1.position.set(-2, 2.6, -1.4); cena.add(r1);
  const r2 = new THREE.PointLight(0x4a62e8, 14, 7); r2.position.set(2.2, 2.2, -.8); cena.add(r2);
  const r3 = new THREE.PointLight(0xf2b3cb, 5, 5); r3.position.set(.8, 1, 2.2); cena.add(r3);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 7.5, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xf3eeff, transparent: true, opacity: .045, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  cone.position.set(.25, 5.2, .9); cone.rotation.z = -.06; cena.add(cone);
  // halo atrás do cristal + lampejos (bloom falso)
  const yc = yRel;
  cena.add(brilho(0x8a7cc8, 5.4, new THREE.Vector3(0, yc, -1.2), HALO, .55));
  cena.add(brilho(0xffffff, 1.1, new THREE.Vector3(-.95, yc + .85, .5), ESTRELA, 1));
  cena.add(brilho(0xd3caf5, .7, new THREE.Vector3(1.15, yc - .55, .5), ESTRELA, .85));
  cena.add(brilho(0xa4b5ff, .5, new THREE.Vector3(.2, yc + 1.7, .4), ESTRELA, .8));
  // poeira de estrela
  const pts = []; let s = 3; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 260; i++) pts.push((rnd() - .5) * 8, rnd() * 6.5, (rnd() - .5) * 4);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  cena.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8e2ff, size: .03, transparent: true, opacity: .75, blending: THREE.AdditiveBlending })));
  r.render(cena, cam);
  pend--;
  return { r, cena, cam };
}
