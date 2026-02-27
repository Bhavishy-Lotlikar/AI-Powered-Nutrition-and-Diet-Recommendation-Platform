import express from "express"
import fetch from "node-fetch"
import fs from "fs"

const router = express.Router()

// Load FAQ once
const faqData = JSON.parse(
  fs.readFileSync("./data/faq.json", "utf8")
)

router.post("/", async (req, res) => {

  const { message } = req.body

  const userMessage = message.toLowerCase().trim()

  // 🔎 Check FAQ first
  for (const key in faqData) {
    if (userMessage.includes(key)) {
      return res.json({ reply: faqData[key] })
    }
  }

  // 🤖 If no FAQ match → call Gemini
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    }
  )

  const data = await response.json()

  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't respond."

  res.json({ reply })
})

export default router