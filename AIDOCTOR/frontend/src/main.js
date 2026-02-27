import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
let audioContext = null
let analyser = null
let dataArray 	= null
let currentVrm = null
let speaking = false
let time = 0

// ---------------- SCENE ----------------
const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)

camera.position.set(0, 1.45, 1.8)
camera.lookAt(0, 1.45, 0)

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.getElementById('app').appendChild(renderer.domElement)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(1, 1, 1)
scene.add(light)

// ---------------- LOAD MODEL ----------------
const loader = new GLTFLoader()
loader.register(parser => new VRMLoaderPlugin(parser))

loader.load('/assets/doctor.vrm', (gltf) => {

  const vrm = gltf.userData.vrm
  currentVrm = vrm



  // IMPORTANT: Adjust arm rest pose by modifying scene scale trick
  vrm.scene.traverse(obj => {
    if (obj.isBone && obj.name.includes('UpperArm')) {
      obj.rotation.x = -1.2
    }
    if (obj.isBone && obj.name.includes('LowerArm')) {
      obj.rotation.x = -0.4
    }
  })

  scene.add(vrm.scene)
})

// ---------------- SPEAK ----------------
function speak(text) {

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  utterance.onstart = () => {
    speaking = true

    if (!audioContext) {
      audioContext = new AudioContext()
    }

    const source = audioContext.createMediaStreamDestination()
  }

  utterance.onend = () => {
    speaking = false

    if (currentVrm) {
      currentVrm.expressionManager.setValue('aa', 0)
    }
  }

  window.speechSynthesis.speak(utterance)
}

document.getElementById('speak-btn')?.addEventListener('click', () => {
  speak("Hello. I am your virtual nutrition doctor.")
})

// ---------------- ANIMATION ----------------
function animate() {

  requestAnimationFrame(animate)

  if (currentVrm) {

    time += 0.02

    // Let VRM update first
    currentVrm.update(0.016)

    // Get RAW bones (not normalized)
    const humanoid = currentVrm.humanoid

    const lUpper = humanoid.getRawBoneNode('leftUpperArm')
    const rUpper = humanoid.getRawBoneNode('rightUpperArm')
    const lLower = humanoid.getRawBoneNode('leftLowerArm')
    const rLower = humanoid.getRawBoneNode('rightLowerArm')

    // ---- HARD RESET ROTATIONS ----
    if (lUpper) lUpper.rotation.set(0, 0, 0)
    if (rUpper) rUpper.rotation.set(0, 0, 0)
    if (lLower) lLower.rotation.set(0, 0, 0)
    if (rLower) rLower.rotation.set(0, 0, 0)

    // ---- FORCE A-POSE ----
    if (lUpper) lUpper.rotation.z = -0.9
    if (rUpper) rUpper.rotation.z = 0.9

    if (lLower) lLower.rotation.x = -0.3
    if (rLower) rLower.rotation.x = -0.3

    // ---- IDLE SWAY ----
    const spine = humanoid.getRawBoneNode('spine')
    const head = humanoid.getRawBoneNode('head')

    if (spine) {
      spine.rotation.x += Math.sin(time) * 0.02
      spine.rotation.y += Math.sin(time * 0.5) * 0.05
    }

    if (head) {
      head.rotation.y += Math.sin(time * 0.5) * 0.03
    }

    // ---- TALKING ----
    if (speaking) {

  const speed = 12
  const open = Math.abs(Math.sin(time * speed)) * 0.7

  currentVrm.expressionManager.setValue('aa', open)
  currentVrm.expressionManager.setValue('ee', open * 0.3)
  currentVrm.expressionManager.setValue('oh', open * 0.2)

} else {

  currentVrm.expressionManager.setValue('aa', 0)
  currentVrm.expressionManager.setValue('ee', 0)
  currentVrm.expressionManager.setValue('oh', 0)

}

  }

  renderer.render(scene, camera)
}

animate()

// ---------------- RESIZE ----------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})