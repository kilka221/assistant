import OpenAI from "openai";
import { Message, Role, UserProfile, ClinicalAnalysis } from "../types";

// VseGPT Model Name
// Эта модель доступна через VseGPT.
const MODEL_NAME = "google/gemini-3-pro-preview-high"; 

export const SYSTEM_PROMPT_TEMPLATE = `
Ты — PSYassistant. Твоя роль — **Структурный Ментор и Аналитик Реальности**.

### 🎯 ТВОЯ ЦЕЛЬ
Твоя задача — не "утешать", а **раскладывать хаос в голове пользователя по полочкам**. Пользователь ценит четкость, логику и отсутствие "воды".

### 💎 СТИЛЬ ОБЩЕНИЯ (СТРОГО):
1. **СТРУКТУРА ПРЕВЫШЕ ВСЕГО.** Используй нумерованные списки (1., 2., 3.) и Markdown заголовки.
2. **ЖИРНЫЙ ШРИФТ.** Выделяй **главные мысли** и **инсайты** жирным. Глаз должен цепляться за суть.
3. **РЕФРЕЙМИНГ.** Если пользователь видит проблему, покажи ему, почему это на самом деле победа или ресурс. (Пример: "Потратил деньги" -> "Купил качественные эмоции").
4. **БЕЗ "ВОДЫ".** Запрещены фразы: "Я понимаю ваши чувства", "Это очень важно", "Давайте обсудим". Сразу к делу.
5. **МЕТАФОРЫ.** Используй яркие, мужские или технические метафоры (инвестиции, левел-ап, архитектура, битва).

### 👤 ПАЦИЕНТ: {{USER_NAME}}

### 🧠 АЛГОРИТМ АНАЛИЗА:
1. **Разбор ситуации:** Выдели 2-3 ключевых факта из рассказа.
2. **Анализ (Вердикт):** Дай оценку действиям пользователя. Если он красавчик — скажи это. Если тупит — мягко, но четко укажи на ошибку мышления.
3. **Синтез:** Собери это в позитивную картину будущего.

### ⚙️ КОНТЕКСТ
**Предыдущая Гипотеза:** {{PREV_HYPOTHESIS_NAME}}
**Диагноз:** {{DIAGNOSIS_PLACEHOLDER}}
**Story Mode:** {{STORY_MODE_ACTIVE}}

**Книга Жизни (Нарратив):**
{{STORY_TEXT}}
---

### ФОРМАТ ВЫВОДА (JSON)
Ты обязан вернуть валидный JSON.

{
  "response": "Твой ответ в формате Markdown. Используй списки, **жирный текст** и четкую структуру. Будь как умный друг, который раскладывает все по фактам.",
  "analysis": {
    "sentiment": 0.0,
    "sentiment_reasoning": "Кратко (макс 5 слов): причина смены графика (напр. 'Конструктивный инсайт')",
    "status": "Например: Рефрейминг / Структурирование / Анализ",
    "triggers": ["Триггер1"],
    "recommendations": ["Конкретный совет"]
  },
  "hypotheses": {
    "primary": { 
        "name": "Название гипотезы", 
        "confidence": 0-100, 
        "reasoning": "Краткое обоснование." 
    },
    "secondary": []
  },
  "narrativeUpdate": "Если есть новые важные факты биографии — верни обновленный текст истории. Иначе null."
}
`;

export class GeminiService {
  private client: OpenAI;

  constructor() {
    // Логика получения ключа VseGPT
    // 1. Vite Environment (Vercel / Local)
    // 2. Process Env (Node.js fallback)
    let apiKey = '';
    
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            apiKey = import.meta.env.VITE_API_KEY;
        }
    } catch (e) {
        // Игнорируем ошибки доступа к import.meta
    }

    if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || '';
    }

    // Инициализация OpenAI клиента, но с адресом VseGPT
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.vsegpt.ru/v1", // Базовый URL VseGPT
      dangerouslyAllowBrowser: true // Разрешаем работу в браузере
    });
  }

  async sendMessage(
    history: Message[],
    newMessage: string,
    profile: UserProfile,
    userName: string,
    previousAnalysis: ClinicalAnalysis
  ): Promise<any> {
    
    // Подготовка промпта
    let finalSystemPrompt = SYSTEM_PROMPT_TEMPLATE
      .replace(/{{USER_NAME}}/g, userName)
      .replace("{{DIAGNOSIS_PLACEHOLDER}}", profile.diagnosis ? profile.diagnosis.toUpperCase() : "Не указан")
      .replace("{{STORY_MODE_ACTIVE}}", profile.isStoryModeActive ? "ДА" : "НЕТ")
      .replace("{{STORY_TEXT}}", profile.storyText || "История пока пуста.")
      .replace("{{PREV_HYPOTHESIS_NAME}}", previousAnalysis.primaryHypothesis?.name || "Наблюдение");

    // Конвертация истории сообщений
    const messages: any[] = [
        { role: "system", content: finalSystemPrompt }
    ];

    history.forEach(m => {
        if (m.role !== Role.SYSTEM) {
            messages.push({
                role: m.role === Role.USER ? "user" : "assistant",
                content: m.content
            });
        }
    });

    messages.push({ role: "user", content: newMessage });

    try {
      const completion = await this.client.chat.completions.create({
        model: MODEL_NAME,
        messages: messages,
        temperature: 0.6, // Повышаем температуру для более "живых" и креативных ответов
        response_format: { type: "json_object" } 
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) throw new Error("Пустой ответ от AI");

      return JSON.parse(responseText);

    } catch (error) {
      console.error("VseGPT API Error:", error);
      throw error;
    }
  }

  async initializeStory(baseInfo: string): Promise<string> {
    const prompt = `
    Задача: Создать "Психологический Портрет" (Narrative Identity).
    Входные данные: "${baseInfo}"
    
    Формат:
    Используй Markdown.
    ### 1. Бэкграунд
    * **Факт**: Интерпретация
    
    ### 2. Паттерны
    ...
    `;

    try {
        const completion = await this.client.chat.completions.create({
            model: MODEL_NAME,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6
        });
        return completion.choices[0].message.content || baseInfo;
    } catch (e) {
        console.error("Story Init Error:", e);
        return baseInfo;
    }
  }
}
