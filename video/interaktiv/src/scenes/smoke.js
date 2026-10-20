import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
let r, scene, cam, mesh;
export function init({ W, H }) {
  r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  r.setSize(W, H, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture;
  cam = new THREE.PerspectiveCamera(35, W / H, .1, 100); cam.position.set(0, 0, 8);
  mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, .4, 200, 32), new THREE.MeshStandardMaterial({ color: 0xd4a640, metalness: 1, roughness: .25 }));
  scene.add(mesh);
}
export function draw(ctx, t, { W, H }) {
  mesh.rotation.set(t, t * 1.3, 0); r.render(scene, cam);
  ctx.fillStyle = '#100c06'; ctx.fillRect(0, 0, W, H); ctx.drawImage(r.domElement, 0, 0, W, H);
}
