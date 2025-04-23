import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const MODEL_NAME = "gemini-2.0-flash-exp";

export class TranscriptionService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async transcribeAudio(audioBase64: string, mimeType: string = "audio/wav"): Promise<string> {
    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64
          }
        },
        { text: "Please transcribe the spoken language in this audio accurately. Ignore any background noise or non-speech sounds." },
      ]);

      return result.response.text();
    } catch (error: unknown) {
      console.error("Transcription error:", error);
      const errorMessage = String(error);
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        return "[Ses çevirisi için API kotası aşıldı. Lütfen daha sonra tekrar deneyin.]";
      }
      return "[Ses çevirisi şu anda yapılamıyor.]";
    }
  }
} 