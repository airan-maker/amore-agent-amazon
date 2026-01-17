"""
Quick test to verify Claude 3 Sonnet model works
"""
import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_model():
    """Test Claude 3 Sonnet model"""

    # Check if API key is set
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print("[ERROR] ANTHROPIC_API_KEY not set")
        print("[OK] This is expected - graceful degradation works!")
        print("\nTo test with API:")
        print("  export ANTHROPIC_API_KEY=your_key")
        print("  python test_claude_model.py")
        return False

    print("[OK] ANTHROPIC_API_KEY found")
    print(f"[KEY] API Key: {api_key[:20]}...")

    # Try to import anthropic
    try:
        import anthropic
        print("[OK] anthropic package imported")
    except ImportError:
        print("[ERROR] anthropic package not installed")
        print("Run: pip install anthropic")
        return False

    # Test the model
    try:
        print("\n[TEST] Testing Claude 3 Sonnet model...")
        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": "Say 'Model test successful!' in exactly 3 words."
            }]
        )

        response = message.content[0].text
        print(f"[OK] Model response: {response}")
        print(f"[OK] Input tokens: {message.usage.input_tokens}")
        print(f"[OK] Output tokens: {message.usage.output_tokens}")

        # Calculate cost (Claude 3 Sonnet: $3/M input, $15/M output)
        input_cost = (message.usage.input_tokens / 1_000_000) * 3
        output_cost = (message.usage.output_tokens / 1_000_000) * 15
        total_cost = input_cost + output_cost

        print(f"[COST] Test cost: ${total_cost:.6f}")

        print("\n[SUCCESS] Claude 3 Sonnet model works perfectly!")
        return True

    except Exception as e:
        print(f"[ERROR] Model test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_model()
    sys.exit(0 if success else 1)
