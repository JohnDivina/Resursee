export interface PlantDiagnosisResult {
  id: string;
  timestamp: string;
  plantName: string;
  scientificName: string;
  plantType: string;
  isHealthy: boolean;
  primaryDiagnosis: string;
  pathogenType: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutrient' | 'environmental' | 'healthy';
  confidenceScore: number; // 0 to 100
  severity: 'healthy' | 'mild' | 'moderate' | 'severe';
  summary: string;
  visualSymptoms: string[];
  affectedParts: string[];
  causes: string[];
  organicTreatments: {
    title: string;
    instructions: string;
    materials: string[];
    timeline: string;
  }[];
  chemicalTreatments: {
    title: string;
    activeIngredients: string[];
    instructions: string;
    safetyPrecautions: string;
  }[];
  preventionTips: string[];
  imageUrl?: string;
  modelUsed?: string;
}

export interface PlantChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface SamplePlant {
  id: string;
  name: string;
  issue: string;
  category: string;
  severity: 'healthy' | 'mild' | 'moderate' | 'severe';
  imageUrl: string;
  description: string;
}
