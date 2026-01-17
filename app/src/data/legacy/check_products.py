import json

# 분석 대상 6개 제품의 ASIN
target_asins = {
    "B00Y16CXS6": "LANEIGE Water Sleeping Mask (70ml)",
    "B0CB93H6G7": "LANEIGE Cream Skin Toner & Moisturizer (170ml)",
    "B07XXPHQZK": "LANEIGE Lip Sleeping Mask (Berry, 20g)",
    "B00PBX3L7K": "COSRX Advanced Snail 96 Mucin Power Essence",
    "B08CMS8P67": "Anua Heartleaf 77% Soothing Toner (250ml)",
    "B0B2RM68G2": "Biodance Bio-Collagen Real Deep Mask (4ea)"
}

# product_details.json 로드
with open('product_details.json', 'r', encoding='utf-8') as f:
    product_data = json.load(f)

print("=== 6개 제품 데이터 수집 현황 ===\n")
available = []
missing = []

for asin, name in target_asins.items():
    if asin in product_data:
        available.append((asin, name))
        product = product_data[asin]
        print(f"✓ {name}")
        print(f"  ASIN: {asin}")
        if 'detailed_info' in product:
            print(f"  리뷰 수: {product['detailed_info'].get('review_count', 'N/A')}")
            print(f"  평점: {product['detailed_info'].get('rating', 'N/A')}")
            print(f"  이미지 수: {len(product['detailed_info'].get('images', []))}")
            print(f"  샘플 리뷰 수: {len(product['detailed_info'].get('sample_reviews', []))}")
        print()
    else:
        missing.append((asin, name))
        print(f"✗ {name}")
        print(f"  ASIN: {asin} - 데이터 없음")
        print()

print(f"\n=== 요약 ===")
print(f"수집 완료: {len(available)}/6")
print(f"수집 필요: {len(missing)}/6")

if available:
    print(f"\n데이터 있음:")
    for asin, name in available:
        print(f"  - {name} ({asin})")

if missing:
    print(f"\n데이터 없음:")
    for asin, name in missing:
        print(f"  - {name} ({asin})")
