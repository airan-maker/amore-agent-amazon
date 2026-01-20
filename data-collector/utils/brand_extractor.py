"""
Brand extraction utility
Extracts brand name from product name using multiple strategies
Ported from frontend AIMarketAnalysis.jsx logic
"""
import re
from typing import Optional

# Known multi-word brands (2+ words)
KNOWN_BRANDS = [
    'Amazon Basics', 'Tree Hut', 'La Roche-Posay', 'Summer Fridays',
    "Burt's Bees", 'Hero Cosmetics', 'Mighty Patch', 'Kate Somerville',
    'The Ordinary', 'Drunk Elephant', 'Tower 28', 'Glow Recipe',
    'Youth To The People', 'First Aid Beauty', 'Sol de Janeiro',
    'Fresh Rose', "Kiehl's", 'Mario Badescu', 'Peter Thomas Roth',
    'Dr. Jart+', 'Tatcha', 'SK-II', 'Estée Lauder', 'Clinique',
    'MAC', 'NARS', 'Urban Decay', 'Too Faced', 'Benefit',
    'Maybelline New York', 'NYX Professional Makeup', 'e.l.f.',
    'Wet n Wild', 'Milani', "L'Oréal Paris", 'Revlon',
    'Neutrogena', 'CeraVe', 'Cetaphil', 'Aquaphor', 'Eucerin',
    'Aveeno', 'Dove', 'Olay', 'Garnier', 'Nivea',
    'The INKEY List', "Paula's Choice", 'Pixi', 'Glossier',
    'Fenty Beauty', 'Rare Beauty', 'Rhode', 'Huda Beauty',
    'Charlotte Tilbury', 'Pat McGrath Labs', 'Anastasia Beverly Hills',
    'LANEIGE', 'Innisfree', 'COSRX', 'Some By Mi', 'Etude House',
    'medicube', 'Anua', 'Beauty of Joseon', 'SKIN1004',
    # Additional common brands
    'Maybelline', 'NYX', 'essence', 'Julep', 'Revlon', 'Covergirl',
    'L3 Level 3', 'Nutrafol', 'Nizoral', 'KAHI', 'Dr.Melaxin',
    'grace & stella', 'Good Molecules', 'TruSkin', 'Differin',
    'Paula\'s Choice', 'The Ordinary', 'Vichy', 'Bioderma',
    'Kosas', 'Merit', 'Ilia', 'RMS Beauty', 'Saie', 'Lawless',
    'About Face', 'Jones Road', 'Westman Atelier', 'Kjaer Weis',
]

# Brand patterns for regex matching
BRAND_PATTERNS = [
    # Brand followed by specific keywords
    re.compile(r'^([A-Z][A-Za-z0-9\'\s&.]+?)\s+(?:Shea|Dewy|Hydrating|Moisturizing|Exfoliating|Vitamin|Hypoallergenic|Natural|Organic|Professional|Beauty|Cosmetics|Skincare|Makeup)', re.IGNORECASE),
    # Brand followed by product type
    re.compile(r'^([A-Z][A-Za-z0-9\'\s&.]+?)\s+(?:Lip|Face|Skin|Eye|Body|Hair|Nail|Anti-|Lash|Brow|Mascara|Foundation|Concealer|Powder|Blush|Bronzer|Highlighter|Primer|Setting|Serum|Cream|Lotion|Oil|Balm|Mask|Cleanser|Toner|Moisturizer|Sunscreen|SPF)', re.IGNORECASE),
    # Brand followed by dash or numbers
    re.compile(r'^([A-Z][A-Za-z0-9\'\s&.]+?)\s*(?:-|™|®|\d)'),
    # Special single-letter brands
    re.compile(r'^(eos|EOS)(?:\s|$)'),
    re.compile(r'^(e\.l\.f\.|elf)(?:\s|$)', re.IGNORECASE),
]


def extract_brand_from_name(product_name: str, existing_brand: Optional[str] = None) -> str:
    """
    Extract brand from product name using multiple strategies

    Args:
        product_name: Product name/title
        existing_brand: Already extracted brand (if any)

    Returns:
        Extracted brand name or 'Unknown'
    """
    # If we already have a valid brand, use it
    if existing_brand and existing_brand.strip() and existing_brand != 'Unknown':
        return existing_brand.strip()

    if not product_name:
        return 'Unknown'

    product_name = product_name.strip()
    name_lower = product_name.lower()

    # 1. Check against known multi-word brands (case-insensitive)
    for brand in KNOWN_BRANDS:
        if name_lower.startswith(brand.lower()):
            return brand

    # 2. Try pattern matching for common brand formats
    for pattern in BRAND_PATTERNS:
        match = pattern.match(product_name)
        if match:
            brand = match.group(1).strip()
            # Exclude too-long matches (likely not just brand name)
            if len(brand) < 50 and len(brand.split()) <= 4:
                return brand

    # 3. Fallback: first 1-2 words
    words = re.split(r'[\s-]', product_name)
    if len(words) >= 1:
        first_word = words[0]

        # If first word looks like a brand (starts with capital, reasonable length)
        if first_word and len(first_word) >= 2:
            # Check if second word might be part of brand name
            if len(words) >= 2 and words[1] and re.match(r'^[A-Z]', words[1]):
                # Two-word brand
                return f"{words[0]} {words[1]}"
            else:
                # Single-word brand
                return first_word

    return 'Unknown'


def enrich_product_with_brand(product: dict) -> dict:
    """
    Enrich a product dict with extracted brand

    Args:
        product: Product dictionary with 'product_name' and optionally 'brand'

    Returns:
        Product dict with 'brand' field populated
    """
    product_name = product.get('product_name') or product.get('name', '')
    existing_brand = product.get('brand')

    extracted_brand = extract_brand_from_name(product_name, existing_brand)
    product['brand'] = extracted_brand

    return product
