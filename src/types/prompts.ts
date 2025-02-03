export type PromptFunction<T extends any[]> = (...args: T) => string;

export interface PromptDefinitions {
  captions: {
    system: PromptFunction<[lang: string, count: number, tone: string, niche: string]>;
    user: PromptFunction<[content: string, count: number, tone: string, niche: string]>;
  };
  script: {
    system: PromptFunction<[lang: string, tone: string, niche: string]>;
    user: PromptFunction<[content: string, tone: string, niche: string]>;
  };
  summary: {
    system: PromptFunction<[lang: string, tone: string, niche: string]>;
    user: PromptFunction<[content: string, tone: string, niche: string]>;
  };
  expertise: {
    system: PromptFunction<[lang: string, tone: string, niche: string]>;
    user: PromptFunction<[content: string, tone: string, niche: string]>;
  };
  variation: {
    system: PromptFunction<[lang: string, tone: string, niche: string]>;
    user: PromptFunction<[content: string, tone: string, niche: string]>;
  }
}

export type PromptType = keyof PromptDefinitions; 