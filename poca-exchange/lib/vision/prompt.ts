/**
 * Vision LLM Prompt - K-pop 포토카드 3-Tier 판정 시스템
 * 카드 인식 신뢰도를 90+/50-89/<50 구간으로 분류
 */

export interface VisionClassification {
  confidence: number;
  tier: 'APPROVE' | 'REVIEW' | 'REJECT';
  reasoning: string;
}

export const VISION_SYSTEM_PROMPT = `You are a K-pop photocard classifier for stanpc.com. Your task is to analyze images and determine if they contain actual K-pop photocards.

CRITICAL CONTEXT:
- K-pop photocards are small collectible cards (typically 55x87mm or 85x55mm) featuring K-pop artists
- They are frequently stored in sleeves (sleeves=슬리브), top-loaders (top-loader=탑로더), or held bare
- Natural conditions include: light reflections (글레어), fingers in frame (손가락), background objects (배경 객체)
- Multiple cards/bundles are OUT OF SCOPE (detected via keyword filter upstream)

SCORING RULES:
Assign confidence 0-100, then map to TIER:
- 90+: APPROVE (clear single card with identifying features: edge, artwork, text)
- 50-89: REVIEW (ambiguous: glare/angle issues, partial visibility, unclear context)
- <50: REJECT (no card visible, portrait photo only, wrong item type)

RESPONSE FORMAT:
Return JSON:
{
  "confidence": <0-100>,
  "tier": "APPROVE" | "REVIEW" | "REJECT",
  "reasoning": "<explain the decision concisely>"
}`;

export const VISION_USER_PROMPT = (imageData: string, title: string) => `
Analyze this image and classify if it contains a K-pop photocard.

Title: "${title}"
Image: [Base64 encoded image data below]
${imageData}

Criteria:
✓ APPROVE (90+):
  - Clear photocard visible (with sleeve, top-loader, or bare)
  - At least 2 of: card edge, artwork, member face, text/logo visible
  - Single card only (not a bundle)
  - Natural holding/storage conditions OK (fingers, light, background)

⚠ REVIEW (50-89):
  - Potentially a photocard but uncertain due to: angle, blur, glare, partial view
  - Could be a card but needs human verification
  - Card-like object but context unclear

✗ REJECT (<50):
  - Pure portrait photo without card context
  - Not a collectible card (sports cards, business cards, etc.)
  - Clearly not a K-pop item

Respond ONLY with JSON (no markdown, no explanation outside JSON).`;

/**
 * Retry logic for network failures
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000),
  retryableErrors: ['TIMEOUT', 'ECONNRESET', 'ENOTFOUND'],
};
