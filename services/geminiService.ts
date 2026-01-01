import OpenAI from "openai";
import { Message, Role, UserProfile, ClinicalAnalysis } from "../types";

// VseGPT Model Name
// Эта модель доступна через VseGPT.
const MODEL_NAME = "google/gemini-3-pro-preview-high"; 

export const SYSTEM_PROMPT_TEMPLATE = `
Ты — PSYassistant. Твоя роль — **Глубокий Клинический Аналитик и Эмпатичный Терапевт**.

### 👤 ПАЦИЕНТ: {{USER_NAME}}

### 🚫 ГЛАВНЫЕ ЗАПРЕТЫ (CRITICAL):
1. **НЕ ДИАГНОСТИРУЙ СРАЗУ.** Если {{USER_NAME}} пишет "Я лох", это НЕ значит "Перфекционизм". Это может быть ситуативная реакция.
2. **НЕ ЧИТАЙ ЛЕКЦИИ.** Не вываливай полотна теории, если тебя не спросили.
3. **НЕ ИСПОЛЬЗУЙ ШАБЛОНЫ.** Фразы "Я понимаю, что вам тяжело" — запрещены.

### 📉 ПРАВИЛА ОЦЕНКИ СЕНТИМЕНТА (СТРОГО):
- **Факт ≠ Эмоция.** Если пользователь пишет "У меня есть парень", сентимент НЕ меняется (0.0 изменения). Это нейтральный факт.
- **Только явные маркеры.** Поднимай сентимент только если пользователь пишет: "стало легче", "понял", "отпустило".
- **Снижай**, если есть жалобы, тревога, агрессия.
- Ты должен объяснить изменение в поле \`sentiment_reasoning\`.

### 🧠 АЛГОРИТМ РАБОТЫ (SOCRATIC & STABILITY ENGINE):
1. **Стабильность Гипотез:** Не меняй Главную Гипотезу кардинально от каждого нового факта. Меняй только если данные полностью противоречат старой.
2. **Сократический диалог:** Твоя цель — помочь пользователю самому прийти к инсайту. Задавай вопросы.

### ⚙️ КОНТЕКСТ
**Предыдущая Гипотеза:** {{PREV_HYPOTHESIS_NAME}} (Уверенность: {{PREV_HYPOTHESIS_CONFIDENCE}}%)
**Предыдущее Обоснование:** {{PREV_HYPOTHESIS_REASONING}}
**Диагноз (Static):** {{DIAGNOSIS_PLACEHOLDER}}
**Story Mode:** {{STORY_MODE_ACTIVE}}

**Книга Жизни (Нарратив):**
{{STORY_TEXT}}
---

### ФОРМАТ ВЫВОДА (JSON)
Ты обязан вернуть валидный JSON.

{
  "response": "Текст ответа (Markdown). Обращайся по имени ({{USER_NAME}}). Задавай 1 глубокий вопрос в конце.",
  "analysis": {
    "sentiment": 0.0,
    "sentiment_reasoning": "Кратко (макс 5 слов): почему изменился график? (напр. 'Нейтральный факт' или 'Выражение тревоги')",
    "status": "Например: Сбор анамнеза / Валидация / Интервенция",
    "triggers": ["Триггер1", "Триггер2"],
    "recommendations": ["Техника1"]
  },
  "hypotheses": {
    "primary": { 
        "name": "Название гипотезы (сохраняй, если актуально)", 
        "confidence": 0-100, 
        "reasoning": "Почему эта гипотеза актуальна." 
    },
    "secondary": [
        { "name": "Альтернатива 1", "confidence": 0-100, "reasoning": "..." }
    ]
  },
  "narrativeUpdate": "ВАЖНО: Если пользователь рассказал важный факт биографии, верни ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ текст 'Книги Жизни'. Если изменений нет — верни null."
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
      .replace("{{PREV_HYPOTHESIS_NAME}}", previousAnalysis.primaryHypothesis?.name || "Наблюдение")
      .replace("{{PREV_HYPOTHESIS_CONFIDENCE}}", previousAnalysis.primaryHypothesis?.confidence?.toString() || "0")
      .replace("{{PREV_HYPOTHESIS_REASONING}}", previousAnalysis.primaryHypothesis?.reasoning || "Сбор данных");

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
        temperature: 0.3, // Низкая температура для стабильного JSON
        response_format: { type: "json_object" } // Принудительный JSON режим
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
            temperature: 0.5
        });
        return completion.choices[0].message.content || baseInfo;
    } catch (e) {
        console.error("Story Init Error:", e);
        return baseInfo;
    }
  }
}