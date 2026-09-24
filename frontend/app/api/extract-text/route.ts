import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";

export const runtime = "nodejs";

// Use lib/pdf-parse directly to bypass the test-file ENOENT issue in pdf-parse v1.x
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = _require("pdf-parse/lib/pdf-parse") as (
  buf: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;

export async function POST(req: NextRequest) {
  let fileName = "unknown";
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    fileName = file.name;

    // ── Plain text files ─────────────────────────────────────────────────────
    if (
      mimeType === "text/plain" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".json")
    ) {
      const text = await file.text();
      return NextResponse.json({ text, method: "text" });
    }

    // ── PDF files ─────────────────────────────────────────────────────────────
    if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await pdfParse(buffer);
        const extractedText = result.text?.trim();

        if (!extractedText || extractedText.length < 20) {
          return NextResponse.json({
            text: `[PDF: ${fileName}] — Parsed ${result.numpages} page(s) but found no extractable text. This appears to be a scanned/image-only PDF. Please use a text-based PDF or paste the content as text.`,
            pages: result.numpages,
            method: "pdf-empty",
          });
        }

        return NextResponse.json({
          text: extractedText,
          pages: result.numpages,
          method: "pdf-parse",
        });
      } catch (pdfErr: any) {
        // Return a graceful degradation — don't return 500, return the filename as a fallback
        console.warn(`pdf-parse failed for ${fileName}:`, pdfErr?.message || pdfErr);
        return NextResponse.json({
          text: `[PDF: ${fileName}] — Could not extract text (${pdfErr?.message || "parse error"}). The file may be corrupted, password-protected, or image-based. Please try a different PDF or paste the content directly.`,
          method: "pdf-error",
        });
      }
    }

    // ── Unsupported binary types ──────────────────────────────────────────────
    return NextResponse.json({
      text: `[Binary File: ${fileName}] — Format not parseable. Please upload a text-based PDF, .txt, .md, or .json file.`,
      method: "unsupported",
    });
  } catch (err: any) {
    console.error("extract-text API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
