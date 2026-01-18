"""
Claude API Budget Tracker
Tracks API usage and costs to stay within monthly budget
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional
from loguru import logger

from config.settings import DATA_DIR


class APIBudgetTracker:
    """
    Track Claude API usage and enforce monthly budget limits

    Pricing (Claude 3.5 Sonnet as of 2025):
    - Input: $3 per 1M tokens
    - Output: $15 per 1M tokens
    """

    # Pricing per million tokens
    PRICING = {
        "claude-haiku-4-5-20251001": {
            "input": 1.0,   # $1 per 1M input tokens
            "output": 5.0   # $5 per 1M output tokens
        },
        "claude-3-5-sonnet-20241022": {
            "input": 3.0,   # $3 per 1M input tokens
            "output": 15.0  # $15 per 1M output tokens
        },
        "claude-3-opus-20240229": {
            "input": 15.0,
            "output": 75.0
        },
        "claude-3-haiku-20240307": {
            "input": 0.25,
            "output": 1.25
        }
    }

    def __init__(self, monthly_limit: float = 150.0):
        """
        Initialize budget tracker

        Args:
            monthly_limit: Maximum monthly spend in USD (default: $150)
        """
        self.monthly_limit = monthly_limit
        self.usage_file = DATA_DIR / "api_usage.json"
        self.usage_data = self._load_usage()

    def _load_usage(self) -> Dict:
        """Load usage data from file"""
        if self.usage_file.exists():
            try:
                with open(self.usage_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load usage data: {e}, starting fresh")
                return {}
        return {}

    def _save_usage(self):
        """Save usage data to file"""
        try:
            self.usage_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.usage_file, "w", encoding="utf-8") as f:
                json.dump(self.usage_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save usage data: {e}")

    def get_current_month_key(self) -> str:
        """Get current month key (YYYY-MM format)"""
        return datetime.now().strftime("%Y-%m")

    def record_usage(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str = "claude-haiku-4-5-20251001",
        task_type: str = "attribute_extraction"
    ) -> Dict:
        """
        Record API usage and calculate cost

        Args:
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens used
            model: Model identifier
            task_type: Type of task (for tracking purposes)

        Returns:
            Dict with cost breakdown and current totals
        """
        # Get pricing for model
        if model not in self.PRICING:
            logger.warning(f"Unknown model {model}, using Haiku 4.5 pricing")
            model = "claude-haiku-4-5-20251001"

        pricing = self.PRICING[model]

        # Calculate costs
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        total_cost = input_cost + output_cost

        # Get current month
        month_key = self.get_current_month_key()

        # Initialize month data if needed
        if month_key not in self.usage_data:
            self.usage_data[month_key] = {
                "total_cost": 0.0,
                "total_requests": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "by_task_type": {},
                "by_model": {},
                "requests": []
            }

        month_data = self.usage_data[month_key]

        # Update totals
        month_data["total_cost"] += total_cost
        month_data["total_requests"] += 1
        month_data["total_input_tokens"] += input_tokens
        month_data["total_output_tokens"] += output_tokens

        # Track by task type
        if task_type not in month_data["by_task_type"]:
            month_data["by_task_type"][task_type] = {
                "cost": 0.0,
                "requests": 0,
                "input_tokens": 0,
                "output_tokens": 0
            }

        task_stats = month_data["by_task_type"][task_type]
        task_stats["cost"] += total_cost
        task_stats["requests"] += 1
        task_stats["input_tokens"] += input_tokens
        task_stats["output_tokens"] += output_tokens

        # Track by model
        if model not in month_data["by_model"]:
            month_data["by_model"][model] = {
                "cost": 0.0,
                "requests": 0
            }

        model_stats = month_data["by_model"][model]
        model_stats["cost"] += total_cost
        model_stats["requests"] += 1

        # Record individual request
        month_data["requests"].append({
            "timestamp": datetime.now().isoformat(),
            "model": model,
            "task_type": task_type,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": total_cost
        })

        # Save to file
        self._save_usage()

        # Check budget warnings
        self._check_budget_warnings(month_data["total_cost"])

        # Return summary
        return {
            "request_cost": total_cost,
            "month_total": month_data["total_cost"],
            "budget_remaining": self.monthly_limit - month_data["total_cost"],
            "budget_used_percent": (month_data["total_cost"] / self.monthly_limit) * 100
        }

    def _check_budget_warnings(self, current_cost: float):
        """Check and log budget warnings"""
        percent_used = (current_cost / self.monthly_limit) * 100

        if percent_used >= 95:
            logger.error(
                f"🚨 API BUDGET CRITICAL: {percent_used:.1f}% used "
                f"(${current_cost:.2f} / ${self.monthly_limit:.2f})"
            )
        elif percent_used >= 80:
            logger.warning(
                f"⚠️  API budget warning: {percent_used:.1f}% used "
                f"(${current_cost:.2f} / ${self.monthly_limit:.2f})"
            )

    def can_make_request(self, estimated_cost: float = 0.05) -> bool:
        """
        Check if request is within budget

        Args:
            estimated_cost: Estimated cost of next request (default: $0.05)

        Returns:
            bool: True if within budget
        """
        month_key = self.get_current_month_key()

        if month_key not in self.usage_data:
            return True

        current_cost = self.usage_data[month_key]["total_cost"]

        # Block if over 95% of budget
        if current_cost >= self.monthly_limit * 0.95:
            logger.error(
                f"❌ Request blocked: Monthly budget limit reached "
                f"(${current_cost:.2f} / ${self.monthly_limit:.2f})"
            )
            return False

        # Warn if next request would exceed budget
        if current_cost + estimated_cost > self.monthly_limit:
            logger.warning(
                f"⚠️  Next request may exceed budget "
                f"(Current: ${current_cost:.2f}, Estimate: +${estimated_cost:.2f})"
            )

        return True

    def get_monthly_stats(self, month: Optional[str] = None) -> Dict:
        """
        Get statistics for a specific month

        Args:
            month: Month key (YYYY-MM) or None for current month

        Returns:
            Dict with monthly statistics
        """
        month_key = month or self.get_current_month_key()

        if month_key not in self.usage_data:
            return {
                "month": month_key,
                "total_cost": 0.0,
                "total_requests": 0,
                "budget_limit": self.monthly_limit,
                "budget_remaining": self.monthly_limit,
                "budget_used_percent": 0.0
            }

        month_data = self.usage_data[month_key]

        return {
            "month": month_key,
            "total_cost": month_data["total_cost"],
            "total_requests": month_data["total_requests"],
            "total_input_tokens": month_data["total_input_tokens"],
            "total_output_tokens": month_data["total_output_tokens"],
            "budget_limit": self.monthly_limit,
            "budget_remaining": self.monthly_limit - month_data["total_cost"],
            "budget_used_percent": (month_data["total_cost"] / self.monthly_limit) * 100,
            "by_task_type": month_data.get("by_task_type", {}),
            "by_model": month_data.get("by_model", {})
        }

    def print_monthly_report(self, month: Optional[str] = None):
        """Print detailed monthly usage report"""
        stats = self.get_monthly_stats(month)

        logger.info("=" * 60)
        logger.info(f"📊 Claude API Usage Report - {stats['month']}")
        logger.info("=" * 60)
        logger.info(f"Total Cost: ${stats['total_cost']:.2f}")
        logger.info(f"Budget Limit: ${stats['budget_limit']:.2f}")
        logger.info(f"Budget Remaining: ${stats['budget_remaining']:.2f}")
        logger.info(f"Budget Used: {stats['budget_used_percent']:.1f}%")
        logger.info(f"Total Requests: {stats['total_requests']:,}")
        logger.info(f"Total Input Tokens: {stats['total_input_tokens']:,}")
        logger.info(f"Total Output Tokens: {stats['total_output_tokens']:,}")

        if "by_task_type" in stats and stats["by_task_type"]:
            logger.info("\nBy Task Type:")
            for task, task_stats in stats["by_task_type"].items():
                logger.info(
                    f"  - {task}: ${task_stats['cost']:.2f} "
                    f"({task_stats['requests']} requests)"
                )

        if "by_model" in stats and stats["by_model"]:
            logger.info("\nBy Model:")
            for model, model_stats in stats["by_model"].items():
                logger.info(
                    f"  - {model}: ${model_stats['cost']:.2f} "
                    f"({model_stats['requests']} requests)"
                )

        logger.info("=" * 60)

    def reset_month(self, month: Optional[str] = None):
        """
        Reset usage data for a specific month (use with caution!)

        Args:
            month: Month key (YYYY-MM) or None for current month
        """
        month_key = month or self.get_current_month_key()

        if month_key in self.usage_data:
            logger.warning(f"Resetting usage data for {month_key}")
            del self.usage_data[month_key]
            self._save_usage()
        else:
            logger.info(f"No usage data found for {month_key}")


# Singleton instance
_budget_tracker_instance = None


def get_budget_tracker(monthly_limit: float = 150.0) -> APIBudgetTracker:
    """Get or create budget tracker singleton instance"""
    global _budget_tracker_instance

    if _budget_tracker_instance is None:
        _budget_tracker_instance = APIBudgetTracker(monthly_limit)

    return _budget_tracker_instance
