#!/usr/bin/env python3
"""
Vision LLM analyzer for photocard image verification.
Uses gpt-4o-mini to determine if an image contains a single photocard.
"""

import os
import json
import logging
from typing import Dict, Optional
import time

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VisionLLMAnalyzer:
    """Analyzes images using OpenAI Vision API."""

    MODEL = "gpt-4o-mini"
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    SYSTEM_PROMPT = """You are an expert photocard analyzer. Your task is to determine if an image contains exactly one photocard.

A photocard is:
- A single trading card with an idol/celebrity photo
- Typically portrait orientation (width:height ratio ~1:1.5 or about 85.6mm × 120mm)
- Clear, distinct image without overlapping cards

You MUST respond with ONLY a valid JSON object, no other text:
{
    "is_single_card": boolean,
    "confidence_score": number (0-100),
    "reason": "string (max 50 chars)"
}

Reject (is_single_card: false) if image contains:
- Multiple overlapping photocards
- Photocard sheet/grid (3x3, 2x5, etc.)
- Binder/sleeve bundle photos
- Album packaging or merchandise
- Partial card or extreme angles
- Text or watermarks covering most of the card"""

    USER_PROMPT = """Analyze this image. Is it a SINGLE photocard?

Respond ONLY with the JSON object, no markdown or explanation."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Vision LLM analyzer.

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        if OpenAI is None:
            raise ImportError("openai package not installed. Run: pip install openai")

        self.client = OpenAI(api_key=self.api_key)

    def analyze_image(
        self,
        base64_image: str,
        image_format: str = "webp",
    ) -> Dict:
        """
        Analyze image using Vision LLM.

        Args:
            base64_image: Base64 encoded image
            image_format: Image format (webp, jpeg, etc.)

        Returns:
            Dict with is_single_card, confidence_score, reason, usage_info
        """
        media_type = f"image/{image_format}"

        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.client.chat.completions.create(
                    model=self.MODEL,
                    max_tokens=200,
                    messages=[
                        {
                            "role": "system",
                            "content": self.SYSTEM_PROMPT,
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{media_type};base64,{base64_image}",
                                        "detail": "low",
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": self.USER_PROMPT,
                                },
                            ],
                        }
                    ],
                )

                # Parse response (OpenAI format)
                result_text = response.choices[0].message.content.strip()

                # Try to extract JSON
                try:
                    # Handle markdown code blocks if returned
                    if "```json" in result_text:
                        result_text = result_text.split("```json")[1].split("```")[0]
                    elif "```" in result_text:
                        result_text = result_text.split("```")[1].split("```")[0]

                    result_json = json.loads(result_text)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse JSON: {result_text[:100]}")
                    result_json = {
                        "is_single_card": False,
                        "confidence_score": 0,
                        "reason": "parse_error",
                    }

                # Ensure required fields
                result_json.setdefault("is_single_card", False)
                result_json.setdefault("confidence_score", 0)
                result_json.setdefault("reason", "unknown")

                # Add usage info (OpenAI format: prompt_tokens, completion_tokens)
                usage_info = {
                    "input_tokens": getattr(response.usage, 'prompt_tokens', response.usage.input_tokens if hasattr(response.usage, 'input_tokens') else 0),
                    "output_tokens": getattr(response.usage, 'completion_tokens', response.usage.output_tokens if hasattr(response.usage, 'output_tokens') else 0),
                    "total_tokens": response.usage.total_tokens,
                }

                logger.debug(f"  LLM response: {result_json}")
                logger.debug(f"  Usage: {usage_info}")

                return {
                    **result_json,
                    "usage": usage_info,
                    "success": True,
                }

            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY)
                continue

        # All retries failed
        return {
            "is_single_card": False,
            "confidence_score": 0,
            "reason": "api_error",
            "success": False,
        }

    @staticmethod
    def estimate_api_cost(
        input_tokens: int = 0,
        output_tokens: int = 0,
        total_tokens: int = 0,
    ) -> float:
        """
        Estimate API cost for gpt-4o-mini.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            total_tokens: If input/output not provided, estimate from total

        Returns:
            Estimated cost in USD
        """
        # gpt-4o-mini pricing (as of 2024)
        INPUT_RATE = 0.15 / 1_000_000  # $0.15 per 1M input tokens
        OUTPUT_RATE = 0.60 / 1_000_000  # $0.60 per 1M output tokens

        if input_tokens > 0 or output_tokens > 0:
            return (input_tokens * INPUT_RATE) + (output_tokens * OUTPUT_RATE)
        else:
            # Estimate from total: ~85% input, ~15% output
            return (total_tokens * 0.85 * INPUT_RATE) + (total_tokens * 0.15 * OUTPUT_RATE)
