export interface ScriptScene {
  sceneId: string;
  type: string;
  visual: {
    description: string;
    elements: string[];
  };
  narration: {
    text: string;
    keyPoints: string[];
    steps: string[];
  };
  duration: number;
  platform: Record<string, unknown>;
}

export interface ScriptStructure {
  scenes: ScriptScene[];
} 