"""
Product analyzer using Claude API
Summarizes product features and reviews into concise insights
"""
import anthropic
from typing import Dict, Any, List
from loguru import logger
from config.settings import ANTHROPIC_API_KEY


class ProductAnalyzer:
    """Analyzes product data and reviews using Claude AI"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.model = "claude-haiku-4-5-20251001"

    def analyze_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze product and generate comprehensive summary

        Args:
            product_data: Product details from scraper

        Returns:
            dict: Analysis results with formatted summary
        """
        logger.info(f"Analyzing product: {product_data.get('title', 'Unknown')[:50]}...")

        analysis = {
            "product_name": product_data.get("title"),
            "price_and_specs": self._format_price_and_specs(product_data),
            "rating": product_data.get("rating"),
            "key_features": self._extract_key_features(product_data),
            "review_summary": self._summarize_reviews(product_data),
        }

        logger.success("✓ Product analysis complete")
        return analysis

    def _format_price_and_specs(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format price and specifications"""
        price_info = product_data.get("price", {})

        # Extract size/volume from specs or title
        specs = product_data.get("specifications", {})
        size = specs.get("Size", specs.get("Volume", ""))

        return {
            "price": price_info.get("formatted", "N/A"),
            "price_value": price_info.get("price"),
            "size": size,
            "currency": price_info.get("currency", "USD"),
        }

    def _extract_key_features(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and categorize key features using Claude"""
        features = product_data.get("features", [])
        about_items = product_data.get("about_items", [])
        specs = product_data.get("specifications", {})

        # Combine all feature text
        all_features = "\n".join(features + about_items)
        spec_text = "\n".join([f"{k}: {v}" for k, v in specs.items()])

        prompt = f"""이 뷰티/스킨케어 제품을 분석하고 다음 카테고리별로 주요 특징을 추출하세요:

제품 특징:
{all_features}

제품 사양:
{spec_text}

다음 카테고리로 정보를 분류하세요:
1. Formula/Texture (제형/질감 - 예: 젤, 크림, 하이브리드)
2. Key Ingredients (주요 성분 - 활성 성분, 유효 성분)
3. Scent/Fragrance (향 - 언급된 경우)
4. Skin Type/Benefits (피부 타입/효능 - 누구를 위한 것인지, 무엇을 하는지)
5. Special Features (특별한 특징 - pH 밸런스, 동물실험 반대, 클린 뷰티 등)

JSON 형식으로 다음 키를 정확히 사용하세요: formula, ingredients, scent, benefits, special_features
각 카테고리는 간결하게 (최대 1-2문장) 한국어로 작성하세요.
제품명, 브랜드명, 성분명은 영어 원문을 유지하세요.
언급되지 않은 카테고리는 "명시되지 않음"을 사용하세요.
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # Try to parse JSON from response
            import json
            import re

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                features_json = json.loads(json_match.group(0))
                return features_json
            else:
                # Fallback to raw response
                return {"raw_features": response_text}

        except Exception as e:
            logger.warning(f"Failed to analyze features with Claude: {e}")
            # Fallback: return raw features
            return {
                "formula": "See product features",
                "ingredients": "See product features",
                "scent": "Not specified",
                "benefits": "See product features",
                "special_features": "See product features",
                "raw_features": all_features[:500]
            }

    def _summarize_reviews(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize customer reviews using Claude"""
        reviews = product_data.get("sample_reviews", [])

        if not reviews:
            return {
                "positive": "No reviews available",
                "negative": "No reviews available",
                "overall_sentiment": "N/A"
            }

        # Separate by rating
        positive_reviews = [r for r in reviews if r.get("rating", 0) >= 4]
        negative_reviews = [r for r in reviews if r.get("rating", 0) < 4]

        # Format reviews for Claude
        positive_text = "\n\n".join([
            f"Rating: {r.get('rating')}/5\n{r.get('text', '')[:300]}"
            for r in positive_reviews[:10]
        ])

        negative_text = "\n\n".join([
            f"Rating: {r.get('rating')}/5\n{r.get('text', '')[:300]}"
            for r in negative_reviews[:5]
        ])

        prompt = f"""뷰티/스킨케어 제품에 대한 고객 리뷰를 분석하고 간결한 요약을 제공하세요.

긍정 리뷰:
{positive_text}

부정 리뷰:
{negative_text}

다음을 제공하세요:
1. 긍정 요약: 고객들이 이 제품을 좋아하는 이유 (3-5개 항목)
2. 부정 요약: 일반적인 불만이나 우려사항 (3-5개 항목, 또는 중요한 부정적 의견이 없으면 "특별한 부정적 의견 없음")
3. 전체 감정: 한 문장으로 간략히 요약

JSON 형식으로 다음 키를 사용하세요: positive (배열), negative (배열), overall_sentiment (문자열)
모든 내용은 한국어로 작성하되, 제품명과 브랜드명은 영어 원문을 유지하세요.
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text

            # Parse JSON
            import json
            import re

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                summary = json.loads(json_match.group(0))
                return summary
            else:
                return {
                    "positive": ["Customers generally love this product"],
                    "negative": ["See individual reviews for details"],
                    "overall_sentiment": response_text[:200]
                }

        except Exception as e:
            logger.warning(f"Failed to summarize reviews with Claude: {e}")
            return {
                "positive": [
                    f"High average rating: {product_data.get('rating')}/5",
                    f"Based on {len(positive_reviews)} positive reviews"
                ],
                "negative": [
                    f"{len(negative_reviews)} reviews mentioned concerns"
                ],
                "overall_sentiment": f"Product has {product_data.get('rating')}/5 stars from {product_data.get('review_count')} reviews"
            }


# Example usage
async def main():
    """Test product analyzer"""
    # Mock product data
    product_data = {
        "title": "Vanilla Cashmere Body Wash",
        "price": {"formatted": "$9.98", "price": 9.98, "currency": "USD"},
        "rating": 4.8,
        "review_count": 9847,
        "features": [
            "Hybrid creamy gel formula",
            "Contains shea butter, cocoa butter, argan butter",
            "pH balanced, dermatologist recommended",
            "Paraben-free, cruelty-free"
        ],
        "specifications": {
            "Size": "16 fl oz (473ml)",
            "Scent": "Vanilla Cashmere"
        },
        "sample_reviews": [
            {
                "rating": 5,
                "text": "This body wash smells amazing! Like vanilla cookies. Very moisturizing."
            },
            {
                "rating": 5,
                "text": "Best body wash ever. Lathers well and doesn't dry out my skin."
            },
            {
                "rating": 4,
                "text": "Great product but wish the scent lasted longer after shower."
            }
        ]
    }

    analyzer = ProductAnalyzer()
    analysis = analyzer.analyze_product(product_data)

    import json
    print(json.dumps(analysis, indent=2))


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
