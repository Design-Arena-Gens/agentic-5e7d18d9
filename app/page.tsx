"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

const DEFAULT_SUBJECT =
  "a photorealistic cinematic mid shot of an Indian royal couple inside a grand palace room lighting ghee lamps to celebrate the birth of their first child. The man lights a brass diya with devotion while the woman stands beside him smiling peacefully. The warm flicker of dozens of ghee lamps fills the space with golden light. The scene looks completely real ? live-action human faces, detailed fabrics, and realistic lighting.";

const DEFAULT_ACTION =
  "the royal man kneels slightly to light the first ghee lamp on a decorated brass stand. The woman gently holds a tray of flowers and more diyas, looking at him with joy. Several other lamps are already burning in the background, illuminating the carved stone walls and flower garlands.";

const DEFAULT_ENVIRONMENT =
  "a richly detailed Indian palace interior with stone pillars, brass lamps, and flower decorations. The floor reflects the light of the diyas. The room is filled with soft incense smoke, adding depth and atmosphere. The background shows marigold garlands and carved archways.";

export default function Home() {
  const [subject, setSubject] = useState<string>(DEFAULT_SUBJECT);
  const [action, setAction] = useState<string>(DEFAULT_ACTION);
  const [environment, setEnvironment] = useState<string>(DEFAULT_ENVIRONMENT);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const prompt = useMemo(() => {
    return [subject, action, environment]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" \n\n");
  }, [subject, action, environment]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate");
      }

      const out = data?.output;
      const url = Array.isArray(out)
        ? out[0]
        : typeof out === "string"
        ? out
        : Array.isArray(out?.images)
        ? out.images[0]
        : undefined;

      if (typeof url === "string") {
        setImageUrl(url);
      } else {
        throw new Error("No image URL returned");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function PromptCard() {
    return (
      <div
        style={{
          width: "100%",
          border: "1px solid var(--button-secondary-border)",
          borderRadius: 12,
          padding: 16,
          background:
            "linear-gradient(135deg, rgba(255,214,150,0.25) 0%, rgba(255,160,122,0.2) 50%, rgba(255,239,186,0.25) 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Subject</div>
            <textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Action</div>
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Environment</div>
            <textarea
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              rows={4}
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Generate a Photorealistic Cinematic Still</h1>
          <p>Adjust the prompt and generate a cinematic still image.</p>
        </div>

        <PromptCard />

        <div className={styles.ctas}>
          <button
            className={styles.primary as unknown as string}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Image"}
          </button>
          <button
            className={styles.secondary as unknown as string}
            onClick={() => navigator.clipboard.writeText(prompt)}
          >
            Copy Prompt
          </button>
        </div>

        {error && (
          <p style={{ color: "#b91c1c", marginTop: 16 }}>
            {error} {error.includes("REPLICATE_API_TOKEN") && " ? Using fallback preview below."}
          </p>
        )}

        <div style={{ width: "100%", marginTop: 24 }}>
          {imageUrl ? (
            <div style={{ position: "relative", width: "100%", aspectRatio: "4/3" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Generated image"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--button-secondary-border)",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed var(--button-secondary-border)",
                borderRadius: 12,
                padding: 20,
                background:
                  "radial-gradient(1000px 300px at 0% 0%, rgba(255,180,90,0.15), transparent), radial-gradient(1000px 300px at 100% 100%, rgba(255,230,180,0.15), transparent)",
              }}
            >
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                {isGenerating
                  ? "Please wait while the image is being generated..."
                  : "Generated image will appear here. If generation is disabled, use Copy Prompt to take it elsewhere."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
