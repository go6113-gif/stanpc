import { VISION_SYSTEM_PROMPT, VISION_USER_PROMPT, VisionClassification, RETRY_CONFIG } from './prompt';

/**
 * Call OpenAI Vision API (gpt-4o-mini) with retry logic
 */
export async function classifyPhotocard(
  imageBase64: string,
  cardTitle: string,
  attempt: number = 0
): Promise<VisionClassification> {
  if (attempt >= RETRY_CONFIG.maxAttempts) {
    throw new Error(
      `Vision classification failed after ${RETRY_CONFIG.maxAttempts} attempts`
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: VISION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: VISION_USER_PROMPT(imageBase64, cardTitle),
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    let parsed: VisionClassification;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback: try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate response structure
    if (typeof parsed.confidence !== 'number' || !['APPROVE', 'REVIEW', 'REJECT'].includes(parsed.tier)) {
      throw new Error('Invalid classification response structure');
    }

    return {
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      tier: parsed.tier,
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    const err = error as Error;
    const isRetryable =
      RETRY_CONFIG.retryableErrors.some((code) => err.message.includes(code)) ||
      (err.message.includes('429') || err.message.includes('500'));

    if (isRetryable && attempt < RETRY_CONFIG.maxAttempts - 1) {
      const waitMs = RETRY_CONFIG.backoffMs(attempt);
      console.log(`Vision API retry in ${waitMs}ms (attempt ${attempt + 1})`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return classifyPhotocard(imageBase64, cardTitle, attempt + 1);
    }

    throw error;
  }
}

/**
 * Determine tier based on confidence score
 */
export function getTierFromScore(score: number): 'APPROVE' | 'REVIEW' | 'REJECT' {
  if (score >= 90) return 'APPROVE';
  if (score >= 50) return 'REVIEW';
  return 'REJECT';
}

/**
 * Batch classification with progress tracking
 */
export async function classifyPhotocardsBatch(
  items: Array<{ imageBase64: string; cardTitle: string; cardId: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<
  Array<{
    cardId: string;
    classification: VisionClassification;
    tokensUsed?: number;
    costUsd?: number;
  }>
> {
  const results: Array<{
    cardId: string;
    classification: VisionClassification;
    tokensUsed?: number;
    costUsd?: number;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const classification = await classifyPhotocard(item.imageBase64, item.cardTitle);
      results.push({
        cardId: item.cardId,
        classification,
      });
    } catch (error) {
      console.error(`Failed to classify ${item.cardId}:`, error);
      results.push({
        cardId: item.cardId,
        classification: {
          confidence: 0,
          tier: 'REJECT' as const,
          reasoning: `API Error: ${(error as Error).message}`,
        },
      });
    }

    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return results;
}
