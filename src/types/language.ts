export type LANGUAGE_CODES = 'en-US' | 'es-ES' | 'pt-BR';

export type LanguageConfig = {
  code: LANGUAGE_CODES;
  displayName: string;
  systemPrompt: string;
};

export const LANGUAGES: Record<LANGUAGE_CODES, LanguageConfig> = {
  'en-US': {
    code: 'en-US',
    displayName: 'American English',
    systemPrompt: 'Respond in clear American English. Make sure to use the correct grammar and punctuation.'
  },
  'es-ES': {
    code: 'es-ES',
    displayName: 'Spanish',
    systemPrompt: 'Responde en español claro. Asegúrate de usar la gramática y puntuación correcta.'
  },
  'pt-BR': {
    code: 'pt-BR',
    displayName: 'Brazilian Portuguese',
    systemPrompt: 'Responda em português brasileiro claro. Tenha cuidado com a gramática e a pontuação.'
  }
}; 