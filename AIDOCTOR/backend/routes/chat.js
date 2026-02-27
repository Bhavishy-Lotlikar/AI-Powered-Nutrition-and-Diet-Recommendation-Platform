import express from "express"
import fetch from "node-fetch"

const router = express.Router()

router.post("/", async (req, res) => {

  const { message } = req.body

  try {

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  model: "google/gemini-2.5-flash",
  max_tokens: 200,        // 🔥 IMPORTANT
  temperature: 0.7,
  messages: [
    {
      role: "system",
      content: "You are a professional nutrition doctor. Give short, clear, helpful answers."
    },
    {
      role: "user",
      content: message
    }
  ]
})
    })

    const data = await response.json()
	console.log("OpenRouter RAW response:")
console.log(JSON.stringify(data, null, 2))

    if (!data.choices || !data.choices.length) {
      return res.json({ reply: "Sorry, I couldn't generate a response." })
    }

    const reply = data.choices[0].message.content

    res.json({ reply })

  } catch (error) {
    console.error("OpenRouter error:", error)
    res.status(500).json({ reply: "Server error." })
  }

})

export default router