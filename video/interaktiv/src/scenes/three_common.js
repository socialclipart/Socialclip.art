// Gemeinsame Three.js-Basis: Renderer, Umgebungslicht, Gold-Material, Projektion auf 2D.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function makeStage({ W, H, scale = 1, fov = 35 }) {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  r.setPixelRatio(1);
  r.setSize(Math.round(W * scale), Math.round(H * scale), false);
  r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture;
  const cam = new THREE.PerspectiveCamera(fov, W / H, .1, 200);
  return { r, scene, cam, THREE };
}

export const goldMat = (THREE, extra = {}) => new THREE.MeshPhysicalMaterial({ color: 0xe0b04a, metalness: 1, roughness: .22, clearcoat: .4, ...extra });

// Weltpunkt -> Bildschirmkoordinaten (1080×1920-Raum)
export function project(THREE, cam, v, W, H) {
  const p = v.clone().project(cam);
  return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H];
}

export function blit(ctx, r, W, H) { ctx.drawImage(r.domElement, 0, 0, W, H); }
