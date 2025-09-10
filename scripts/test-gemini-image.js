import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const apiKey =
    process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error(
      "Missing GOOGLE_API_KEY (or GEMINI_API_KEY). Set it in your shell before running."
    );
    process.exit(1);
  }

  const prompt = process.argv.slice(2).join(" ") || "Robot holding a red skateboard";

  // Default to a stable Imagen model; override to a preview image-capable model via env when available to your project.
  // Example once enabled: $env:GEMINI_IMAGE_MODEL = "gemini-2.X-flash-image-preview-###"
  const model =
    process.env.GEMINI_IMAGE_MODEL ||
    process.env.GENAI_IMAGE_MODEL ||
    "imagen-4.0-generate-001";

  const numberOfImages = Number(process.env.GENAI_IMAGE_COUNT || "1");
  const outDir = process.env.GENAI_IMAGE_OUTDIR || "generated-images";

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Single attempt only — no retries or fallbacks here.
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages,
      },
    });

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    let idx = 1;
    for (const generatedImage of response.generatedImages) {
      const imgBytesB64 = generatedImage.image.imageBytes;
      const buffer = Buffer.from(imgBytesB64, "base64");
      const filename = path.join(outDir, `${Date.now()}-${idx}.png`);
      fs.writeFileSync(filename, buffer);
      console.log(`Saved ${filename}`);
      idx++;
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error(`Image generation failed: ${message}`);
    if (err?.status === 429) {
      console.error(
        "Rate limited (429). Wait and retry later, lower request rate, or ensure the correct model/tier is enabled."
      );
    }
    process.exit(1);
  }
}

main();