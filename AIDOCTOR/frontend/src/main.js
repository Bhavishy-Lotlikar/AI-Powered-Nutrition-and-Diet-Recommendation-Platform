import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices()
}

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

  scene.add(vrm.scene)

})

 
// ---------------- SPEECH RECOGNITION ----------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const recognition = new SpeechRecognition()

let isListening = false

recognition.continuous = false
recognition.interimResults = false
recognition.lang = "en-US"

recognition.onstart = () => {
  isListening = true
  console.log("🎤 Listening...")
}

recognition.onend = () => {
  isListening = false
  console.log("🛑 Listening stopped")
}

recognition.onresult = async (event) => {
  const userText = event.results[0][0].transcript
  console.log("User said:", userText)

  const reply = await getGeminiReply(userText)
  speak(reply)
}

recognition.onerror = (err) => {
  console.error("Speech recognition error:", err)
  isListening = false
}

// ---------------- BUTTON ----------------
document.getElementById('speak-btn')?.addEventListener('click', () => {

  if (!isListening) {
    recognition.start()
  } else {
    console.log("Already listening...")
  }

})

// ---------------- GEMINI PLACEHOLDER ----------------
async function getGeminiReply(text) {

  // Replace with real backend call later
  return "Based on your question, I recommend a balanced diet with adequate protein and fiber."

}

// ---------------- TEXT TO SPEECH ----------------
function speak(text) {

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  // Wait until voices are loaded
  const voices = window.speechSynthesis.getVoices()

  // Pick a better English voice
  const preferredVoice = voices.find(v =>
    v.name.includes("Google") || 
    v.name.includes("Natural") ||
    v.lang === "en-US"
  )

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  // Tune these for realism
  utterance.rate = 0.95      // slightly slower
  utterance.pitch = 1.1      // slightly softer tone
  utterance.volume = 1

  utterance.onstart = () => {
    speaking = true
  }

  utterance.onend = () => {
    speaking = false
    if (currentVrm) {
      currentVrm.expressionManager.setValue('aa', 0)
    }
  }

  window.speechSynthesis.speak(utterance)
}

// ---------------- BUTTON ----------------
document.getElementById('speak-btn')?.addEventListener('click', () => {

  try {
    recognition.stop()
  } catch (e) {}

  setTimeout(() => {
    try {
      recognition.start()
    } catch (e) {
      console.log("Still starting…")
    }
  }, 300)

})

// ---------------- ANIMATION ----------------
function animate() {

  requestAnimationFrame(animate)

  if (currentVrm) {

    time += 0.02

    currentVrm.update(0.016)

    const humanoid = currentVrm.humanoid

    // ---- FORCE A-POSE ----
    const lUpper = humanoid.getRawBoneNode('leftUpperArm')
    const rUpper = humanoid.getRawBoneNode('rightUpperArm')
    const lLower = humanoid.getRawBoneNode('leftLowerArm')
    const rLower = humanoid.getRawBoneNode('rightLowerArm')

    if (lUpper) lUpper.rotation.set(0, 0, -0.9)
    if (rUpper) rUpper.rotation.set(0, 0, 0.9)
    if (lLower) lLower.rotation.set(-0.3, 0, 0)
    if (rLower) rLower.rotation.set(-0.3, 0, 0)

    // ---- IDLE SWAY (NO DRIFT) ----
    const spine = humanoid.getRawBoneNode('spine')
    const head = humanoid.getRawBoneNode('head')

    if (spine) {
      spine.rotation.x = Math.sin(time) * 0.02
      spine.rotation.y = Math.sin(time * 0.5) * 0.05
    }

    if (head) {
      head.rotation.y = Math.sin(time * 0.5) * 0.03
    }

    // ---- TALKING ----
    if (speaking) {
      const open = Math.abs(Math.sin(time * 10)) * 0.6
      currentVrm.expressionManager.setValue('aa', open)
    } else {
      currentVrm.expressionManager.setValue('aa', 0)
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