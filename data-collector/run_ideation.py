"""
Ideation Pipeline Runner
속성 추출 및 제품 아이디어 생성만 실행 (스크래핑 제외)
기존 수집된 데이터를 사용합니다.
"""
import os
import asyncio
import json
from pathlib import Path
from datetime import datetime
from loguru import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config.settings import DATA_DIR, OUTPUT_DIR
from analyzers.attribute_extractor import AttributeExtractor
from analyzers.ideation_engine import IdeationEngine

# Setup logging
logger.add(
    "logs/ideation_{time}.log",
    rotation="10 MB",
    retention="7 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="INFO"
)


def load_latest_data():
    """가장 최근 수집된 데이터 로드"""
    # Find latest ranks file
    rank_files = sorted(DATA_DIR.glob("ranks_*.json"), reverse=True)
    product_files = sorted(DATA_DIR.glob("products_*.json"), reverse=True)

    if not rank_files:
        logger.error("No ranking data found!")
        return None, None

    latest_ranks = rank_files[0]
    latest_products = product_files[0] if product_files else None

    logger.info(f"Loading rankings from: {latest_ranks.name}")
    with open(latest_ranks, "r", encoding="utf-8") as f:
        ranks_data = json.load(f)

    products_data = {}
    if latest_products:
        logger.info(f"Loading products from: {latest_products.name}")
        with open(latest_products, "r", encoding="utf-8") as f:
            products_data = json.load(f)

    return ranks_data, products_data


async def extract_attributes(products_list, api_key):
    """Step 1: 제품 속성 추출"""
    logger.info("=" * 60)
    logger.info("STEP 1: Extracting Product Attributes")
    logger.info("=" * 60)

    extractor = AttributeExtractor(api_key=api_key)

    # Limit to avoid excessive API costs
    max_products = 50  # 최대 50개 제품만 처리
    products_to_extract = products_list[:max_products]

    logger.info(f"Extracting attributes for {len(products_to_extract)} products (max {max_products})...")

    extracted = await extractor.extract_batch(
        products_to_extract,
        show_progress=True
    )

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = OUTPUT_DIR / f"product_attributes_{timestamp}.json"
    extractor.save_results(extracted, output_path)

    logger.success(f"Extracted attributes for {len(extracted)} products")
    logger.info(f"Saved to: {output_path}")

    return extracted


async def generate_ideas(products_by_category, attributes_data, api_key):
    """Step 2: AI 제품 아이디어 생성"""
    logger.info("=" * 60)
    logger.info("STEP 2: Generating AI Product Ideas")
    logger.info("=" * 60)

    engine = IdeationEngine(api_key=api_key)

    # Merge attributes into products
    for cat_name, products in products_by_category.items():
        for product in products:
            asin = product.get("asin")
            if asin and asin in attributes_data:
                product["attributes"] = attributes_data[asin]

    # Filter categories with enough attributed products
    categories_with_attrs = {}
    for cat_name, products in products_by_category.items():
        products_with_attrs = [p for p in products if p.get("attributes")]
        if len(products_with_attrs) >= 5:  # 최소 5개로 조정 (테스트용)
            categories_with_attrs[cat_name] = products
            logger.info(f"  ✓ {cat_name}: {len(products_with_attrs)} attributed products")

    if not categories_with_attrs:
        logger.warning("No categories have sufficient attributed products")
        return None

    # Select top categories
    top_categories = dict(
        sorted(categories_with_attrs.items(), key=lambda x: len(x[1]), reverse=True)[:5]
    )

    logger.info(f"\nGenerating ideas for {len(top_categories)} categories...")

    # Generate ideas
    ideation_report = await engine.generate_for_all_categories(
        top_categories,
        ideas_per_category=3  # 카테고리당 3개 아이디어
    )

    # Save report
    engine.save_report(ideation_report)

    total_ideas = ideation_report['metadata']['total_ideas_generated']
    logger.success(f"Generated {total_ideas} product ideas!")

    return ideation_report


def copy_to_frontend(source_file: Path, dest_name: str):
    """프론트엔드 data 폴더로 결과 복사"""
    app_data_dir = Path(__file__).parent.parent / "app" / "src" / "data"
    dest_path = app_data_dir / dest_name

    if source_file.exists():
        import shutil
        shutil.copy(source_file, dest_path)
        logger.info(f"Copied to frontend: {dest_path}")
    else:
        logger.warning(f"Source file not found: {source_file}")


async def main():
    """메인 실행"""
    logger.info("=" * 60)
    logger.info("🚀 Ideation Pipeline - Attribute Extraction & Idea Generation")
    logger.info("=" * 60)

    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY not set!")
        logger.info("Set it in .env file or: export ANTHROPIC_API_KEY=your_key")
        return

    logger.info("✓ API key found")

    # Load existing data
    ranks_data, products_data = load_latest_data()
    if not ranks_data:
        return

    # Prepare products list
    all_products = []
    products_by_category = {}

    for cat_name, products in ranks_data.items():
        product_list = products if isinstance(products, list) else products.get("products", [])
        products_by_category[cat_name] = product_list

        for product in product_list:
            asin = product.get("asin")
            if asin:
                enriched = {**product}
                if products_data and asin in products_data:
                    enriched.update(products_data[asin])
                all_products.append(enriched)

    logger.info(f"Total products: {len(all_products)}")
    logger.info(f"Categories: {len(products_by_category)}")

    # Step 1: Extract attributes
    attributes = await extract_attributes(all_products, api_key)

    if not attributes:
        logger.error("Attribute extraction failed!")
        return

    # Step 2: Generate ideas
    report = await generate_ideas(products_by_category, attributes, api_key)

    if report:
        # Copy results to frontend
        logger.info("\n" + "=" * 60)
        logger.info("Copying results to frontend...")

        # Find the latest output files
        attr_files = sorted(OUTPUT_DIR.glob("product_attributes_*.json"), reverse=True)
        if attr_files:
            copy_to_frontend(attr_files[0], "product_attributes.json")

        ideation_file = OUTPUT_DIR / "product_ideation_report.json"
        if ideation_file.exists():
            copy_to_frontend(ideation_file, "product_ideation_report.json")

    logger.success("\n" + "=" * 60)
    logger.success("✅ Ideation Pipeline Complete!")
    logger.success("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
