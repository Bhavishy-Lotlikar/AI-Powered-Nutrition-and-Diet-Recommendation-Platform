import express from "express"
import fetch from "node-fetch"

const router = express.Router()

router.post("/", async (req, res) => {

  const { text } = req.body

  try {
    const response = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-2-arcas-en",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error("Deepgram error:", err)
      return res.status(500).json({ error: "TTS failed" })
    }

    const audioBuffer = await response.arrayBuffer()

    res.set("Content-Type", "audio/mpeg")
    res.send(Buffer.from(audioBuffer))

  } catch (err) {
    console.error("TTS server error:", err)
    res.status(500).json({ error: "TTS failed" })
  }

})

export default router