#!/usr/bin/env python3
"""
Fix ranking data in test_5_categories JSON files.
This script corrects duplicate/incorrect rank values by assigning sequential ranks (1, 2, 3, ...)
based on the order of products in each category.
"""

import json
import os
from pathlib import Path

def fix_rankings_in_file(file_path):
    """Fix rankings in a single JSON file."""
    print(f"\nProcessing: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changes_made = False

    # Process each category
    for category_name, category_data in data.items():
        if not isinstance(category_data, dict) or 'products' not in category_data:
            continue

        products = category_data['products']

        # Assign sequential ranks starting from 1
        for index, product in enumerate(products, start=1):
            old_rank = product.get('rank')
            if old_rank != index:
                print(f"  {category_name}: Product at position {index} had rank {old_rank}, fixing to {index}")
                product['rank'] = index
                changes_made = True

    if changes_made:
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Fixed and saved: {file_path}")
    else:
        print(f"  [OK] No changes needed: {file_path}")

    return changes_made

def main():
    """Main function to fix all test_5_categories JSON files."""

    # Find all test_5_categories JSON files
    base_dir = Path(__file__).parent
    historical_dir = base_dir / "app" / "src" / "data" / "historical"

    if not historical_dir.exists():
        print(f"Error: Historical data directory not found: {historical_dir}")
        return

    # Get all test_5_categories files
    json_files = sorted(historical_dir.glob("test_5_categories_*.json"))

    if not json_files:
        print("No test_5_categories JSON files found")
        return

    print(f"Found {len(json_files)} files to process")

    total_changed = 0
    for json_file in json_files:
        if fix_rankings_in_file(json_file):
            total_changed += 1

    print(f"\n{'='*60}")
    print(f"Summary: {total_changed} file(s) modified out of {len(json_files)} total")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
