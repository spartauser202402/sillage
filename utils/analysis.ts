import { ScentVector } from '../data/perfumes';

export const calculateSimilarity = (v1: ScentVector, v2: ScentVector): number => {
  const keys: (keyof ScentVector)[] = ['floral', 'woody', 'musky', 'fresh', 'oud'];
  let dot = 0, mag1 = 0, mag2 = 0;
  keys.forEach(k => {
    dot += v1[k] * v2[k];
    mag1 += v1[k] ** 2;
    mag2 += v2[k] ** 2;
  });
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

export const fetchAnalysisFromClaude = async (
  apiKey: string,
  prompt: string,
  base64Image?: string
) => {
  const content = base64Image
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        { type: 'text', text: prompt }
      ]
    : prompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content }],
    }),
  });

  return await response.json();
};