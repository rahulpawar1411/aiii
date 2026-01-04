import { useState, useRef } from "react";

const WEBHOOK =
  "https://soguz123.app.n8n.cloud/webhook/8cc44306-4141-4836-9320-5038bca12cea/chat";

export default function VoiceAIAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const sessionId = useRef("session-" + Math.random().toString(36).slice(2));

  const add = (text, type) =>
    setMessages((m) => [...m, { text, type }]);

  /* ---------------- TEXT SEND ---------------- */
  const sendText = async () => {
    if (!input.trim()) return;

    const userText = input;
    add(userText, "user");
    setInput("");

    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId.current,
        chatInput: userText
      })
    });

    handleResponse(await res.json());
  };

  /* ---------------- VOICE RECORD ---------------- */
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorder.current.ondataavailable = (e) =>
      audioChunks.current.push(e.data);

    mediaRecorder.current.onstop = sendAudio;
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const sendAudio = async () => {
    const blob = new Blob(audioChunks.current, { type: "audio/webm" });
    add("🎤 Voice message", "user");

    const formData = new FormData();
    formData.append("audioData", blob);
    formData.append("sessionId", sessionId.current);

    const res = await fetch(WEBHOOK, {
      method: "POST",
      body: formData
    });

    handleResponse(await res.json());
  };

  /* ---------------- HANDLE AI RESPONSE ---------------- */
  const handleResponse = (data) => {
    if (data.output) {
      add(data.output, "bot");
    }

    if (data.audioData) {
      const audio = new Audio(
        `data:audio/mpeg;base64,${data.audioData}`
      );
      audio.play();
    }

    if (!data.output && !data.audioData) {
      add("⚠️ Empty AI response", "bot");
    }
  };

  return (
    <div style={styles.box}>
      <h3>🤖 Voice AI Agent</h3>

      <div style={styles.msgs}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              background: m.type === "user" ? "#2563eb" : "#1e293b",
              marginLeft: m.type === "user" ? "auto" : 0
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div style={styles.row}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or use mic..."
        />
        <button onClick={sendText}>Send</button>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          style={{
            background: recording ? "#dc2626" : "#16a34a"
          }}
        >
          🎤
        </button>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  box: {
    width: "100%",
    maxWidth: 420,
    background: "#020617",
    padding: 16,
    borderRadius: 14,
    color: "white",
    margin: "auto"
  },
  msgs: {
    height: 340,
    overflowY: "auto",
    marginBottom: 10
  },
  msg: {
    padding: 10,
    margin: "6px 0",
    borderRadius: 10,
    maxWidth: "85%"
  },
  row: {
    display: "flex",
    gap: 6
  }
};
