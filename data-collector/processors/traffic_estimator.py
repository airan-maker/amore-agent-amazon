"""
Traffic Estimator
Estimates traffic percentage distribution across categories based on rankings
"""
import math
from typing import List, Dict, Any, Optional
from loguru import logger


class TrafficEstimator:
    """
    Estimates traffic distribution using inverse rank weighting

    Traffic % = (1/rank) / Σ(1/rank for all categories)

    This is an approximation since Amazon doesn't provide actual traffic data.
    """

    def __init__(self, method: str = "inverse_rank"):
        """
        Args:
            method: Estimation method
                   - inverse_rank: Simple inverse rank weighting
                   - logarithmic: Log-based weighting (more realistic)
                   - hybrid: Combines rank + review_velocity
        """
        self.method = method

    def estimate_traffic_distribution(
        self,
        product_rankings: Dict[str, int],
        product_info: Optional[Dict[str, Dict]] = None
    ) -> Dict[str, float]:
        """
        Estimate traffic percentage for each category

        Args:
            product_rankings: {category_name: rank}
            product_info: {category_name: {review_count, rating, etc}}

        Returns:
            dict: {category_name: traffic_percentage}
        """
        if not product_rankings:
            logger.warning("No rankings provided for traffic estimation")
            return {}

        if self.method == "inverse_rank":
            return self._inverse_rank_method(product_rankings)

        elif self.method == "logarithmic":
            return self._logarithmic_method(product_rankings)

        elif self.method == "hybrid" and product_info:
            return self._hybrid_method(product_rankings, product_info)

        else:
            # Fallback to inverse rank
            return self._inverse_rank_method(product_rankings)

    def _inverse_rank_method(self, rankings: Dict[str, int]) -> Dict[str, float]:
        """
        Simple inverse rank weighting

        Traffic% = (1/rank) / Σ(1/rank)
        """
        weights = {}
        for category, rank in rankings.items():
            if rank > 0:
                weights[category] = 1.0 / rank
            else:
                weights[category] = 0.0

        total_weight = sum(weights.values())

        if total_weight == 0:
            return {cat: 0.0 for cat in rankings.keys()}

        # Convert to percentages
        traffic_percentages = {
            category: (weight / total_weight) * 100
            for category, weight in weights.items()
        }

        return traffic_percentages

    def _logarithmic_method(self, rankings: Dict[str, int]) -> Dict[str, float]:
        """
        Logarithmic weighting (more realistic decay)

        Traffic% = log(101 - rank) / Σlog(101 - rank)

        Assumes ranks 1-100
        """
        weights = {}
        for category, rank in rankings.items():
            if 0 < rank <= 100:
                # log(101 - rank) gives higher weight to better ranks
                weights[category] = math.log(101 - rank)
            else:
                weights[category] = 0.0

        total_weight = sum(weights.values())

        if total_weight == 0:
            return {cat: 0.0 for cat in rankings.keys()}

        traffic_percentages = {
            category: (weight / total_weight) * 100
            for category, weight in weights.items()
        }

        return traffic_percentages

    def _hybrid_method(
        self,
        rankings: Dict[str, int],
        product_info: Dict[str, Dict]
    ) -> Dict[str, float]:
        """
        Hybrid method combining rank and review velocity

        Weight = (1/rank) × (1 + review_velocity_factor)
        """
        weights = {}

        for category, rank in rankings.items():
            if rank <= 0:
                weights[category] = 0.0
                continue

            rank_weight = 1.0 / rank

            # Add review velocity bonus if available
            if category in product_info:
                info = product_info[category]
                review_velocity = info.get("review_velocity", 0)

                # Normalize review velocity (0-1 scale)
                velocity_factor = min(review_velocity / 100, 1.0)
                rank_weight *= (1 + velocity_factor)

            weights[category] = rank_weight

        total_weight = sum(weights.values())

        if total_weight == 0:
            return {cat: 0.0 for cat in rankings.keys()}

        traffic_percentages = {
            category: (weight / total_weight) * 100
            for category, weight in weights.items()
        }

        return traffic_percentages

    def estimate_conversion_rate(
        self,
        rank: int,
        review_count: int,
        avg_rating: float
    ) -> float:
        """
        Estimate conversion rate based on rank and social proof

        CR% = base_rate × rank_factor × review_factor × rating_factor

        This is highly approximate and for demonstration purposes
        """
        # Base conversion rate (assume 5% average for e-commerce)
        base_rate = 5.0

        # Rank factor (higher rank = lower CR)
        # Rank 1 = 3x boost, Rank 100 = 0.5x
        if rank <= 0:
            rank_factor = 0.5
        else:
            rank_factor = max(0.5, 3.0 - (rank / 50))

        # Review count factor (social proof)
        # More reviews = higher trust = higher CR
        if review_count < 100:
            review_factor = 0.8
        elif review_count < 1000:
            review_factor = 1.0
        elif review_count < 5000:
            review_factor = 1.2
        else:
            review_factor = 1.5

        # Rating factor
        # 4.5+ stars = 1.2x, <4.0 stars = 0.8x
        if avg_rating >= 4.5:
            rating_factor = 1.2
        elif avg_rating >= 4.0:
            rating_factor = 1.0
        else:
            rating_factor = 0.8

        estimated_cr = base_rate * rank_factor * review_factor * rating_factor

        # Cap at reasonable range (1-15%)
        return round(min(max(estimated_cr, 1.0), 15.0), 1)

    def detect_traffic_gap(
        self,
        registered_category: str,
        traffic_distribution: Dict[str, float]
    ) -> Optional[Dict[str, Any]]:
        """
        Detect if highest traffic category differs from registered category

        Returns gap information if detected
        """
        if not traffic_distribution:
            return None

        # Find category with highest traffic
        highest_traffic_category = max(
            traffic_distribution.items(),
            key=lambda x: x[1]
        )

        category_name = highest_traffic_category[0]
        traffic_pct = highest_traffic_category[1]

        # Check if it's different from registered category
        if category_name != registered_category and traffic_pct > 30:
            # Extract last part of breadcrumb for cleaner display
            category_simple = category_name.split(" > ")[-1] if " > " in category_name else category_name

            return {
                "gap_detected": True,
                "highest_traffic_category": category_name,
                "highest_traffic_category_simple": category_simple,
                "traffic_percentage": round(traffic_pct, 1),
                "gap_insight": f"실제 트래픽의 {traffic_pct:.1f}%가 '{category_simple}' 카테고리에서 발생 - 명목 카테고리와 불일치"
            }

        return None

    def calculate_trend(
        self,
        historical_ranks: List[int]
    ) -> str:
        """
        Calculate rank trend over time

        Args:
            historical_ranks: List of ranks over time [oldest, ..., newest]

        Returns:
            str: "increasing", "decreasing", "stable"
        """
        if len(historical_ranks) < 2:
            return "stable"

        # Simple linear regression slope
        n = len(historical_ranks)
        x = list(range(n))
        y = historical_ranks

        # Calculate slope
        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return "stable"

        slope = numerator / denominator

        # Note: Lower rank number = better position
        # So negative slope = improving rank = increasing traffic
        if slope < -0.5:
            return "increasing"  # Rank improving
        elif slope > 0.5:
            return "decreasing"  # Rank declining
        else:
            return "stable"
