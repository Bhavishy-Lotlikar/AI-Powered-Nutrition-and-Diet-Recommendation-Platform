export async function getGeminiReply(text) {
  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  })

  const data = await res.json()
  return data.reply
}

export async function getTTS(text) {
  const res = await fetch("http://localhost:3000/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })

  return await res.blob()
}