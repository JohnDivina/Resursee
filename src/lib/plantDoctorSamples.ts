import { SamplePlant } from '@/types/plantDoctor';

export const samplePlants: SamplePlant[] = [
  {
    id: 'sample-tomato-blight',
    name: 'Tomato (Solanum lycopersicum)',
    issue: 'Early Blight (Alternaria solani)',
    category: 'Fungal Infection',
    severity: 'moderate',
    imageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=600&q=80',
    description: 'Concentric dark brown rings with chlorotic yellow halo on lower tomato foliage.',
  },
  {
    id: 'sample-citrus-pest',
    name: 'Citrus / Lemon (Citrus limon)',
    issue: 'Citrus Leafminer (Phyllocnistis citrella)',
    category: 'Pest Infestation',
    severity: 'mild',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    description: 'Silvery serpentine tunnels and leaf curling caused by insect larvae tunneling through leaf cuticle.',
  },
  {
    id: 'sample-corn-rust',
    name: 'Sweet Corn (Zea mays)',
    issue: 'Common Rust (Puccinia sorghi)',
    category: 'Fungal Spores',
    severity: 'severe',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    description: 'Golden-brown powdery pustules erupting across upper and lower leaf surfaces.',
  },
  {
    id: 'sample-healthy-basil',
    name: 'Sweet Basil (Ocimum basilicum)',
    issue: 'Optimal Plant Health',
    category: 'Healthy Foliage',
    severity: 'healthy',
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
    description: 'Vibrant emerald green leaves with intact cellular turgor, zero necrosis, and balanced transpiration.',
  },
];
