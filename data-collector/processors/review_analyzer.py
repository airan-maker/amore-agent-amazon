"""
Review Analyzer using Claude API
Analyzes customer reviews to extract usage contexts, sentiments, and insights
"""
import anthropic
import json
import re
from typing import List, Dict, Any, Optional
from loguru import logger

from config.settings import ANTHROPIC_API_KEY, CLAUDE_SETTINGS, REVIEW_ANALYSIS


class ReviewAnalyzer:
    """
    Analyzes reviews using Claude API to extract:
    - Usage contexts
    - Sentiment scores
    - Key phrases
    - Skin concerns
    - Companion products
    """

    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Anthropic API key (defaults to settings)
        """
        self.api_key = api_key or ANTHROPIC_API_KEY

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set. Please add it to .env file")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = CLAUDE_SETTINGS["model"]
        self.max_tokens = CLAUDE_SETTINGS["max_tokens"]
        self.temperature = CLAUDE_SETTINGS["temperature"]

    def analyze_reviews_batch(
        self,
        reviews: List[Dict[str, Any]],
        product_name: str,
        product_category: str
    ) -> Dict[str, Any]:
        """
        Analyze a batch of reviews to extract usage contexts

        Args:
            reviews: List of review dictionaries
            product_name: Product name
            product_category: Product category

        Returns:
            dict: Analysis results with usage contexts
        """
        if not reviews:
            logger.warning("No reviews to analyze")
            return {"usage_contexts": []}

        logger.info(f"Analyzing {len(reviews)} reviews for {product_name}")

        # Prepare reviews text
        reviews_text = self._prepare_reviews_text(reviews)

        # Build Claude prompt
        prompt = self._build_analysis_prompt(
            reviews_text,
            product_name,
            product_category
        )

        # Call Claude API
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse response
            response_text = response.content[0].text
            analysis_result = self._parse_claude_response(response_text)

            # Enrich with sample reviews
            analysis_result = self._add_sample_reviews(
                analysis_result,
                reviews
            )

            logger.success(f"✓ Analyzed reviews, found {len(analysis_result.get('usage_contexts', []))} contexts")
            return analysis_result

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._fallback_analysis(reviews)

    def _prepare_reviews_text(self, reviews: List[Dict]) -> str:
        """Prepare reviews for Claude API"""
        reviews_text = []

        for i, review in enumerate(reviews[:REVIEW_ANALYSIS["batch_size"]], 1):
            text = review.get("text", "")
            rating = review.get("rating", 0)
            verified = "✓ Verified" if review.get("verified") else ""

            reviews_text.append(
                f"Review {i} (Rating: {rating}/5) {verified}:\n{text}\n"
            )

        return "\n".join(reviews_text)

    def _build_analysis_prompt(
        self,
        reviews_text: str,
        product_name: str,
        product_category: str
    ) -> str:
        """Build prompt for Claude API"""
        prompt = f"""당신은 뷰티/스킨케어 카테고리의 Amazon 고객 리뷰 전문 분석가입니다.

"{product_name}" ({product_category}) 제품에 대한 다음 리뷰를 분석하고 사용 맥락 패턴을 추출하세요.

<reviews>
{reviews_text}
</reviews>

작업:
1. 3-5개의 주요 사용 맥락을 파악하세요 (고객이 이 제품을 사용하는 상황/이유)
2. 각 맥락에 대해 다음을 추출하세요:
   - 간결한 설명 (한국어로 작성)
   - 빈도 (이 맥락을 언급한 리뷰 수 추정)
   - 감정 점수 (0-1, 이 맥락에 대한 리뷰가 얼마나 긍정적인지)
   - 고객이 사용하는 3-5개의 핵심 문구 (원문 그대로)
   - 다루는 피부 고민 (한국어)
   - 사용 시간 (Morning/Night/Both - 영어 유지)
   - 계절 (언급된 경우: Summer/Winter/Year-round - 영어 유지)
   - 함께 사용하는 제품 (제품명은 영어 원문 유지)

주의사항:
- 제품명, 브랜드명, 카테고리명은 영어 원문을 유지하세요
- 설명, 감정, 피부 고민 등의 분석 내용은 한국어로 작성하세요

다음 구조의 JSON 객체만 반환하세요:
{{
  "usage_contexts": [
    {{
      "context": "Description of usage context",
      "frequency": 50,
      "sentiment_score": 0.85,
      "key_phrases": ["phrase 1", "phrase 2", "phrase 3"],
      "skin_concerns": ["concern 1", "concern 2"],
      "time_of_use": "Night",
      "season": "Year-round",
      "companion_products": ["product 1", "product 2"]
    }}
  ]
}}

Important:
- Be specific about usage contexts (not just "hydration" but "post-retinol hydration" or "AC-dried skin relief")
- Frequency should sum to approximately the total number of reviews
- Sentiment score: 0 = very negative, 0.5 = neutral, 1.0 = very positive
- Only include companion products if EXPLICITLY mentioned by name
- If no clear time/season mentioned, use "Year-round" or "Morning & Night"

Analyze now and return ONLY the JSON (no other text):"""

        return prompt

    def _parse_claude_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's JSON response"""
        try:
            # Extract JSON from response (in case there's extra text)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                return data
            else:
                logger.warning("No JSON found in Claude response")
                return {"usage_contexts": []}

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return {"usage_contexts": []}

    def _add_sample_reviews(
        self,
        analysis_result: Dict,
        reviews: List[Dict]
    ) -> Dict:
        """Add sample reviews to each usage context"""
        usage_contexts = analysis_result.get("usage_contexts", [])

        for context in usage_contexts:
            # Find reviews matching this context
            matching_reviews = self._find_matching_reviews(
                context,
                reviews,
                max_samples=3
            )

            context["sample_reviews"] = matching_reviews

        return analysis_result

    def _find_matching_reviews(
        self,
        context: Dict,
        reviews: List[Dict],
        max_samples: int = 3
    ) -> List[Dict]:
        """Find reviews that match a usage context"""
        key_phrases = [phrase.lower() for phrase in context.get("key_phrases", [])]
        matching_reviews = []

        for review in reviews:
            text = review.get("text", "").lower()

            # Check if any key phrase appears in review
            if any(phrase in text for phrase in key_phrases):
                matching_reviews.append({
                    "text": review.get("text"),
                    "rating": review.get("rating"),
                    "verified": review.get("verified", False)
                })

                if len(matching_reviews) >= max_samples:
                    break

        # If no matches, take top-rated reviews
        if not matching_reviews:
            sorted_reviews = sorted(
                reviews,
                key=lambda x: (x.get("rating") or 0, x.get("helpful_votes") or 0),
                reverse=True
            )

            for review in sorted_reviews[:max_samples]:
                matching_reviews.append({
                    "text": review.get("text"),
                    "rating": review.get("rating"),
                    "verified": review.get("verified", False)
                })

        return matching_reviews

    def _fallback_analysis(self, reviews: List[Dict]) -> Dict:
        """Fallback analysis if Claude API fails"""
        logger.warning("Using fallback analysis (basic sentiment)")

        # Simple sentiment based on ratings (handle None values)
        positive_reviews = [r for r in reviews if (r.get("rating") or 0) >= 4]
        sentiment_score = len(positive_reviews) / len(reviews) if reviews else 0.5

        # Generic usage context
        usage_contexts = [{
            "context": "일반 사용",
            "frequency": len(reviews),
            "sentiment_score": round(sentiment_score, 2),
            "key_phrases": ["좋아요", "만족", "추천"],
            "skin_concerns": ["건조", "보습"],
            "time_of_use": "Morning & Night",
            "season": "Year-round",
            "companion_products": [],
            "sample_reviews": [
                {
                    "text": r.get("text", ""),
                    "rating": r.get("rating", 0),
                    "verified": r.get("verified", False)
                }
                for r in reviews[:3]
            ]
        }]

        return {"usage_contexts": usage_contexts}

    def analyze_demographic_insights(
        self,
        reviews: List[Dict]
    ) -> Dict[str, Any]:
        """
        Analyze demographic patterns from reviews using Claude

        This is a bonus feature - actual demographic data from Amazon is limited
        """
        if not reviews:
            return {}

        # Prepare sample reviews
        sample_text = "\n\n".join([
            f"Review {i+1}: {r.get('text', '')}"
            for i, r in enumerate(reviews[:20])
        ])

        prompt = f"""Based on these customer reviews, estimate the demographic distribution.

<reviews>
{sample_text}
</reviews>

Analyze language patterns, concerns mentioned, and usage descriptions to estimate:
1. Age groups (20s, 30s, 40s, 50+) - in percentages
2. Skin types (Dry, Combination, Oily, Normal, Sensitive) - in percentages

Return ONLY a JSON object:
{{
  "age_groups": {{"20s": 30, "30s": 40, "40s": 20, "50+": 10}},
  "skin_types": {{"Dry": 40, "Combination": 30, "Normal": 20, "Oily": 10}}
}}

Note: This is an estimate based on language patterns. Return ONLY the JSON:"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=self.temperature,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)

            if json_match:
                return json.loads(json_match.group())

        except Exception as e:
            logger.warning(f"Demographic analysis failed: {e}")

        # Fallback
        return {
            "age_groups": {"20s": 40, "30s": 35, "40s": 20, "50+": 5},
            "skin_types": {"Dry": 35, "Combination": 30, "Normal": 20, "Oily": 15}
        }
