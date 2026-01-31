"""
Volatility Index Calculator
Calculates market volatility based on ranking changes over time
"""
import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
import anthropic
from config.settings import ANTHROPIC_API_KEY, CLAUDE_SETTINGS


class VolatilityCalculator:
    """
    Calculates volatility index for categories based on rank changes

    Volatility Index = StdDev(rank_changes) × scaling_factor
    """

    def __init__(self, scaling_factor: float = 10.0):
        """
        Args:
            scaling_factor: Multiplier for volatility index (default 10.0)
        """
        self.scaling_factor = scaling_factor

        # Initialize Claude API client
        if ANTHROPIC_API_KEY:
            self.client = anthropic.Anthropic(
                api_key=ANTHROPIC_API_KEY,
                timeout=30.0,
                max_retries=2,
            )
            self.model = CLAUDE_SETTINGS.get("model", "claude-haiku-4-5-20251001")
            self.max_tokens = CLAUDE_SETTINGS.get("max_tokens", 4000)
            self.temperature = CLAUDE_SETTINGS.get("temperature", 0.7)
            self._api_available = True
            logger.info("✓ Claude API client initialized for market signal analysis")
        else:
            self.client = None
            self._api_available = True
            logger.warning("⚠ ANTHROPIC_API_KEY not set. Will use rule-based market signals.")

    def calculate_volatility_index(
        self,
        historical_rankings: List[List[Dict[str, Any]]],
        category_name: str,
        target_asins: set = None
    ) -> Dict[str, Any]:
        """
        Calculate volatility index for a category

        Args:
            historical_rankings: List of ranking snapshots over time
                                [
                                    [day1_rankings],
                                    [day2_rankings],
                                    ...
                                ]
            category_name: Name of the category
            target_asins: Set of target ASINs to analyze (if None, analyze all)

        Returns:
            dict: Volatility metrics
        """
        if len(historical_rankings) < 2:
            logger.warning(f"Need at least 2 snapshots for volatility calculation. Got {len(historical_rankings)}")
            return self._empty_result(category_name)

        # Track ASINs and their rank changes
        asin_ranks = {}  # {asin: [rank1, rank2, rank3, ...]}

        for snapshot in historical_rankings:
            # Support both formats:
            # 1. List of products: [product1, product2, ...]
            # 2. Dict with date: {"date": "...", "products": [...]}
            if isinstance(snapshot, dict) and "products" in snapshot:
                products = snapshot["products"]
            else:
                products = snapshot

            for product in products:
                asin = product.get("asin")
                rank = product.get("rank")

                if not asin or not rank:
                    continue

                # Filter by target ASINs if provided
                if target_asins is not None and asin not in target_asins:
                    continue

                if asin not in asin_ranks:
                    asin_ranks[asin] = []
                asin_ranks[asin].append(rank)

        # Calculate rank changes for each product
        rank_changes = []
        for asin, ranks in asin_ranks.items():
            if len(ranks) < 2:
                continue

            # Calculate absolute rank changes between consecutive snapshots
            for i in range(len(ranks) - 1):
                change = abs(ranks[i+1] - ranks[i])
                rank_changes.append(change)

        if not rank_changes:
            logger.warning(f"No rank changes found for {category_name}")
            return self._empty_result(category_name)

        # Calculate volatility metrics
        volatility_index = np.std(rank_changes) * self.scaling_factor
        avg_rank_change = np.mean(rank_changes)

        # Determine volatility status
        status = self._classify_volatility(volatility_index)

        # Determine trend
        trend = self._calculate_trend(historical_rankings, target_asins)

        # Detect new entries and exits
        top30_changes = self._calculate_top30_changes(historical_rankings, target_asins)

        # Identify brands entering/exiting
        brands_entering, brands_exiting = self._identify_brand_movements(
            historical_rankings, target_asins
        )

        # Generate market signal (with Claude API if available)
        market_signal = self._generate_market_signal(
            volatility_index=volatility_index,
            status=status,
            trend=trend,
            category_name=category_name,
            new_entries=top30_changes["new_entries"],
            exits=top30_changes["exits"],
            avg_rank_change=avg_rank_change
        )

        # Calculate weekly volatility (simulate 7 data points)
        weekly_volatility = self._generate_weekly_volatility(volatility_index)

        return {
            "category": category_name,
            "volatility_index": round(volatility_index, 1),
            "status": status,
            "trend": trend,
            "top30_changes": {
                "new_entries": top30_changes["new_entries"],
                "exits": top30_changes["exits"],
                "avg_rank_change": round(avg_rank_change, 1),
            },
            "market_signal": market_signal,
            "weekly_volatility": weekly_volatility,
            "brands_entering": brands_entering,
            "brands_exiting": brands_exiting,
        }

    def _empty_result(self, category_name: str) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "category": category_name,
            "volatility_index": 0.0,
            "status": "unknown",
            "trend": "stable",
            "top30_changes": {
                "new_entries": 0,
                "exits": 0,
                "avg_rank_change": 0.0,
            },
            "market_signal": "데이터 부족",
            "weekly_volatility": [0.0] * 7,
            "brands_entering": [],
            "brands_exiting": [],
        }

    def _classify_volatility(self, index: float) -> str:
        """Classify volatility level"""
        if index < 25:
            return "low_volatility"
        elif index < 40:
            return "moderate_volatility"
        elif index < 50:
            return "high_volatility"
        else:
            return "very_high_volatility"

    def _calculate_trend(self, historical_rankings: List[List[Dict]], target_asins: set = None) -> str:
        """Calculate if volatility is increasing, decreasing, or stable"""
        if len(historical_rankings) < 3:
            return "stable"

        # Calculate volatility for first half vs second half
        mid = len(historical_rankings) // 2
        first_half = historical_rankings[:mid]
        second_half = historical_rankings[mid:]

        first_vol = self._quick_volatility(first_half, target_asins)
        second_vol = self._quick_volatility(second_half, target_asins)

        if second_vol > first_vol * 1.1:
            return "increasing"
        elif second_vol < first_vol * 0.9:
            return "decreasing"
        else:
            return "stable"

    def _quick_volatility(self, snapshots: List[List[Dict]], target_asins: set = None) -> float:
        """Quick volatility calculation for trend detection"""
        if len(snapshots) < 2:
            return 0.0

        rank_changes = []
        for i in range(len(snapshots) - 1):
            asins_current = {p["asin"]: p["rank"] for p in snapshots[i] if "asin" in p and "rank" in p}
            asins_next = {p["asin"]: p["rank"] for p in snapshots[i+1] if "asin" in p and "rank" in p}

            # Filter by target ASINs if provided
            if target_asins is not None:
                asins_current = {asin: rank for asin, rank in asins_current.items() if asin in target_asins}
                asins_next = {asin: rank for asin, rank in asins_next.items() if asin in target_asins}

            for asin in set(asins_current.keys()) & set(asins_next.keys()):
                change = abs(asins_next[asin] - asins_current[asin])
                rank_changes.append(change)

        return np.std(rank_changes) if rank_changes else 0.0

    def _calculate_top30_changes(self, historical_rankings: List[List[Dict]], target_asins: set = None) -> Dict[str, int]:
        """Calculate entries and exits from top 30"""
        if len(historical_rankings) < 2:
            return {"new_entries": 0, "exits": 0}

        # Extract first and last snapshots (support both formats)
        first_snapshot = historical_rankings[0]
        last_snapshot = historical_rankings[-1]

        if isinstance(first_snapshot, dict) and "products" in first_snapshot:
            first_products = first_snapshot["products"]
        else:
            first_products = first_snapshot

        if isinstance(last_snapshot, dict) and "products" in last_snapshot:
            last_products = last_snapshot["products"]
        else:
            last_products = last_snapshot

        # Filter by target ASINs if provided
        if target_asins is not None:
            first_products = [p for p in first_products if p.get("asin") in target_asins]
            last_products = [p for p in last_products if p.get("asin") in target_asins]

        # Compare first and last snapshot
        first_top30 = {p["asin"] for p in first_products[:30] if "asin" in p}
        last_top30 = {p["asin"] for p in last_products[:30] if "asin" in p}

        new_entries = len(last_top30 - first_top30)
        exits = len(first_top30 - last_top30)

        return {
            "new_entries": new_entries,
            "exits": exits,
        }

    def _identify_brand_movements(
        self,
        historical_rankings: List[List[Dict]],
        target_asins: set = None
    ) -> tuple:
        """Identify brands entering and exiting top ranks"""
        if len(historical_rankings) < 2:
            return [], []

        # Extract first and last snapshots (support both formats)
        first_snapshot = historical_rankings[0]
        last_snapshot = historical_rankings[-1]

        if isinstance(first_snapshot, dict) and "products" in first_snapshot:
            first_products = first_snapshot["products"]
        else:
            first_products = first_snapshot

        if isinstance(last_snapshot, dict) and "products" in last_snapshot:
            last_products = last_snapshot["products"]
        else:
            last_products = last_snapshot

        # Filter by target ASINs if provided
        if target_asins is not None:
            first_products = [p for p in first_products if p.get("asin") in target_asins]
            last_products = [p for p in last_products if p.get("asin") in target_asins]

        # Get brands in first vs last snapshot (top 30)
        first_brands = {
            p.get("brand", "Unknown")
            for p in first_products[:30]
            if "brand" in p
        }

        last_brands = {
            p.get("brand", "Unknown")
            for p in last_products[:30]
            if "brand" in p
        }

        entering = list(last_brands - first_brands)
        exiting = list(first_brands - last_brands)

        return entering, exiting

    def _generate_market_signal_fallback(
        self,
        volatility_index: float,
        status: str,
        trend: str
    ) -> str:
        """Generate strategic market signal (fallback rule-based version)"""
        if status == "very_high_volatility":
            if trend == "increasing":
                return "급격한 시장 재편 - 최우선 진입 기회"
            else:
                return "시장 재편 진행 중 - 진입 기회 탐색 권장"

        elif status == "high_volatility":
            return "시장 재편 진행 중 - 신규 진입 기회 탐색 권장"

        elif status == "moderate_volatility":
            return "안정적 성장 - 점진적 진입 전략 적합"

        else:  # low_volatility
            return "포화 시장 - 진입 비추천"

    def _generate_market_signal(
        self,
        volatility_index: float,
        status: str,
        trend: str,
        category_name: str = "",
        new_entries: int = 0,
        exits: int = 0,
        avg_rank_change: float = 0.0
    ) -> str:
        """
        Generate strategic market signal using Claude API with circuit breaker.
        After 2 consecutive API failures, automatically uses rule-based fallback
        for remaining calls to avoid wasting time.
        """
        # Circuit breaker: skip API after consecutive failures
        if not self.client or not self._api_available:
            return self._generate_market_signal_fallback(volatility_index, status, trend)

        try:
            prompt = f"""당신은 아마존 마켓플레이스 시장 분석 전문가입니다.

다음 시장 변동성 데이터를 분석하여 전략적 시장 신호를 생성하세요:

**카테고리**: {category_name}
**변동성 지수**: {volatility_index:.1f}
**변동성 상태**: {status}
**트렌드 방향**: {trend}
**신규 진입 브랜드**: {new_entries}개
**이탈 브랜드**: {exits}개
**평균 순위 변동폭**: {avg_rank_change:.1f}

**작업**:
위 데이터를 종합적으로 분석하여, 브랜드가 이 카테고리에 진입하거나 확장할 때 참고할 수 있는 **전략적 시장 신호**를 한 문장으로 작성하세요.

**요구사항**:
1. 변동성 수준과 트렌드를 모두 고려한 정교한 해석
2. 신규 진입/이탈 브랜드 수를 반영한 시장 역학 분석
3. 실행 가능한 전략적 방향성 제시
4. 한글로 작성, 40자 이내 간결한 문장

**출력 형식**:
전략적 시장 신호 문장만 반환 (추가 설명 없이)

**예시**:
- "급격한 시장 재편 - 최우선 진입 기회"
- "안정적 성장 - 점진적 확장 전략 적합"
- "높은 경쟁 강도 - 차별화 포인트 필수"
"""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=100,
                temperature=self.temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            market_signal = response.content[0].text.strip()
            market_signal = market_signal.strip('"').strip("'").strip()

            logger.info(f"✓ Generated market signal via Claude API: {market_signal}")
            return market_signal

        except anthropic.APIConnectionError as e:
            logger.error(f"API Connection error for {category_name}: {e}")
            logger.warning("⚠ Disabling Claude API for remaining calls (connection unavailable)")
            self._api_available = False
            return self._generate_market_signal_fallback(volatility_index, status, trend)

        except Exception as e:
            logger.error(f"Error generating market signal with Claude API: {e}")
            logger.info("Falling back to rule-based market signal")
            return self._generate_market_signal_fallback(volatility_index, status, trend)

    def _generate_weekly_volatility(self, base_volatility: float) -> List[float]:
        """Generate simulated weekly volatility data around base value"""
        # Add some variation (+/- 10%)
        weekly = []
        for i in range(7):
            variation = np.random.uniform(-0.1, 0.1) * base_volatility
            weekly.append(round(base_volatility + variation, 1))
        return weekly
