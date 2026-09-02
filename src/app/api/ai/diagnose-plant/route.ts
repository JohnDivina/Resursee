import { NextRequest, NextResponse } from 'next/server';
import { PlantDiagnosisResult } from '@/types/plantDoctor';

// Rate Limiting Map for In-Memory Throttling (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 20; // 20 diagnoses per 5 mins per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Rate Limiting
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before analyzing another leaf image.',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          },
        }
      );
    }

    // 2. Parse & Validate Payload
    const body = await request.json();
    const { imageBase64, mimeType = 'image/jpeg', sampleId, customNotes } = body;

    if (!imageBase64 && !sampleId) {
      return NextResponse.json(
        { error: 'Missing image data. Please upload a photo or select a sample.' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // 3. For Custom Image Uploads or Camera Captures: MUST go through Gemini Vision API
    if (imageBase64) {
      if (!geminiApiKey) {
        return NextResponse.json(
          {
            error:
              'Gemini API Key is missing. Please add GEMINI_API_KEY to your .env.local file (and Vercel Environment Variables) to enable AI vision scanning.',
          },
          { status: 400 }
        );
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const systemPrompt = `You are Dr. Flora, an expert world-class agricultural plant pathologist and botanist.
Analyze this plant or leaf image carefully and provide a structured clinical pathology diagnosis.
You must return your analysis strictly as a valid JSON object matching this schema:
{
  "plantName": "Common plant name (e.g. Tomato)",
  "scientificName": "Scientific botanical name (e.g. Solanum lycopersicum)",
  "plantType": "Crop, Houseplant, Fruit Tree, Vegetable, etc.",
  "isHealthy": boolean,
  "primaryDiagnosis": "Diagnosis name or 'Healthy Foliage'",
  "pathogenType": "fungal" | "bacterial" | "viral" | "pest" | "nutrient" | "environmental" | "healthy",
  "confidenceScore": number (integer between 70 and 99),
  "severity": "healthy" | "mild" | "moderate" | "severe",
  "summary": "Clear 2-3 sentence overview of what is observed on the leaf",
  "visualSymptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "affectedParts": ["Leaves", "Petiole", "Stem", etc.],
  "causes": ["Primary environmental or biological cause 1", "Cause 2"],
  "organicTreatments": [
    {
      "title": "Treatment name",
      "instructions": "Specific preparation and application steps",
      "materials": ["Material 1", "Material 2"],
      "timeline": "e.g. Apply every 5-7 days until symptoms subside"
    }
  ],
  "chemicalTreatments": [
    {
      "title": "Commercial treatment name",
      "activeIngredients": ["Ingredient name"],
      "instructions": "How to mix and apply safely",
      "safetyPrecautions": "Protective equipment and harvest intervals"
    }
  ],
  "preventionTips": ["Tip 1", "Tip 2", "Tip 3"]
}
Do not include markdown ticks, preamble, or commentary outside the JSON. Return only the raw JSON.`;

      // Candidate model URLs to ensure 100% compatibility across Google AI Studio API versions
      const candidateEndpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`,
      ];

      let lastErrorMessage = '';
      let successfulData: Record<string, unknown> | null = null;

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      };

      for (const endpoint of candidateEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
          });

          if (response.ok) {
            successfulData = await response.json();
            break;
          } else {
            const errJson = await response.json().catch(() => ({}));
            lastErrorMessage =
              errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (fetchErr: unknown) {
          lastErrorMessage = fetchErr instanceof Error ? fetchErr.message : 'Network error';
        }
      }

      if (!successfulData) {
        console.error('All Gemini model endpoints failed. Last error:', lastErrorMessage);
        return NextResponse.json(
          {
            error: `AI Vision Error from Google: ${lastErrorMessage}. Please verify your GEMINI_API_KEY on Google AI Studio.`,
          },
          { status: 502 }
        );
      }

      const rawText =
        (successfulData as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
          ?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return NextResponse.json(
          { error: 'AI Vision could not generate a diagnosis from this image. Please try a clearer leaf photo.' },
          { status: 500 }
        );
      }

      const parsed = JSON.parse(rawText.trim());
      const result: PlantDiagnosisResult = {
        id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...parsed,
      };

      return NextResponse.json({ success: true, result });
    }

    // 4. Sample Test Cases (Only when explicitly clicking 1-click test samples)
    if (sampleId) {
      const diagnosis = generateExpertBotanicalDiagnosis(sampleId, customNotes);
      return NextResponse.json({
        success: true,
        result: diagnosis,
      });
    }

    return NextResponse.json({ error: 'No valid image or sample provided.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Plant Doctor API error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `Diagnosis error: ${msg}` },
      { status: 500 }
    );
  }
}

function generateExpertBotanicalDiagnosis(sampleId?: string, customNotes?: string): PlantDiagnosisResult {
  const id = `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  if (sampleId === 'sample-citrus-pest') {
    return {
      id,
      timestamp,
      plantName: 'Citrus / Lemon Tree',
      scientificName: 'Citrus limon',
      plantType: 'Fruit Tree',
      isHealthy: false,
      primaryDiagnosis: 'Citrus Leafminer Infestation',
      pathogenType: 'pest',
      confidenceScore: 94,
      severity: 'mild',
      summary:
        'Characteristic translucent, serpentine serpentine tunneling marks visible within the leaf epidermis caused by the larvae of Phyllocnistis citrella. Leaf margins exhibit slight upward curling.',
      visualSymptoms: [
        'Silvery, meandering serpentine trails inside leaf lamina',
        'Distorted, curled young terminal leaves',
        'Pupal cell formation along the curled leaf margin',
      ],
      affectedParts: ['Young tender leaves', 'New shoot flushes'],
      causes: [
        'Adult leafminer moths laying microscopic eggs on the underside of young flush foliage',
        'Warm, humid conditions accelerating larval pupation cycles (2-3 weeks)',
      ],
      organicTreatments: [
        {
          title: 'Horticultural Oil / Cold-Pressed Neem Spray',
          instructions:
            'Mix 2 tbsp of cold-pressed neem oil and 1 tsp mild Castile soap per gallon of lukewarm water. Spray thoroughly covering both upper and undersides of new leaves at dusk.',
          materials: ['Cold-pressed Neem Oil', 'Pure Castile Soap', 'Hand Pump Sprayer'],
          timeline: 'Apply every 7 to 10 days during active flush periods.',
        },
        {
          title: 'Beneficial Parasitoid Wasp Introduction',
          instructions:
            'Introduce native parasitoid wasps (Cirrospilus or Semielacher species) which naturally parasitize leafminer larvae without chemical harm.',
          materials: ['Beneficial Insect Release Pack'],
          timeline: 'Release during early spring growth flushes.',
        },
      ],
      chemicalTreatments: [
        {
          title: 'Spinosad Biological Insecticide',
          activeIngredients: ['Spinosad (0.5%)'],
          instructions:
            'Dilute 4 tbsp per gallon of water. Spray targeted foliage. Absorbs translaminarly to neutralize chewing larvae beneath the cuticle.',
          safetyPrecautions: 'Do not spray when honeybees are actively foraging on open blossoms.',
        },
      ],
      preventionTips: [
        'Avoid excessive nitrogen fertilization in late summer, which produces vulnerable succulent flushes.',
        'Prune and safely dispose of heavily mined individual leaves to break the reproductive cycle.',
        'Hang yellow or pheromone sticky traps to monitor adult moth activity.',
      ],
    };
  }

  if (sampleId === 'sample-corn-rust') {
    return {
      id,
      timestamp,
      plantName: 'Sweet Corn',
      scientificName: 'Zea mays',
      plantType: 'Cereal Grain Crop',
      isHealthy: false,
      primaryDiagnosis: 'Common Rust (Puccinia sorghi)',
      pathogenType: 'fungal',
      confidenceScore: 97,
      severity: 'severe',
      summary:
        'Elevated golden-brown to cinnamon-brown powdery pustules (uredinia) scattered densely across both upper and lower leaf surfaces. Advanced chlorosis and leaf necrosis present.',
      visualSymptoms: [
        'Oval to elongate cinnamon-brown fungal pustules',
        'Powdery fungal spores that rub off onto fingers',
        'Extensive yellowing (chlorosis) surrounding pustule clusters',
      ],
      affectedParts: ['Leaf blade', 'Leaf sheath', 'Husk bracts'],
      causes: [
        'Windblown fungal spores (urediniospores) favored by moderate temperatures (16–25°C) and high relative humidity (>95%) with free moisture on leaf surfaces.',
      ],
      organicTreatments: [
        {
          title: 'Bio-Fungicide Bacillus subtilis Spray',
          instructions:
            'Apply microbial bio-fungicide to colonize leaf surfaces and inhibit fungal spore germination and pustule spread.',
          materials: ['Bacillus subtilis inoculant', 'Surfactant sticker'],
          timeline: 'Spray every 5 days at first sign of pustules.',
        },
        {
          title: 'Liquid Copper Soap Spray',
          instructions:
            'Apply copper octanoate formulation evenly over foliage to prevent uninfected leaf areas from spore penetration.',
          materials: ['Copper octanoate liquid concentrate'],
          timeline: 'Apply every 7-10 days following rainy periods.',
        },
      ],
      chemicalTreatments: [
        {
          title: 'Triazole / Strobilurin Dual Fungicide',
          activeIngredients: ['Azoxystrobin', 'Propiconazole'],
          instructions:
            'Apply at standard agricultural dilution rates prior to silking if infection reaches upper canopy leaves.',
          safetyPrecautions: 'Observe 14-day pre-harvest interval (PHI) and wear protective mask and goggles.',
        },
      ],
      preventionTips: [
        'Select resistant hybrid corn cultivars for upcoming planting seasons.',
        'Plant early in the season to allow crops to mature before high rust spore loads arrive.',
        'Ensure wide row spacing (30+ inches) to promote rapid morning foliage drying.',
      ],
    };
  }

  if (sampleId === 'sample-healthy-basil') {
    return {
      id,
      timestamp,
      plantName: 'Sweet Basil',
      scientificName: 'Ocimum basilicum',
      plantType: 'Culinary Herb',
      isHealthy: true,
      primaryDiagnosis: 'Healthy Plant Foliage',
      pathogenType: 'healthy',
      confidenceScore: 98,
      severity: 'healthy',
      summary:
        'The plant demonstrates excellent vigor with lush emerald-green pigmentation, intact cellular turgor, balanced venation, and complete absence of pathogenic lesions or pest feeding.',
      visualSymptoms: [
        'Vibrant, uniform green leaf pigmentation',
        'Smooth leaf margins free of necrotic curling or chewing damage',
        'Healthy apical shoot growth and balanced intermodal spacing',
      ],
      affectedParts: ['None (All foliage healthy)'],
      causes: ['Balanced light, proper watering, and fertile, well-aerated soil.'],
      organicTreatments: [
        {
          title: 'Preventive Organic Liquid Kelp Nourishment',
          instructions:
            'Dilute 1 tsp organic liquid seaweed/kelp extract in 1 quart of water. Water soil monthly to promote root vigor and natural systemic disease resistance.',
          materials: ['Cold-processed Kelp Extract'],
          timeline: 'Once every 3–4 weeks.',
        },
      ],
      chemicalTreatments: [],
      preventionTips: [
        'Always water at the base of the plant to keep leaves completely dry.',
        'Pinch terminal flower buds to encourage bushy lateral leaf growth and extend harvesting.',
        'Provide 6 to 8 hours of daily direct sunlight with good ambient air circulation.',
      ],
    };
  }

  // Default: Tomato Early Blight (Most frequent agricultural pathology)
  return {
    id,
    timestamp,
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    plantType: 'Nightshade Crop / Vegetable',
    isHealthy: false,
    primaryDiagnosis: 'Early Blight (Alternaria solani)',
    pathogenType: 'fungal',
    confidenceScore: 96,
    severity: 'moderate',
    summary:
      'Characteristic dark brown to black circular lesions with distinct concentric target-board rings surrounded by a chlorotic yellow halo on mature foliage.',
    visualSymptoms: [
      'Concentric target-like brown spots on lower leaves',
      'Chlorotic yellow halos surrounding necrotic lesions',
      'Premature leaf drop and lower canopy defoliation',
    ],
    affectedParts: ['Lower mature leaves', 'Stems', 'Fruit calyx'],
    causes: [
      'Soil-borne fungus (Alternaria solani) splashing onto lower leaves during rainfall or overhead irrigation.',
      'High humidity (>85%) and warm temperatures (24–29°C) accelerating fungal spore germination.',
    ],
    organicTreatments: [
      {
        title: 'Sanitation & Lower Canopy Pruning',
        instructions:
          'Sterilize pruning shears with 70% isopropyl alcohol. Clip and safely bag all infected lower foliage touching the soil. Never compost blight-infected leaves.',
        materials: ['Pruning Shears', '70% Isopropyl Alcohol', 'Disposal Bag'],
        timeline: 'Immediately upon spotting necrotic rings.',
      },
      {
        title: 'Organic Copper Fungicide / Baking Soda Foliar Spray',
        instructions:
          'Mix 1 tbsp baking soda, 1 tsp horticultural oil, and 1/2 tsp liquid dish soap in 1 gallon of water. Spray thoroughly covering both sides of leaves in early morning.',
        materials: ['Baking Soda', 'Horticultural Oil', 'Gentle Liquid Soap'],
        timeline: 'Apply every 7 days and re-apply after heavy rainfall.',
      },
    ],
    chemicalTreatments: [
      {
        title: 'Chlorothalonil / Mancozeb Protective Fungicide',
        activeIngredients: ['Chlorothalonil (29.6%) or Mancozeb'],
        instructions:
          'Mix 1.5 fl oz per gallon of water. Spray uniformly across foliage to form a protective barrier against fungal hyphae penetration.',
        safetyPrecautions: 'Wear gloves, long sleeves, and observe a 7-day pre-harvest waiting interval.',
      },
    ],
    preventionTips: [
      'Apply a 2-inch layer of clean straw, wood chips, or pine needle mulch beneath tomato plants to prevent soil splash.',
      'Transition to drip or soaker hose irrigation instead of overhead sprinklers.',
      'Practice a 3-year crop rotation schedule away from Solanaceae family plants (tomatoes, potatoes, eggplants, peppers).',
      'Stake or cage tomato vines to maximize vertical airflow and rapid drying.',
    ],
  };
}
