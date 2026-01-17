#!/usr/bin/env python3
"""
Remove duplicate ASINs from category_products.json
Keeps the first occurrence of each ASIN across all categories
"""

import json
import shutil
from pathlib import Path
from datetime import datetime

def remove_duplicate_asins(input_file, output_file=None, backup=True):
    """
    Remove duplicate ASINs from category products data

    Args:
        input_file: Path to category_products.json
        output_file: Path to save cleaned data (default: overwrite input)
        backup: Whether to create backup before modifying (default: True)
    """
    input_path = Path(input_file)

    # Create backup if requested
    if backup:
        backup_path = input_path.parent / f"{input_path.stem}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}{input_path.suffix}"
        shutil.copy2(input_path, backup_path)
        print(f"[OK] Backup created: {backup_path}")

    # Load data
    print(f"[INFO] Loading data from {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Track seen ASINs globally and statistics
    seen_asins = set()
    total_products = 0
    total_duplicates = 0
    duplicate_details = []

    # Process each category
    for category_name, category_data in data.items():
        if not category_data.get('success') or 'products' not in category_data:
            continue

        products = category_data['products']
        total_products += len(products)

        # Filter out duplicates
        unique_products = []
        duplicates_in_category = []

        for product in products:
            asin = product.get('asin')
            if not asin:
                unique_products.append(product)
                continue

            if asin in seen_asins:
                duplicates_in_category.append({
                    'asin': asin,
                    'name': product.get('product_name', 'Unknown'),
                    'category': category_name
                })
                total_duplicates += 1
            else:
                seen_asins.add(asin)
                unique_products.append(product)

        # Update category with unique products only
        category_data['products'] = unique_products

        if duplicates_in_category:
            duplicate_details.extend(duplicates_in_category)
            print(f"  [WARNING] {category_name}: Removed {len(duplicates_in_category)} duplicate(s)")

    # Print summary
    print(f"\n[SUMMARY]")
    print(f"  - Total products: {total_products}")
    print(f"  - Duplicates removed: {total_duplicates}")
    print(f"  - Unique products: {total_products - total_duplicates}")

    if duplicate_details:
        print(f"\n[DUPLICATES REMOVED]")
        # Group by ASIN
        asin_groups = {}
        for dup in duplicate_details:
            asin = dup['asin']
            if asin not in asin_groups:
                asin_groups[asin] = []
            asin_groups[asin].append(dup)

        for asin, dups in asin_groups.items():
            print(f"  - {asin}: {dups[0]['name']}")
            print(f"    Removed from: {', '.join(d['category'] for d in dups)}")

    # Save cleaned data
    output_path = Path(output_file) if output_file else input_path
    print(f"\n[SAVE] Saving cleaned data to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Done! Cleaned data saved successfully.")
    return total_products - total_duplicates, total_duplicates


if __name__ == "__main__":
    import sys
    import io

    # Set UTF-8 encoding for stdout on Windows
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

    # Default path
    default_path = "app/src/data/category_products.json"

    # Use command line argument if provided
    input_file = sys.argv[1] if len(sys.argv) > 1 else default_path

    print("ASIN Duplicate Remover")
    print("=" * 50)

    try:
        unique_count, dup_count = remove_duplicate_asins(input_file)
        print(f"\n[SUCCESS] {dup_count} duplicates removed, {unique_count} unique products remain.")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
