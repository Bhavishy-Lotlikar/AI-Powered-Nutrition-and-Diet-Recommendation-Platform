import { getGeminiReply } from "./api"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

let currentVrm = null
let speaking = false
let time = 0
let blinkTimer = 0
let gesturePhase = 0        // cycles through gesture poses while speaking
let currentVolume = 0       // smoothed audio volume for gesture intensity

/* ================= LERP HELPER ================= */

function lerp(current, target, factor) {
  return current + (target - current) * factor
}

/* ================= OVERLAY TEXT FUNCTIONS ================= */

function setHeard(text) {
  document.getElementById("heard-text").textContent = text
}

function setReply(text) {
  document.getElementById("reply-text").textContent = text
}

function setStatus(text) {
  document.getElementById("chat-status").textContent = text
}

/* ================= SCENE ================= */

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

/* ================= LOAD MODEL ================= */

const loader = new GLTFLoader()
loader.register(parser => new VRMLoaderPlugin(parser))

loader.load('/assets/doctor.vrm', (gltf) => {
  currentVrm = gltf.userData.vrm
  scene.add(currentVrm.scene)
})

/* ================= SPEECH RECOGNITION ================= */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const recognition = new SpeechRecognition()

recognition.lang = "en-US"
recognition.interimResults = false

recognition.onstart = () => {
  setStatus("Listening...")
}

recognition.onresult = async (event) => {

  const userText = event.results[0][0].transcript

  setHeard(userText)
  setReply("")
  setStatus("Thinking...")

  const reply = await getGeminiReply(userText)

  setReply(reply)
  setStatus("Speaking...")

  speak(reply)
}

recognition.onerror = () => {
  setStatus("Error")
}

document.getElementById('speak-btn')?.addEventListener('click', () => {
  try { recognition.stop() } catch { }
  setTimeout(() => recognition.start(), 300)
})

/* ================= TTS + AUDIO ANALYSIS ================= */

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
    setStatus("TTS Error")
  }
}

/* ================= TRACKED BONE STATE ================= */
/*
 * vrm.update() resets all bone rotations every frame.
 * If we read bone.rotation for lerp, we always start from 0 → T-pose.
 * Fix: track rotation state in JS, lerp those, then SET bones.
 */

const boneState = {}

function getState(name, axis, defaultVal) {
  const key = name + '_' + axis
  if (boneState[key] === undefined) boneState[key] = defaultVal !== undefined ? defaultVal : 0
  return boneState[key]
}

function setState(name, axis, value) {
  boneState[name + '_' + axis] = value
}

function lerpState(name, axis, target, factor) {
  const current = getState(name, axis)
  const result = lerp(current, target, factor)
  setState(name, axis, result)
  return result
}

// Idle finger curl — relaxed, slightly closed hand
const IDLE_FINGER_CURL = 0.25
// Speaking finger extension — more open hand for gestures
const GESTURE_FINGER_OPEN = -0.05

// Names of proximal finger bones
const LEFT_FINGER_BONES = [
  'leftThumbProximal',
  'leftIndexProximal',
  'leftMiddleProximal',
  'leftRingProximal',
  'leftLittleProximal'
]
const RIGHT_FINGER_BONES = [
  'rightThumbProximal',
  'rightIndexProximal',
  'rightMiddleProximal',
  'rightRingProximal',
  'rightLittleProximal'
]

// Intermediate finger bones for deeper curl
const LEFT_FINGER_INTERMEDIATE = [
  'leftThumbDistal',
  'leftIndexIntermediate',
  'leftMiddleIntermediate',
  'leftRingIntermediate',
  'leftLittleIntermediate'
]
const RIGHT_FINGER_INTERMEDIATE = [
  'rightThumbDistal',
  'rightIndexIntermediate',
  'rightMiddleIntermediate',
  'rightRingIntermediate',
  'rightLittleIntermediate'
]

function setFingerCurl(humanoid, boneNames, curlAmount, lerpFactor) {
  for (const name of boneNames) {
    const bone = humanoid.getRawBoneNode(name)
    if (bone) {
      bone.rotation.z = lerpState(name, 'z', curlAmount, lerpFactor)
    }
  }
}

function setPointingPose(humanoid, side, lerpFactor) {
  const proxBones = side === 'left' ? LEFT_FINGER_BONES : RIGHT_FINGER_BONES
  const interBones = side === 'left' ? LEFT_FINGER_INTERMEDIATE : RIGHT_FINGER_INTERMEDIATE

  for (let i = 0; i < proxBones.length; i++) {
    const isIndex = i === 1
    const proxBone = humanoid.getRawBoneNode(proxBones[i])
    const interBone = humanoid.getRawBoneNode(interBones[i])

    if (proxBone) {
      const target = isIndex ? 0 : 0.5
      proxBone.rotation.z = lerpState(proxBones[i], 'z', target, lerpFactor)
    }
    if (interBone) {
      const target = isIndex ? 0 : 0.4
      interBone.rotation.z = lerpState(interBones[i], 'z', target, lerpFactor)
    }
  }
}

/* ================= ANIMATION LOOP ================= */

function animate() {

  requestAnimationFrame(animate)

  if (currentVrm) {

    time += 0.02
    blinkTimer += 0.02

    currentVrm.update(0.016)

    const humanoid = currentVrm.humanoid

    /* ---- GET ALL BONES ---- */
    const lUpper = humanoid.getRawBoneNode('leftUpperArm')
    const rUpper = humanoid.getRawBoneNode('rightUpperArm')
    const lLower = humanoid.getRawBoneNode('leftLowerArm')
    const rLower = humanoid.getRawBoneNode('rightLowerArm')
    const lHand = humanoid.getRawBoneNode('leftHand')
    const rHand = humanoid.getRawBoneNode('rightHand')
    const spine = humanoid.getRawBoneNode('spine')
    const head = humanoid.getRawBoneNode('head')

    /* ---- BREATHING ---- */
    if (spine) {
      spine.rotation.x = Math.sin(time * 0.7) * 0.04
      spine.rotation.y = Math.sin(time * 0.4) * 0.05
    }

    /* ---- BLINK ---- */
    if (blinkTimer > 3 + Math.random() * 2) {
      currentVrm.expressionManager.setValue('blink', 1)
    }
    if (blinkTimer > 3.2) {
      currentVrm.expressionManager.setValue('blink', 0)
      blinkTimer = 0
    }

    /* ---- COMPUTE AUDIO VOLUME ---- */
    let volume = 0
    if (speaking && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      volume = sum / dataArray.length
    }
    currentVolume = lerp(currentVolume, volume, 0.15)
    const normalizedVol = Math.min(currentVolume / 70, 1)

    /* ---- LIP SYNC ---- */
    if (speaking && analyser && dataArray) {
      const target = normalizedVol
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

    /* ============================================================
       HAND ANIMATIONS — natural, human-like motion
       Uses tracked state so vrm.update() resets don't break lerp.
       ============================================================ */
    const S = 0.06   // base lerp speed — slow enough for smooth feel
    const SF = 0.04  // finger lerp speed — even slower for organic feel

    // Per-finger idle curl amounts (human hands: pinky curls most, index least)
    const IDLE_CURLS = [0.15, 0.18, 0.25, 0.32, 0.38]  // thumb→little
    const IDLE_INTER_CURLS = [0.10, 0.12, 0.18, 0.24, 0.30]

    if (speaking) {
      /* ---- SPEAKING: organic, varied gestures ---- */
      gesturePhase += 0.012  // slow cycle through gesture types

      const vol = normalizedVol
      const intensity = 0.25 + vol * 0.75

      // Three gesture types that blend in and out
      // gestureType cycles slowly: 0→1→2→0 over ~17 seconds
      const gestureType = (Math.sin(gesturePhase * 0.37) + 1) / 2  // 0..1 primary
      const gestureAlt = (Math.sin(gesturePhase * 0.23 + 2) + 1) / 2  // secondary offset

      // Micro-motion: layered sine waves at different frequencies for organic feel
      const micro1 = Math.sin(time * 1.1) * 0.03
      const micro2 = Math.sin(time * 0.7 + 0.5) * 0.02
      const micro3 = Math.sin(time * 1.7 + 1.2) * 0.015

      // === LEFT ARM: primary explaining hand ===
      // Blend between: resting position → raised explaining → extended presenting
      const lArmLift = gestureType * intensity * 0.6  // how much to raise arm
      const lArmOut = gestureAlt * intensity * 0.3    // how much to extend outward

      if (lUpper) {
        lUpper.rotation.z = lerpState('lUpperArm', 'z', -1.45 + lArmLift + micro1, S)
        lUpper.rotation.x = lerpState('lUpperArm', 'x', 0.05 + lArmOut + micro2, S)
        lUpper.rotation.y = lerpState('lUpperArm', 'y', micro3 * intensity, S)
      }
      if (lLower) {
        // Forearm bends more when arm is raised (natural)
        const lElbowBend = -0.05 + lArmLift * (-0.5) + gestureAlt * intensity * (-0.15)
        lLower.rotation.x = lerpState('lLowerArm', 'x', lElbowBend + micro2, S)
      }
      if (lHand) {
        // Wrist tilts for explaining gesture — palm-up presenting
        const palmUp = gestureType * intensity * (-0.35)
        const wristTwist = Math.sin(time * 0.9) * 0.06 * intensity
        lHand.rotation.x = lerpState('lHand', 'x', palmUp + micro1, S)
        lHand.rotation.z = lerpState('lHand', 'z', wristTwist + micro3, S)
      }

      // Left fingers: open palm when gesturing, relaxed curl when resting
      for (let i = 0; i < LEFT_FINGER_BONES.length; i++) {
        const openAmount = gestureType * intensity
        // Each finger opens differently — pinky lags, index leads
        const fingerDelay = i * 0.08
        const fingerOpen = Math.max(0, openAmount - fingerDelay)
        const proxTarget = lerp(IDLE_CURLS[i], -0.05, fingerOpen)
        const interTarget = lerp(IDLE_INTER_CURLS[i], -0.02, fingerOpen * 0.8)

        const proxBone = humanoid.getRawBoneNode(LEFT_FINGER_BONES[i])
        const interBone = humanoid.getRawBoneNode(LEFT_FINGER_INTERMEDIATE[i])
        if (proxBone) proxBone.rotation.z = lerpState(LEFT_FINGER_BONES[i], 'z', proxTarget, SF)
        if (interBone) interBone.rotation.z = lerpState(LEFT_FINGER_INTERMEDIATE[i], 'z', interTarget, SF)
      }

      // === RIGHT ARM: secondary emphasis/pointing hand ===
      const rArmLift = gestureAlt * intensity * 0.45
      const rArmOut = gestureType * intensity * 0.2

      if (rUpper) {
        rUpper.rotation.z = lerpState('rUpperArm', 'z', 1.45 - rArmLift - micro2, S)
        rUpper.rotation.x = lerpState('rUpperArm', 'x', 0.05 + rArmOut + micro3, S)
        rUpper.rotation.y = lerpState('rUpperArm', 'y', -micro1 * intensity, S)
      }
      if (rLower) {
        const rElbowBend = -0.05 + rArmLift * (-0.45) + gestureType * intensity * (-0.1)
        rLower.rotation.x = lerpState('rLowerArm', 'x', rElbowBend + micro1, S)
      }
      if (rHand) {
        const rPalmTilt = gestureAlt * intensity * (-0.25)
        const rWristTwist = Math.sin(time * 1.1 + 0.8) * 0.05 * intensity
        rHand.rotation.x = lerpState('rHand', 'x', rPalmTilt + micro2, S)
        rHand.rotation.z = lerpState('rHand', 'z', rWristTwist + micro1, S)
      }

      // Right fingers: emphasis pointing when alt cycle is high
      for (let i = 0; i < RIGHT_FINGER_BONES.length; i++) {
        const emphasisAmount = gestureAlt * intensity
        let proxTarget, interTarget
        if (emphasisAmount > 0.5 && i === 1) {
          // Index finger extends for pointing
          proxTarget = lerp(IDLE_CURLS[i], -0.02, emphasisAmount)
          interTarget = lerp(IDLE_INTER_CURLS[i], 0.0, emphasisAmount)
        } else if (emphasisAmount > 0.5) {
          // Other fingers curl more for pointing contrast
          proxTarget = lerp(IDLE_CURLS[i], IDLE_CURLS[i] + 0.2, emphasisAmount)
          interTarget = lerp(IDLE_INTER_CURLS[i], IDLE_INTER_CURLS[i] + 0.15, emphasisAmount)
        } else {
          // Relaxed open hand
          const openAmount = gestureType * intensity
          const fingerDelay = i * 0.06
          const fingerOpen = Math.max(0, openAmount - fingerDelay)
          proxTarget = lerp(IDLE_CURLS[i], 0.05, fingerOpen)
          interTarget = lerp(IDLE_INTER_CURLS[i], 0.02, fingerOpen * 0.7)
        }

        const proxBone = humanoid.getRawBoneNode(RIGHT_FINGER_BONES[i])
        const interBone = humanoid.getRawBoneNode(RIGHT_FINGER_INTERMEDIATE[i])
        if (proxBone) proxBone.rotation.z = lerpState(RIGHT_FINGER_BONES[i], 'z', proxTarget, SF)
        if (interBone) interBone.rotation.z = lerpState(RIGHT_FINGER_INTERMEDIATE[i], 'z', interTarget, SF)
      }

    } else {
      /* ---- IDLE: subtle, alive, human micro-movements ---- */
      gesturePhase = 0

      // Layered organic micro-motion (multiple overlapping sine waves)
      const drift1 = Math.sin(time * 0.3) * 0.02       // very slow body sway
      const drift2 = Math.sin(time * 0.5 + 0.7) * 0.015
      const drift3 = Math.sin(time * 0.8 + 1.5) * 0.01  // faster subtle twitch
      const armSwing = Math.sin(time * 0.25) * 0.03      // ultra-slow weight shift

      // Arms: natural hanging with micro-motion
      if (lUpper) {
        lUpper.rotation.x = lerpState('lUpperArm', 'x', 0.05 + drift1 + armSwing, S)
        lUpper.rotation.y = lerpState('lUpperArm', 'y', drift3, S)
        lUpper.rotation.z = lerpState('lUpperArm', 'z', -1.45 + drift2, S)
      }
      if (rUpper) {
        rUpper.rotation.x = lerpState('rUpperArm', 'x', 0.05 + drift2 - armSwing, S)
        rUpper.rotation.y = lerpState('rUpperArm', 'y', -drift3, S)
        rUpper.rotation.z = lerpState('rUpperArm', 'z', 1.45 - drift1, S)
      }

      // Forearms: very slight natural bend
      if (lLower) lLower.rotation.x = lerpState('lLowerArm', 'x', -0.05 + drift3, S)
      if (rLower) rLower.rotation.x = lerpState('rLowerArm', 'x', -0.05 - drift3, S)

      // Wrists: alive, subtle rotation that differs between hands
      if (lHand) {
        lHand.rotation.x = lerpState('lHand', 'x', drift1 * 2 + drift3, S)
        lHand.rotation.z = lerpState('lHand', 'z', drift2 + Math.sin(time * 0.6) * 0.02, S)
      }
      if (rHand) {
        rHand.rotation.x = lerpState('rHand', 'x', drift2 * 2 - drift3, S)
        rHand.rotation.z = lerpState('rHand', 'z', -drift1 + Math.sin(time * 0.45 + 1) * 0.02, S)
      }

      // Per-finger curl: each finger has its own natural curl + micro-movement
      for (let i = 0; i < LEFT_FINGER_BONES.length; i++) {
        // Each finger has a slightly different oscillation phase and amount
        const fingerMicro = Math.sin(time * (0.3 + i * 0.1) + i * 1.2) * 0.03
        const proxTarget = IDLE_CURLS[i] + fingerMicro
        const interTarget = IDLE_INTER_CURLS[i] + fingerMicro * 0.6

        const lProx = humanoid.getRawBoneNode(LEFT_FINGER_BONES[i])
        const lInter = humanoid.getRawBoneNode(LEFT_FINGER_INTERMEDIATE[i])
        const rProx = humanoid.getRawBoneNode(RIGHT_FINGER_BONES[i])
        const rInter = humanoid.getRawBoneNode(RIGHT_FINGER_INTERMEDIATE[i])

        // Offset the right hand's micro-motion so they don't move in sync
        const rFingerMicro = Math.sin(time * (0.3 + i * 0.1) + i * 1.2 + 2.5) * 0.03
        const rProxTarget = IDLE_CURLS[i] + rFingerMicro
        const rInterTarget = IDLE_INTER_CURLS[i] + rFingerMicro * 0.6

        if (lProx) lProx.rotation.z = lerpState(LEFT_FINGER_BONES[i], 'z', proxTarget, SF)
        if (lInter) lInter.rotation.z = lerpState(LEFT_FINGER_INTERMEDIATE[i], 'z', interTarget, SF)
        if (rProx) rProx.rotation.z = lerpState(RIGHT_FINGER_BONES[i], 'z', rProxTarget, SF)
        if (rInter) rInter.rotation.z = lerpState(RIGHT_FINGER_INTERMEDIATE[i], 'z', rInterTarget, SF)
      }
    }
  }

  renderer.render(scene, camera)
}

animate()

/* ================= RESIZE ================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})