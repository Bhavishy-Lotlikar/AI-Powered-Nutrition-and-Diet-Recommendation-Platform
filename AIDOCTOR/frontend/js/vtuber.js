import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

let currentVrm;
let scene, camera, renderer;

export function initVTuber(container) {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.4, 2);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  loader.load("/assets/doctor.vrm", (gltf) => {
    const vrm = gltf.userData.vrm;
    VRMUtils.rotateVRM0(vrm);
    currentVrm = vrm;
    scene.add(vrm.scene);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (currentVrm) {
    currentVrm.update(0.016);
  }

  renderer.render(scene, camera);
}