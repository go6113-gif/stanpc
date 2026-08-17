/**
 * Vision LLM 3-Tier Photocard Classifier
 *
 * Score 90+: APPROVE (Clear single photocard)
 * Score 50-89: REVIEW (Ambiguous angle/glare)
 * Score <50: REJECT (Bundle/non-photocard/profile)
 */

import Anthropic from '@anthropic-ai/sdk';

export type ClassificationTier = 'APPROVE' | 'REVIEW' | 'REJECT';

export interface ClassificationResult {
  tier: ClassificationTier;
  score: number;
  reason: string;
  confidence: number;
  retryCount?: number;
}

const client = new Anthropic();

const VISION_PROMPT = `You are an expert photocard quality classifier. Analyze this image and provide:

1. **Score (0-100)**: Quality assessment
   - 90+: Clear, single photocard, identifiable member face/pose
   - 50-89: Acceptable angle/lighting, minor glare or sleeve/toploader visible
   - <50: Bundle/set, pure profile, non-photocard, or severely damaged

2. **Reason**: One sentence explanation
3. **Confidence (0-100)**: Your confidence in this classification

Respond in JSON:
{
  "score": <number>,
  "reason": "<string>",
  "confidence": <number>
}`;

export async function classifyPhotocard(
  imageUrl: string,
  retryCount: number = 0
): Promise<ClassificationResult> {
  const MAX_RETRIES = 3;
  const BACKOFF_DELAY = Math.pow(2, retryCount) * 1000; // Exponential backoff

  try {
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, BACKOFF_DELAY));
    }

    const response = await client.messages.create({
      model: 'claude-opus-5-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: VISION_PROMPT,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = JSON.parse(content.text);
    const score = parsed.score || 0;
    const confidence = parsed.confidence || 0;

    let tier: ClassificationTier;
    if (score >= 90) {
      tier = 'APPROVE';
    } else if (score >= 50) {
      tier = 'REVIEW';
    } else {
      tier = 'REJECT';
    }

    return {
      tier,
      score,
      reason: parsed.reason || 'No reason provided',
      confidence,
      retryCount,
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`[Vision] Retry ${retryCount + 1}/${MAX_RETRIES} for ${imageUrl}`);
      return classifyPhotocard(imageUrl, retryCount + 1);
    }

    console.error(`[Vision] Failed after ${MAX_RETRIES} retries:`, error);
    return {
      tier: 'REVIEW', // Default to manual review on API error
      score: 0,
      reason: 'Network error - manual review required',
      confidence: 0,
      retryCount,
    };
  }
}

export async function batchClassify(
  imageUrls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const result = await classifyPhotocard(url);
    results.set(url, result);

    if (onProgress) {
      onProgress(i + 1, imageUrls.length);
    }
  }

  return results;
}
