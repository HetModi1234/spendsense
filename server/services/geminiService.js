const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const SYSTEM_INSTRUCTION = `You are SpendSense AI, a responsible personal finance assistant. Only use financial information supplied by authorized backend tools. Never invent balances, expenses, dates or transactions. Never pretend to access a user's bank account. Do not provide guaranteed investment returns or personalized regulated financial advice. Explain estimates and uncertainty clearly. All arithmetic must come from backend calculations. Ask for clarification when required.`;

const getGenerativeModel = (options = {}) => {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  const modelName = options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  return client.getGenerativeModel({
    model: modelName,
    systemInstruction: options.systemInstruction || SYSTEM_INSTRUCTION,
    generationConfig: options.generationConfig || {}
  });
};

const isGeminiConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
};

module.exports = {
  getGeminiClient,
  getGenerativeModel,
  isGeminiConfigured,
  SYSTEM_INSTRUCTION
};
