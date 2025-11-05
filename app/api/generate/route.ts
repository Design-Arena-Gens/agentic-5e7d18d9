import { NextRequest } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

function getReplicate(): Replicate | null {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;
  return new Replicate({ auth: token });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string | undefined = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'prompt' in request body" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const replicate = getReplicate();
    if (!replicate) {
      return new Response(
        JSON.stringify({
          error:
            "Missing REPLICATE_API_TOKEN. Set it in your environment to enable image generation.",
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Using a widely available text-to-image model on Replicate
    // If access is restricted for a model in your account, adjust the identifier below.
    const model = "black-forest-labs/flux-1.1-pro"; // fallback: try flux dev if needed

    const output = (await replicate.run(model, {
      input: {
        prompt,
        num_inference_steps: 30,
        guidance: 3.5,
        width: 1024,
        height: 768,
        // Safety: non-NSFW scene
        safety_tolerance: 2,
      },
    })) as unknown;

    return new Response(
      JSON.stringify({ output }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("/api/generate POST error", error);
    return new Response(
      JSON.stringify({ error: "Generation failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
