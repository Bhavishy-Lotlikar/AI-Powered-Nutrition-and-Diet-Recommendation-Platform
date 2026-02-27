import express from "express"
import cors from "cors"
import chatRoute from "./routes/chat.js"
import ttsRoute from "./routes/tts.js"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/chat", chatRoute)
app.use("/tts", ttsRoute)

app.listen(3000, () => {
  console.log("Server running on port 3000")
})