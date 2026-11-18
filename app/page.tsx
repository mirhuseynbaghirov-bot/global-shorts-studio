"use client";

import { useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080b09",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "Arial"
    }}>
      <h1 style={{ color: "#a3e6b9", fontSize: 36 }}>
        GLOBAL SHORTS STUDIO
      </h1>

      <p>Bir mövzu yaz. Qalanını sistem hazırlasın.</p>

      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Video mövzusunu yaz..."
        style={{
          width: "100%",
          maxWidth: 500,
          padding: 16,
          borderRadius: 10,
          background: "#101713",
          color: "white",
          minHeight: 100
        }}
      />

      <button
        onClick={() => alert("Studio hazırlanır...")}
        style={{
          marginTop: 16,
          padding: 16,
          background: "#a3e6b9",
          border: 0,
          borderRadius: 8,
          fontWeight: "bold"
        }}
      >
        SHORT YARAT
      </button>
    </main>
  );
}
