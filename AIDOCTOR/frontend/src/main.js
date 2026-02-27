import { getGeminiReply } from "./api"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

let currentVrm = null
let speaking = false
let time = 0
let blinkTimer = 0

//TEXT BOX
function addUserMessage(text) {
  const log = document.getElementById("chat-log")
  const msg = document.createElement("div")
  msg.className = "chat-user"
  msg.textContent = "You: " + text
  log.appendChild(msg)
  log.scrollTop = log.scrollHeight
}

function addAIMessage(text) {
  const log = document.getElementById("chat-log")
  const msg = document.createElement("div")
  msg.className = "chat-ai"
  msg.textContent = "Doctor: " + text
  log.appendChild(msg)
  log.scrollTop = log.scrollHeight
}

function setStatus(text) {
  document.getElementById("chat-status").textContent = text
}


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
  currentVrm = gltf.userData.vrm
  scene.add(currentVrm.scene)
})

// ---------------- SPEECH RECOGNITION ----------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const recognition = new SpeechRecognition()

recognition.lang = "en-US"
recognition.interimResults = false

recognition.onresult = async (event) => {

  const userText = event.results[0][0].transcript

  addUserMessage(userText)
  setStatus("Thinking...")

  const reply = await getGeminiReply(userText)

  addAIMessage(reply)
  setStatus("Speaking...")

  speak(reply)
}

document.getElementById('speak-btn')?.addEventListener('click', () => {
  try { recognition.stop() } catch {}
  setTimeout(() => recognition.start(), 300)
})

// ---------------- TTS + AUDIO ANALYSIS ----------------
let audioContext = null
let analyser = null
let dataArray = null
let currentAudio = null
let sourceNode = null

async function speak(text) {

  try {

    const response = await fetch("http://localhost:3000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }

    const audio = new Audio(url)
    currentAudio = audio

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // Important: disconnect old source
    if (sourceNode) {
      sourceNode.disconnect()
    }

    sourceNode = audioContext.createMediaElementSource(audio)

    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    dataArray = new Uint8Array(analyser.frequencyBinCount)

    sourceNode.connect(analyser)
    analyser.connect(audioContext.destination)

    audio.onplay = () => speaking = true
    audio.onended = () => {
  speaking = false
  currentVrm?.expressionManager.setValue('aa', 0)
  setStatus("Ready")
}

    await audio.play()

  } catch (err) {
    console.error(err)
    speaking = false
  }
}

// ---------------- ANIMATION ----------------
function animate() {

  requestAnimationFrame(animate)

  if (currentVrm) {

    time += 0.02
    blinkTimer += 0.02

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

    // ---- BREATHING ----
    const spine = humanoid.getRawBoneNode('spine')
    const head = humanoid.getRawBoneNode('head')

    if (spine) {
      spine.rotation.x = Math.sin(time * 0.7) * 0.04
      spine.rotation.y = Math.sin(time * 0.4) * 0.05
    }

    // ---- BLINKING ----
    if (blinkTimer > 3 + Math.random() * 2) {
      currentVrm.expressionManager.setValue('blink', 1)
    }
    if (blinkTimer > 3.2) {
      currentVrm.expressionManager.setValue('blink', 0)
      blinkTimer = 0
    }

    // ---- TALKING (Real Audio Sync + Smooth + Head Nod) ----
    if (speaking && analyser && dataArray) {

      analyser.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }

      const volume = sum / dataArray.length
      const target = Math.min(volume / 70, 1)

      const current = currentVrm.expressionManager.getValue('aa') || 0
      const smoothed = current + (target - current) * 0.3

      currentVrm.expressionManager.setValue('aa', smoothed)

      if (head) {
        head.rotation.x = smoothed * 0.1
      }

    } else {
      currentVrm.expressionManager.setValue('aa', 0)
      if (head) head.rotation.x = 0
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