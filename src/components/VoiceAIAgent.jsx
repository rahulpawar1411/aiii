import { useState, useRef, useEffect } from "react";

const WEBHOOK =
  "https://soguz123.app.n8n.cloud/webhook/8cc44306-4141-4836-9320-5038bca12cea/chat";

export default function VoiceAIAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const sessionId = useRef("session-" + Math.random().toString(36).slice(2));
  const msgsEndRef = useRef(null);

  const add = (text, type) =>
    setMessages((m) => [...m, { text, type }]);

  /* ---------------- TEXT SEND ---------------- */
  const sendText = async () => {
    if (!input.trim()) return;
    const userText = input;
    add(userText, "user");
    setInput("");

    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          chatInput: userText
        })
      });
      handleResponse(await res.json());
    } catch (err) {
      add("⚠️ Error sending message", "bot");
      console.error(err);
    }
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

    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        body: formData
      });
      handleResponse(await res.json());
    } catch (err) {
      add("⚠️ Error sending voice message", "bot");
      console.error(err);
    }
  };

  /* ---------------- HANDLE AI RESPONSE ---------------- */
  const handleResponse = (data) => {
    if (data.output) add(data.output, "bot");

    if (data.audioData) {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioData}`);
      audio.play();
    }

    if (!data.output && !data.audioData) add("⚠️ Empty AI response", "bot");
  };

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.header}>🤖 Voice AI Agent</h3>

        <div style={styles.msgs}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.msg,
                background: m.type === "user" ? "#dbeafe" : "#f1f5f9",
                color: m.type === "user" ? "#1e3a8a" : "#111827",
                marginLeft: m.type === "user" ? "auto" : 0,
                alignSelf: m.type === "user" ? "flex-end" : "flex-start"
              }}
            >
              {m.text}
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>

        <div style={styles.row}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or hold mic..."
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && sendText()}
          />
          <button onClick={sendText} style={styles.sendBtn}>
            Send
          </button>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            style={{
              ...styles.micBtn,
              background: recording ? "#ef4444" : "#10b981"
            }}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f4f8",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: 400,
    height: 500,
    background: "#ffffff",
    padding: 20,
    borderRadius: 20,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    textAlign: "center",
    color: "#111827",
    marginBottom: 10
  },
  msgs: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 8
  },
  msg: {
    padding: 12,
    borderRadius: 15,
    maxWidth: "75%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  row: {
    display: "flex",
    gap: 6,
    marginTop: 8
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
    background: "#f9fafb",
    color: "#111827"
  },
  sendBtn: {
    padding: "0 16px",
    borderRadius: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  },
  micBtn: {
    padding: "0 16px",
    borderRadius: 12,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s"
  }
};
