"""
Product Ideation Engine
Generates new product ideas based on market gap analysis using Claude API
"""
import asyncio
import json
import re
from typing import Dict, List, Optional
from datetime import datetime
from loguru import logger

try:
    import anthropic
except ImportError:
    logger.error("anthropic package not installed. Run: pip install anthropic")
    raise

from utils.budget_tracker import get_budget_tracker
from analyzers.gap_analyzer import MarketGapAnalyzer


class IdeationEngine:
    """
    Generate innovative product ideas using AI

    Uses market gap analysis and success patterns to generate
    realistic, market-ready product concepts for LANEIGE
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-haiku-4-5-20251001"
    ):
        """
        Initialize ideation engine

        Args:
            api_key: Anthropic API key
            model: Claude model to use
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        self.budget_tracker = get_budget_tracker()
        self.gap_analyzer = MarketGapAnalyzer()

        logger.info(f"IdeationEngine initialized (model: {model})")

    async def generate_ideas_for_category(
        self,
        category_name: str,
        gap_analysis: Dict,
        num_ideas: int = 5
    ) -> List[Dict]:
        """
        Generate product ideas for a specific category

        Args:
            category_name: Category name
            gap_analysis: Gap analysis results from MarketGapAnalyzer
            num_ideas: Number of ideas to generate (default: 5)

        Returns:
            List of product idea dicts
        """
        logger.info(f"Generating {num_ideas} product ideas for: {category_name}")

        # Check budget
        if not self.budget_tracker.can_make_request(estimated_cost=0.10):
            logger.warning("Budget limit reached, skipping idea generation")
            return []

        # Build comprehensive prompt
        prompt = self._build_ideation_prompt(
            category_name,
            gap_analysis,
            num_ideas
        )

        # Call Claude API
        try:
            start_time = datetime.now()

            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.7,  # Higher temperature for creativity
                messages=[{"role": "user", "content": prompt}]
            )

            extraction_time_ms = (datetime.now() - start_time).total_seconds() * 1000

            # Record usage
            usage_summary = self.budget_tracker.record_usage(
                input_tokens=message.usage.input_tokens,
                output_tokens=message.usage.output_tokens,
                model=self.model,
                task_type="product_ideation"
            )

            logger.info(
                f"Ideation API call: ${usage_summary['request_cost']:.4f} "
                f"({message.usage.input_tokens}+{message.usage.output_tokens} tokens, "
                f"{extraction_time_ms:.0f}ms)"
            )

            # Parse response
            response_text = message.content[0].text
            ideas = self._parse_ideas_response(response_text, category_name)

            logger.success(f"✓ Generated {len(ideas)} ideas for {category_name}")

            return ideas

        except Exception as e:
            logger.error(f"Failed to generate ideas for {category_name}: {e}")
            return []

    def _build_ideation_prompt(
        self,
        category_name: str,
        gap_analysis: Dict,
        num_ideas: int
    ) -> str:
        """Build Claude prompt for product ideation"""

        # Extract key insights
        underserved = gap_analysis.get("underserved_combinations", [])[:10]
        success_patterns = gap_analysis.get("success_patterns", {})
        opportunities = gap_analysis.get("opportunity_areas", [])[:5]

        # Format success patterns
        top_ingredients = [
            f"{item['ingredient']} ({item['percentage']}%)"
            for item in success_patterns.get("top_ingredients", [])[:5]
        ]
        top_benefits = [
            f"{item['benefit']} ({item['percentage']}%)"
            for item in success_patterns.get("top_benefits", [])[:5]
        ]
        top_certs = [
            f"{item['certification']} ({item['percentage']}%)"
            for item in success_patterns.get("top_certifications", [])[:5]
        ]

        # Format opportunity areas
        opportunity_text = "\n".join([
            f"- {opp['attribute_1']} + {opp['attribute_2']} "
            f"(Score: {opp['opportunity_score']}/10, Only {opp['current_products']} products)"
            for opp in opportunities
        ])

        prompt = f"""You are a beauty product innovation strategist for LANEIGE. Generate {num_ideas} innovative, market-ready product ideas for the "{category_name}" category based on this market analysis.

## Market Analysis Summary

**Category**: {category_name}
**Total Products Analyzed**: {gap_analysis.get('products_with_attributes', 0)}

### Top Opportunity Areas (Underserved Combinations):
{opportunity_text}

### Success Patterns from Top-Performing Products:

**Most Common Ingredients**:
{', '.join(top_ingredients)}

**Most Common Benefits**:
{', '.join(top_benefits)}

**Most Common Certifications**:
{', '.join(top_certs)}

**Preferred Price Tiers**:
{', '.join([f"{item['tier']} ({item['percentage']}%)" for item in success_patterns.get('top_price_tiers', [])[:3]])}

## Task

Generate {num_ideas} innovative product ideas that:
1. **Address market gaps** - Target underserved attribute combinations
2. **Leverage success patterns** - Incorporate ingredients/benefits that work
3. **Are realistic** - Could actually be developed and launched
4. **Differentiate LANEIGE** - Unique positioning vs. competitors

For each idea, provide a JSON object with:

```json
{{
  "product_name": "Creative, marketable product name",
  "category_position": "Specific category placement",
  "tagline": "Compelling 1-sentence description",
  "core_concept": "2-3 sentence explanation of what makes this unique",
  "target_attributes": {{
    "primary_benefit": "Main benefit (e.g., Hydration, Anti-Aging)",
    "key_ingredients": ["2-4 key active ingredients"],
    "formula_type": "Product format (Cream, Serum, etc.)",
    "texture": "Texture description",
    "certifications": ["Clean beauty/ethical claims"],
    "target_skin_type": ["Target skin types"],
    "price_tier": "budget/affordable/mid_range/premium/luxury"
  }},
  "market_opportunity_score": 7.5,
  "rationale": "Why this will succeed (2-3 sentences): address the specific gap, explain competitive advantage, cite success patterns",
  "competitive_advantage": "What makes this better than existing products (1-2 sentences)",
  "risk_level": "Low/Medium/High",
  "estimated_development_complexity": "Low/Medium/High"
}}
```

**Important**:
- Use realistic ingredient combinations that work together
- Price tiers should match ingredient quality and positioning
- Benefits should align with ingredients
- Be specific and creative, not generic
- Each idea should be distinctly different from the others

**Language Requirement**:
- Write ALL content in Korean EXCEPT for proper nouns (product names, brand names like "LANEIGE", ingredient names like "Hyaluronic Acid", certification names)
- product_name: English product name is acceptable (e.g., "Water Sleeping Hand Mask")
- tagline, core_concept, rationale, competitive_advantage: Must be in Korean
- key_ingredients, certifications: Keep in English (proper nouns)
- All other descriptive text: Korean

Return ONLY a valid JSON array of {num_ideas} idea objects. No other text.

JSON Array:"""

        return prompt

    def _parse_ideas_response(
        self,
        response_text: str,
        category_name: str
    ) -> List[Dict]:
        """Parse Claude response to extract product ideas"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)

            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find raw JSON array
                json_str = response_text.strip()

            # Parse JSON
            ideas = json.loads(json_str)

            # Validate structure
            if not isinstance(ideas, list):
                logger.warning("Response is not a list, wrapping in array")
                ideas = [ideas]

            # Add metadata to each idea
            for idea in ideas:
                idea["category"] = category_name
                idea["generated_at"] = datetime.now().isoformat()
                idea["generated_by"] = self.model

            return ideas

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from ideation response: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error parsing ideas: {e}")
            return []

    async def generate_for_all_categories(
        self,
        products_by_category: Dict[str, List[Dict]],
        categories_to_analyze: Optional[List[str]] = None,
        ideas_per_category: int = 5
    ) -> Dict:
        """
        Generate product ideas for multiple categories

        Args:
            products_by_category: Dict mapping category name to product list
            categories_to_analyze: List of specific categories to analyze (or None for all)
            ideas_per_category: Number of ideas per category

        Returns:
            Dict with comprehensive ideation report
        """
        logger.info("=" * 60)
        logger.info("🚀 Starting Multi-Category Product Ideation")
        logger.info("=" * 60)

        all_analyses = {}
        total_ideas = 0

        # Filter categories if specified
        if categories_to_analyze:
            categories = {
                k: v for k, v in products_by_category.items()
                if k in categories_to_analyze
            }
        else:
            categories = products_by_category

        logger.info(f"Analyzing {len(categories)} categories...")

        # Process each category
        for category_name, products in categories.items():
            logger.info(f"\n{'='*60}")
            logger.info(f"📊 Category: {category_name}")
            logger.info(f"{'='*60}")

            # Step 1: Market gap analysis
            gap_analysis = self.gap_analyzer.analyze_category(category_name, products)

            # Step 2: Generate product ideas
            ideas = await self.generate_ideas_for_category(
                category_name,
                gap_analysis,
                num_ideas=ideas_per_category
            )

            all_analyses[category_name] = {
                "category": category_name,
                "gap_analysis": gap_analysis,
                "product_ideas": ideas,
                "analysis_timestamp": datetime.now().isoformat()
            }

            total_ideas += len(ideas)

            # Delay between categories to respect rate limits
            if len(ideas) > 0:
                await asyncio.sleep(3)

        # Generate cross-category insights
        logger.info(f"\n{'='*60}")
        logger.info("🔍 Generating Cross-Category Insights")
        logger.info(f"{'='*60}")

        cross_insights = self._generate_cross_category_insights(all_analyses)

        # Compile final report
        report = {
            "metadata": {
                "generation_date": datetime.now().isoformat(),
                "total_categories_analyzed": len(all_analyses),
                "total_ideas_generated": total_ideas,
                "model_used": self.model,
                "ideas_per_category": ideas_per_category
            },
            "category_analyses": all_analyses,
            "cross_category_insights": cross_insights,
            "budget_summary": self.budget_tracker.get_monthly_stats()
        }

        logger.success(f"\n{'='*60}")
        logger.success(f"✅ Ideation Complete!")
        logger.success(f"{'='*60}")
        logger.success(f"Total Categories: {len(all_analyses)}")
        logger.success(f"Total Ideas: {total_ideas}")
        logger.success(f"API Cost This Session: ${report['budget_summary']['total_cost']:.2f}")
        logger.success(f"{'='*60}\n")

        return report

    def _generate_cross_category_insights(self, all_analyses: Dict) -> Dict:
        """Generate insights across all categories"""
        all_ideas = []
        all_gaps = []

        for category, analysis in all_analyses.items():
            all_ideas.extend(analysis.get("product_ideas", []))
            all_gaps.extend(analysis.get("gap_analysis", {}).get("opportunity_areas", []))

        # Top opportunities across all categories
        top_opportunities = sorted(
            all_gaps,
            key=lambda x: x.get("opportunity_score", 0),
            reverse=True
        )[:10]

        # Top ideas by market opportunity score
        top_ideas = sorted(
            all_ideas,
            key=lambda x: x.get("market_opportunity_score", 0),
            reverse=True
        )[:10]

        # Common success ingredients across categories
        ingredient_counter = {}
        for analysis in all_analyses.values():
            success_patterns = analysis.get("gap_analysis", {}).get("success_patterns", {})
            for item in success_patterns.get("top_ingredients", []):
                ing = item["ingredient"]
                ingredient_counter[ing] = ingredient_counter.get(ing, 0) + 1

        common_ingredients = [
            {"ingredient": ing, "categories": count}
            for ing, count in sorted(ingredient_counter.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        return {
            "top_cross_category_opportunities": top_opportunities,
            "highest_scored_ideas": [
                {
                    "product_name": idea.get("product_name"),
                    "category": idea.get("category"),
                    "score": idea.get("market_opportunity_score"),
                    "tagline": idea.get("tagline")
                }
                for idea in top_ideas
            ],
            "common_success_ingredients": common_ingredients,
            "total_unique_opportunities": len(all_gaps),
            "avg_opportunity_score": round(
                sum(g.get("opportunity_score", 0) for g in all_gaps) / len(all_gaps), 2
            ) if all_gaps else 0
        }

    def save_report(self, report: Dict, output_path: str = None):
        """Save ideation report to JSON file"""
        from pathlib import Path
        from config.settings import OUTPUT_DIR

        if output_path is None:
            output_path = OUTPUT_DIR / "product_ideation_report.json"
        else:
            output_path = Path(output_path)

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

            logger.success(f"✓ Saved ideation report to: {output_path}")

        except Exception as e:
            logger.error(f"Failed to save ideation report: {e}")
