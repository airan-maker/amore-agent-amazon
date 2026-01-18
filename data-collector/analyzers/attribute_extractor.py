"""
Product Attribute Extractor
Uses Claude API to extract structured attributes from product data
"""
import asyncio
import json
import yaml
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

try:
    import anthropic
except ImportError:
    logger.error("anthropic package not installed. Run: pip install anthropic")
    raise

from config.settings import CONFIG_DIR, OUTPUT_DIR
from utils.budget_tracker import get_budget_tracker
from utils.attribute_cache import get_attribute_cache


class AttributeExtractor:
    """
    Extract structured product attributes using Claude API

    Features:
    - Batch processing (5 products at a time)
    - 7-day caching to minimize costs
    - Budget tracking and enforcement
    - Retry logic with exponential backoff
    - Detailed logging and statistics
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-haiku-4-5-20251001",
        monthly_budget: float = 150.0
    ):
        """
        Initialize attribute extractor

        Args:
            api_key: Anthropic API key (or set ANTHROPIC_API_KEY env var)
            model: Claude model to use
            monthly_budget: Monthly budget limit in USD
        """
        # Initialize Claude client
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

        # Load schema
        self.schema = self._load_schema()

        # Initialize budget tracker and cache
        self.budget_tracker = get_budget_tracker(monthly_budget)
        self.cache_manager = get_attribute_cache(ttl_days=7)

        # Get performance settings from schema
        perf = self.schema.get("performance", {})
        self.batch_size = perf.get("batch_size", 5)
        self.delay_between_batches = perf.get("delay_between_batches", 2)
        self.max_retries = perf.get("retry", {}).get("max_attempts", 2)
        self.timeout = perf.get("timeout", {}).get("per_product_seconds", 15)

        logger.info(f"AttributeExtractor initialized (model: {model}, batch_size: {self.batch_size})")

    def _load_schema(self) -> Dict:
        """Load attribute schema"""
        schema_path = CONFIG_DIR / "attribute_schema.yaml"

        if not schema_path.exists():
            raise FileNotFoundError(f"Schema not found: {schema_path}")

        with open(schema_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _build_extraction_prompt(self, product_data: Dict) -> str:
        """
        Build Claude prompt for attribute extraction

        Args:
            product_data: Product information dict

        Returns:
            str: Formatted prompt
        """
        product_name = product_data.get("name", "Unknown")
        description = product_data.get("description", "")
        category = product_data.get("category", "Unknown")
        price = product_data.get("price", "Unknown")
        breadcrumb = product_data.get("breadcrumb", [])

        # Combine breadcrumb for context
        breadcrumb_str = " > ".join(breadcrumb) if breadcrumb else category

        prompt = f"""You are a beauty product analyst. Extract structured attributes from this product information.

Product Information:
- Name: {product_name}
- Category: {breadcrumb_str}
- Price: {price}
- Description: {description[:1000] if description else "No description available"}

Extract the following attributes and return ONLY a valid JSON object (no other text):

{{
  "ingredients": {{
    "key_actives": ["list of active ingredients found"],
    "formula_type": "type (e.g., Cream, Serum, Gel)",
    "texture": "texture description"
  }},
  "benefits": {{
    "primary_benefit": "main benefit (e.g., Hydration, Anti-Aging)",
    "target_concerns": ["list of concerns addressed"],
    "timeframe": "expected results timeframe",
    "clinical_claims": ["any clinical claims"]
  }},
  "certifications": {{
    "clean_beauty": ["e.g., Paraben-Free, Sulfate-Free"],
    "ethical": ["e.g., Cruelty-Free, Vegan"],
    "sustainability": ["sustainability features"],
    "origin": "origin if mentioned (e.g., K-Beauty, Made in USA)"
  }},
  "demographics": {{
    "skin_type": ["target skin types"],
    "age_group": "target age group",
    "gender_target": "Women/Men/Unisex"
  }},
  "usage": {{
    "time_of_day": "Morning/Night/Any",
    "routine_step": "skincare step (e.g., Moisturizer, Serum)",
    "application_area": "where to apply"
  }}
}}

Rules:
1. Only include information explicitly stated or strongly implied
2. Use "Unknown" for single values if not determinable
3. Use empty arrays [] for lists if no matches
4. Match values to schema categories when possible
5. Be conservative - don't guess beyond what's clear
6. Return ONLY the JSON object, no other text

JSON:"""

        return prompt

    async def extract_single(
        self,
        product_data: Dict,
        use_cache: bool = True
    ) -> Dict:
        """
        Extract attributes for a single product

        Args:
            product_data: Product information dict (must have 'asin')
            use_cache: Whether to use cached results

        Returns:
            Dict with extracted attributes
        """
        asin = product_data.get("asin")

        if not asin:
            logger.warning("Product missing ASIN, cannot extract attributes")
            return self._get_fallback_attributes()

        # Check cache first
        if use_cache:
            cached = self.cache_manager.get(asin)
            if cached:
                logger.debug(f"Cache hit for {asin}")
                return cached

        # Check budget
        if not self.budget_tracker.can_make_request():
            logger.warning(f"Budget limit reached, using fallback for {asin}")
            return self._get_fallback_attributes()

        # Build prompt
        prompt = self._build_extraction_prompt(product_data)

        # Extract with retry logic
        for attempt in range(self.max_retries):
            try:
                start_time = datetime.now()

                # Call Claude API
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=2048,
                    temperature=0.2,  # Low temperature for consistent extraction
                    messages=[{"role": "user", "content": prompt}]
                )

                # Calculate time taken
                extraction_time_ms = (datetime.now() - start_time).total_seconds() * 1000

                # Record usage
                usage_summary = self.budget_tracker.record_usage(
                    input_tokens=message.usage.input_tokens,
                    output_tokens=message.usage.output_tokens,
                    model=self.model,
                    task_type="attribute_extraction"
                )

                logger.debug(
                    f"API call for {asin}: "
                    f"${usage_summary['request_cost']:.4f} "
                    f"({message.usage.input_tokens}+{message.usage.output_tokens} tokens)"
                )

                # Parse response
                response_text = message.content[0].text
                attributes = self._parse_response(response_text)

                # Validate attributes
                if not self._validate_attributes(attributes):
                    logger.warning(f"Invalid attributes for {asin}, using fallback")
                    return self._get_fallback_attributes()

                # Add price tier based on actual price
                attributes = self._enrich_attributes(attributes, product_data)

                # Cache the result
                cache_metadata = {
                    "model": self.model,
                    "extraction_time_ms": extraction_time_ms,
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens,
                    "cost": usage_summary['request_cost']
                }

                self.cache_manager.set(asin, attributes, cache_metadata)

                return attributes

            except anthropic.APIError as e:
                logger.warning(f"Attempt {attempt + 1}/{self.max_retries} failed for {asin}: {e}")

                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    await asyncio.sleep(2 ** attempt)
                else:
                    logger.error(f"All retry attempts failed for {asin}")
                    return self._get_fallback_attributes()

            except Exception as e:
                logger.error(f"Unexpected error extracting attributes for {asin}: {e}")
                return self._get_fallback_attributes()

        return self._get_fallback_attributes()

    def _parse_response(self, response_text: str) -> Dict:
        """Parse Claude response to extract JSON"""
        try:
            # Try to extract JSON from response
            # Claude might wrap it in markdown code blocks
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)

            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find raw JSON
                json_str = response_text.strip()

            # Parse JSON
            attributes = json.loads(json_str)
            return attributes

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from response: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return self._get_fallback_attributes()

    def _validate_attributes(self, attributes: Dict) -> bool:
        """Validate extracted attributes against schema"""
        # Check minimum required structure
        required_sections = ["ingredients", "benefits", "certifications", "demographics", "usage"]

        for section in required_sections:
            if section not in attributes:
                logger.warning(f"Missing required section: {section}")
                return False

        # Check for at least one meaningful value
        has_content = (
            attributes.get("benefits", {}).get("primary_benefit") not in [None, "", "Unknown"] or
            len(attributes.get("ingredients", {}).get("key_actives", [])) > 0
        )

        return has_content

    def _enrich_attributes(self, attributes: Dict, product_data: Dict) -> Dict:
        """Enrich attributes with additional derived information"""
        # Add price tier based on actual price
        price_str = product_data.get("price", "")

        # Extract numeric price
        price_match = re.search(r'\$?([\d,]+\.?\d*)', str(price_str))

        if price_match:
            try:
                price = float(price_match.group(1).replace(',', ''))

                if price < 10:
                    price_tier = "budget"
                elif price < 20:
                    price_tier = "affordable"
                elif price < 40:
                    price_tier = "mid_range"
                elif price < 80:
                    price_tier = "premium"
                else:
                    price_tier = "luxury"

                attributes["price_tier"] = price_tier
                attributes["price_numeric"] = price

            except ValueError:
                attributes["price_tier"] = "Unknown"
        else:
            attributes["price_tier"] = "Unknown"

        return attributes

    def _get_fallback_attributes(self) -> Dict:
        """Get fallback attributes when extraction fails"""
        return {
            "ingredients": {
                "key_actives": [],
                "formula_type": "Unknown",
                "texture": "Unknown"
            },
            "benefits": {
                "primary_benefit": "Unknown",
                "target_concerns": [],
                "timeframe": "Unknown",
                "clinical_claims": []
            },
            "certifications": {
                "clean_beauty": [],
                "ethical": [],
                "sustainability": [],
                "origin": "Unknown"
            },
            "demographics": {
                "skin_type": ["Unknown"],
                "age_group": "Unknown",
                "gender_target": "Unknown"
            },
            "usage": {
                "time_of_day": "Unknown",
                "routine_step": "Unknown",
                "application_area": "Unknown"
            },
            "price_tier": "Unknown",
            "extraction_failed": True
        }

    async def extract_batch(
        self,
        products: List[Dict],
        show_progress: bool = True
    ) -> Dict[str, Dict]:
        """
        Extract attributes for multiple products in batches

        Args:
            products: List of product dicts (each must have 'asin')
            show_progress: Whether to show progress logs

        Returns:
            Dict mapping ASIN to extracted attributes
        """
        results = {}
        total_products = len(products)

        logger.info(f"Extracting attributes for {total_products} products (batch_size={self.batch_size})")

        # Statistics
        cache_hits = 0
        api_calls = 0
        failures = 0

        # Process in batches
        for i in range(0, total_products, self.batch_size):
            batch = products[i:i+self.batch_size]
            batch_num = i // self.batch_size + 1
            total_batches = (total_products + self.batch_size - 1) // self.batch_size

            if show_progress:
                logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} products)...")

            # Extract for each product in batch
            for product in batch:
                asin = product.get("asin")

                if not asin:
                    logger.warning("Product missing ASIN, skipping")
                    continue

                # Check if already in cache
                cached = self.cache_manager.get(asin)

                if cached:
                    results[asin] = cached
                    cache_hits += 1
                else:
                    # Extract
                    attributes = await self.extract_single(product, use_cache=False)
                    results[asin] = attributes

                    if attributes.get("extraction_failed"):
                        failures += 1
                    else:
                        api_calls += 1

            # Delay between batches
            if i + self.batch_size < total_products:
                await asyncio.sleep(self.delay_between_batches)

        # Log summary
        logger.success(f"✓ Extraction complete: {total_products} products")
        logger.info(f"  - Cache hits: {cache_hits}")
        logger.info(f"  - API calls: {api_calls}")
        logger.info(f"  - Failures: {failures}")

        return results

    def save_results(self, results: Dict[str, Dict], output_path: Optional[Path] = None):
        """
        Save extraction results to file

        Args:
            results: Dict mapping ASIN to attributes
            output_path: Output file path (default: product_attributes_{timestamp}.json)
        """
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = OUTPUT_DIR / f"product_attributes_{timestamp}.json"

        output_data = {
            "metadata": {
                "extraction_date": datetime.now().isoformat(),
                "total_products": len(results),
                "model": self.model,
                "schema_version": "1.0"
            },
            "products": results
        }

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)

            logger.success(f"✓ Saved attributes to: {output_path}")

        except Exception as e:
            logger.error(f"Failed to save attributes: {e}")
