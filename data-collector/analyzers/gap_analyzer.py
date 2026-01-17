"""
Market Gap Analyzer
Identifies underserved and oversaturated attribute combinations in the market
"""
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Any
from loguru import logger


class MarketGapAnalyzer:
    """
    Analyze market gaps and opportunities based on product attributes

    Identifies:
    - Underserved attribute combinations (market gaps)
    - Oversaturated combinations (competitive areas)
    - Success patterns from top-performing products
    """

    def __init__(self):
        """Initialize market gap analyzer"""
        self.combination_threshold_low = 3  # <3 products = underserved
        self.combination_threshold_high = 50  # >50 products = oversaturated
        self.top_products_rank_cutoff = 20  # Top 20 for success analysis
        self.min_rating = 4.3  # Minimum rating for "successful" products

    def analyze_category(
        self,
        category_name: str,
        products: List[Dict]
    ) -> Dict:
        """
        Analyze market gaps for a specific category

        Args:
            category_name: Category name
            products: List of products with attributes

        Returns:
            Dict with gap analysis results
        """
        logger.info(f"Analyzing market gaps for: {category_name}")

        # Filter products with valid attributes
        valid_products = [
            p for p in products
            if p.get("attributes") and not p.get("attributes", {}).get("extraction_failed")
        ]

        logger.info(f"  - Total products: {len(products)}")
        logger.info(f"  - Products with attributes: {len(valid_products)}")

        if len(valid_products) < 10:
            logger.warning(f"Too few products with attributes ({len(valid_products)}), skipping analysis")
            return self._get_empty_analysis(category_name)

        # 1. Create attribute combination matrix
        combinations = self._create_combination_matrix(valid_products)

        # 2. Identify underserved combinations
        underserved = self._find_underserved_combinations(combinations)

        # 3. Identify oversaturated combinations
        oversaturated = self._find_oversaturated_combinations(combinations)

        # 4. Analyze success patterns
        success_patterns = self._analyze_success_patterns(valid_products)

        # 5. Calculate opportunity scores
        opportunity_areas = self._calculate_opportunities(
            underserved, success_patterns, valid_products
        )

        return {
            "category": category_name,
            "total_products": len(products),
            "products_with_attributes": len(valid_products),
            "total_combinations": len(combinations),
            "underserved_combinations": underserved,
            "oversaturated_combinations": oversaturated,
            "success_patterns": success_patterns,
            "opportunity_areas": opportunity_areas
        }

    def _create_combination_matrix(self, products: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Create matrix of attribute combinations

        Args:
            products: List of products with attributes

        Returns:
            Dict mapping combination keys to product lists
        """
        combinations = defaultdict(list)

        for product in products:
            attrs = product.get("attributes", {})

            # Extract key attributes
            primary_benefit = attrs.get("benefits", {}).get("primary_benefit", "Unknown")
            price_tier = attrs.get("price_tier", "Unknown")
            key_actives = attrs.get("ingredients", {}).get("key_actives", [])
            skin_types = attrs.get("demographics", {}).get("skin_type", [])
            clean_certs = attrs.get("certifications", {}).get("clean_beauty", [])
            ethical_certs = attrs.get("certifications", {}).get("ethical", [])

            # Skip if too many unknowns
            if primary_benefit == "Unknown" and price_tier == "Unknown":
                continue

            # Core combination: benefit + price tier
            combo_key = f"{primary_benefit}|{price_tier}"
            combinations[combo_key].append({
                "product": product,
                "combo_type": "benefit_price"
            })

            # Benefit + ingredient combinations
            for ingredient in key_actives[:3]:  # Top 3 ingredients
                combo_key = f"{primary_benefit}|{ingredient}"
                combinations[combo_key].append({
                    "product": product,
                    "combo_type": "benefit_ingredient"
                })

            # Price + certification combinations
            for cert in (clean_certs + ethical_certs)[:2]:  # Top 2 certs
                combo_key = f"{price_tier}|{cert}"
                combinations[combo_key].append({
                    "product": product,
                    "combo_type": "price_certification"
                })

            # Benefit + skin type combinations
            for skin_type in skin_types:
                if skin_type != "Unknown" and skin_type != "All Skin Types":
                    combo_key = f"{primary_benefit}|{skin_type}"
                    combinations[combo_key].append({
                        "product": product,
                        "combo_type": "benefit_skintype"
                    })

        return combinations

    def _find_underserved_combinations(self, combinations: Dict) -> List[Dict]:
        """Find attribute combinations with few products (market gaps)"""
        underserved = []

        for combo_key, products in combinations.items():
            count = len(products)

            if count > 0 and count < self.combination_threshold_low:
                parts = combo_key.split('|')

                underserved.append({
                    "combination": combo_key,
                    "attribute_1": parts[0],
                    "attribute_2": parts[1] if len(parts) > 1 else "N/A",
                    "current_products": count,
                    "opportunity_level": "high" if count == 1 else "medium",
                    "example_products": [
                        {
                            "name": p["product"].get("name", "Unknown"),
                            "asin": p["product"].get("asin"),
                            "rank": p["product"].get("rank"),
                            "rating": p["product"].get("rating")
                        }
                        for p in products[:3]
                    ]
                })

        # Sort by fewest products (biggest gaps)
        underserved.sort(key=lambda x: x["current_products"])

        logger.info(f"  - Found {len(underserved)} underserved combinations")

        return underserved[:30]  # Top 30 gaps

    def _find_oversaturated_combinations(self, combinations: Dict) -> List[Dict]:
        """Find attribute combinations with many products (competitive areas)"""
        oversaturated = []

        for combo_key, products in combinations.items():
            count = len(products)

            if count >= self.combination_threshold_high:
                parts = combo_key.split('|')

                # Calculate average rating
                ratings = [
                    p["product"].get("rating", 0)
                    for p in products
                    if p["product"].get("rating")
                ]
                avg_rating = sum(ratings) / len(ratings) if ratings else 0

                oversaturated.append({
                    "combination": combo_key,
                    "attribute_1": parts[0],
                    "attribute_2": parts[1] if len(parts) > 1 else "N/A",
                    "product_count": count,
                    "avg_rating": round(avg_rating, 2),
                    "competitiveness": "very_high" if count > 100 else "high"
                })

        # Sort by most products
        oversaturated.sort(key=lambda x: x["product_count"], reverse=True)

        logger.info(f"  - Found {len(oversaturated)} oversaturated combinations")

        return oversaturated[:20]  # Top 20 competitive areas

    def _analyze_success_patterns(self, products: List[Dict]) -> Dict:
        """Analyze patterns from top-performing products"""
        # Filter top products (high rank + high rating)
        top_products = [
            p for p in products
            if p.get("rank", 999) <= self.top_products_rank_cutoff
            and p.get("rating", 0) >= self.min_rating
        ]

        if not top_products:
            logger.warning("No top products found for success analysis")
            return self._get_empty_success_patterns()

        logger.info(f"  - Analyzing {len(top_products)} top-performing products")

        patterns = {
            "key_ingredients": Counter(),
            "benefits": Counter(),
            "certifications": Counter(),
            "price_tiers": Counter(),
            "skin_types": Counter(),
            "formula_types": Counter()
        }

        for product in top_products:
            attrs = product.get("attributes", {})

            # Ingredients
            for ingredient in attrs.get("ingredients", {}).get("key_actives", []):
                patterns["key_ingredients"][ingredient] += 1

            # Benefits
            primary_benefit = attrs.get("benefits", {}).get("primary_benefit")
            if primary_benefit and primary_benefit != "Unknown":
                patterns["benefits"][primary_benefit] += 1

            # Certifications (clean + ethical)
            for cert in attrs.get("certifications", {}).get("clean_beauty", []):
                patterns["certifications"][cert] += 1
            for cert in attrs.get("certifications", {}).get("ethical", []):
                patterns["certifications"][cert] += 1

            # Price tier
            price_tier = attrs.get("price_tier")
            if price_tier and price_tier != "Unknown":
                patterns["price_tiers"][price_tier] += 1

            # Skin types
            for skin_type in attrs.get("demographics", {}).get("skin_type", []):
                if skin_type != "Unknown":
                    patterns["skin_types"][skin_type] += 1

            # Formula type
            formula_type = attrs.get("ingredients", {}).get("formula_type")
            if formula_type and formula_type != "Unknown":
                patterns["formula_types"][formula_type] += 1

        # Convert to sorted lists
        return {
            "top_ingredients": [
                {"ingredient": ing, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for ing, count in patterns["key_ingredients"].most_common(10)
            ],
            "top_benefits": [
                {"benefit": ben, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for ben, count in patterns["benefits"].most_common(10)
            ],
            "top_certifications": [
                {"certification": cert, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for cert, count in patterns["certifications"].most_common(10)
            ],
            "top_price_tiers": [
                {"tier": tier, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for tier, count in patterns["price_tiers"].most_common(5)
            ],
            "top_skin_types": [
                {"skin_type": st, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for st, count in patterns["skin_types"].most_common(8)
            ],
            "top_formula_types": [
                {"formula": ft, "count": count, "percentage": round(count/len(top_products)*100, 1)}
                for ft, count in patterns["formula_types"].most_common(8)
            ],
            "sample_size": len(top_products)
        }

    def _calculate_opportunities(
        self,
        underserved: List[Dict],
        success_patterns: Dict,
        all_products: List[Dict]
    ) -> List[Dict]:
        """
        Calculate opportunity scores for underserved combinations

        Args:
            underserved: List of underserved combinations
            success_patterns: Success patterns from top products
            all_products: All products in category

        Returns:
            List of opportunity areas with scores
        """
        opportunities = []

        # Get success ingredients/benefits for scoring
        success_ingredients = {
            item["ingredient"]: item["percentage"]
            for item in success_patterns.get("top_ingredients", [])
        }
        success_benefits = {
            item["benefit"]: item["percentage"]
            for item in success_patterns.get("top_benefits", [])
        }

        for gap in underserved[:20]:  # Top 20 gaps
            attr1 = gap["attribute_1"]
            attr2 = gap["attribute_2"]

            # Calculate opportunity score based on:
            # 1. How underserved (fewer products = higher score)
            scarcity_score = max(0, 10 - gap["current_products"] * 3)

            # 2. Alignment with success patterns
            alignment_score = 0
            if attr1 in success_ingredients:
                alignment_score += success_ingredients[attr1] / 10
            if attr1 in success_benefits:
                alignment_score += success_benefits[attr1] / 10
            if attr2 in success_ingredients:
                alignment_score += success_ingredients[attr2] / 10
            if attr2 in success_benefits:
                alignment_score += success_benefits[attr2] / 10

            # Final score (0-10)
            opportunity_score = min(10, scarcity_score + alignment_score)

            opportunities.append({
                "combination": gap["combination"],
                "attribute_1": attr1,
                "attribute_2": attr2,
                "current_products": gap["current_products"],
                "opportunity_score": round(opportunity_score, 1),
                "rationale": self._generate_rationale(
                    gap, opportunity_score, success_patterns
                )
            })

        # Sort by opportunity score
        opportunities.sort(key=lambda x: x["opportunity_score"], reverse=True)

        return opportunities

    def _generate_rationale(
        self,
        gap: Dict,
        score: float,
        success_patterns: Dict
    ) -> str:
        """Generate human-readable rationale for opportunity"""
        attr1 = gap["attribute_1"]
        attr2 = gap["attribute_2"]
        count = gap["current_products"]

        rationale = f"Only {count} product(s) combine {attr1} with {attr2}. "

        if score >= 7:
            rationale += "High opportunity due to strong alignment with successful product patterns and low competition."
        elif score >= 5:
            rationale += "Moderate opportunity with some alignment to market success factors."
        else:
            rationale += "Low-moderate opportunity; combination exists but limited proven demand."

        return rationale

    def _get_empty_analysis(self, category_name: str) -> Dict:
        """Return empty analysis structure"""
        return {
            "category": category_name,
            "total_products": 0,
            "products_with_attributes": 0,
            "total_combinations": 0,
            "underserved_combinations": [],
            "oversaturated_combinations": [],
            "success_patterns": self._get_empty_success_patterns(),
            "opportunity_areas": []
        }

    def _get_empty_success_patterns(self) -> Dict:
        """Return empty success patterns structure"""
        return {
            "top_ingredients": [],
            "top_benefits": [],
            "top_certifications": [],
            "top_price_tiers": [],
            "top_skin_types": [],
            "top_formula_types": [],
            "sample_size": 0
        }
