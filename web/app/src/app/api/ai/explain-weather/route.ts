import { NextResponse } from "next/server";
import { buildPromptFromForecast } from "@/lib/buildWeatherPrompt";

const API_KEY = process.env.GROQ_API_KEY!;
const BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

export async function POST(req: Request) {
  try {
    const body = await req.json();
     
    const prompt = buildPromptFromForecast(body);


    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "Você é uma IA meteorologista. Explique os dados do clima em inglês de forma clara e simples.",
          },
          {
            role: "user",
            content: `Explique estes dados de clima: ${JSON.stringify(prompt)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro Groq:", errorText);
      return NextResponse.json(
        { error: `Erro da API Groq: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content?.trim() || "Sem resposta da IA";

    return NextResponse.json({ explanation: text });
  } catch (error: any) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}