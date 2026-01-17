"""
Integration Test Suite for 8-Step Pipeline
Tests Steps 7 and 8 integration into main.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logger for testing
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")

class IntegrationTester:
    def __init__(self):
        self.test_results = {
            "passed": [],
            "failed": [],
            "skipped": []
        }
        self.start_time = datetime.now()

    def log_test(self, test_name, status, message=""):
        """Log test result"""
        if status == "PASS":
            self.test_results["passed"].append(test_name)
            logger.success(f"[PASS] {test_name} {message}")
        elif status == "FAIL":
            self.test_results["failed"].append(test_name)
            logger.error(f"[FAIL] {test_name} {message}")
        else:
            self.test_results["skipped"].append(test_name)
            logger.warning(f"[SKIP] {test_name} {message}")

    def print_summary(self):
        """Print test summary"""
        duration = (datetime.now() - self.start_time).total_seconds()

        logger.info("\n" + "=" * 70)
        logger.info("TEST SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Duration: {duration:.2f}s")
        logger.info(f"Total Tests: {sum(len(v) for v in self.test_results.values())}")
        logger.success(f"Passed: {len(self.test_results['passed'])}")
        logger.error(f"Failed: {len(self.test_results['failed'])}")
        logger.warning(f"Skipped: {len(self.test_results['skipped'])}")

        if self.test_results['failed']:
            logger.error("\nFailed Tests:")
            for test in self.test_results['failed']:
                logger.error(f"  - {test}")

        logger.info("=" * 70 + "\n")

        return len(self.test_results['failed']) == 0


class FileStructureTests:
    """Test file structure and imports"""

    def __init__(self, tester):
        self.tester = tester

    async def run_all(self):
        logger.info("\n[TEST SUITE 1] File Structure & Imports")
        logger.info("-" * 70)

        await self.test_main_file_exists()
        await self.test_analyzer_files_exist()
        await self.test_config_files_exist()
        await self.test_imports_valid()

    async def test_main_file_exists(self):
        main_path = Path("main.py")
        if main_path.exists():
            self.tester.log_test("main.py exists", "PASS")
        else:
            self.tester.log_test("main.py exists", "FAIL", "- File not found")

    async def test_analyzer_files_exist(self):
        required_files = [
            "analyzers/__init__.py",
            "analyzers/attribute_extractor.py",
            "analyzers/gap_analyzer.py",
            "analyzers/ideation_engine.py"
        ]

        for file_path in required_files:
            path = Path(file_path)
            if path.exists():
                self.tester.log_test(f"{file_path} exists", "PASS")
            else:
                self.tester.log_test(f"{file_path} exists", "FAIL", "- File not found")

    async def test_config_files_exist(self):
        required_files = [
            "config/categories.yaml",
            "config/scheduler_config.yaml",
            "config/attribute_schema.yaml"
        ]

        for file_path in required_files:
            path = Path(file_path)
            if path.exists():
                self.tester.log_test(f"{file_path} exists", "PASS")
            else:
                self.tester.log_test(f"{file_path} exists", "FAIL", "- File not found")

    async def test_imports_valid(self):
        try:
            from analyzers import AttributeExtractor, MarketGapAnalyzer, IdeationEngine
            self.tester.log_test("Analyzer imports", "PASS")
        except ImportError as e:
            self.tester.log_test("Analyzer imports", "FAIL", f"- {e}")


class MainPyIntegrationTests:
    """Test main.py integration changes"""

    def __init__(self, tester):
        self.tester = tester

    async def run_all(self):
        logger.info("\n[TEST SUITE 2] main.py Integration")
        logger.info("-" * 70)

        await self.test_os_import_added()
        await self.test_attributes_key_added()
        await self.test_step_counts_updated()
        await self.test_step7_call_exists()
        await self.test_step8_call_exists()
        await self.test_extract_attributes_method()
        await self.test_generate_ideas_method()
        await self.test_total_line_count()

    async def test_os_import_added(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        if "import os" in content[:500]:  # Check in first 500 chars
            self.tester.log_test("'import os' added", "PASS")
        else:
            self.tester.log_test("'import os' added", "FAIL")

    async def test_attributes_key_added(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        if '"attributes": {}' in content or "'attributes': {}" in content:
            self.tester.log_test("'attributes' key in collected_data", "PASS")
        else:
            self.tester.log_test("'attributes' key in collected_data", "FAIL")

    async def test_step_counts_updated(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        step_counts = []
        for i in range(1, 9):
            if f"[STEP {i}/8]" in content:
                step_counts.append(i)

        if len(step_counts) == 8:
            self.tester.log_test("Step counts updated to /8", "PASS", f"- Found all 8 steps")
        else:
            self.tester.log_test("Step counts updated to /8", "FAIL", f"- Found only {len(step_counts)} steps")

    async def test_step7_call_exists(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        if "await self.extract_attributes()" in content:
            self.tester.log_test("Step 7 call exists", "PASS")
        else:
            self.tester.log_test("Step 7 call exists", "FAIL")

    async def test_step8_call_exists(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        if "await self.generate_product_ideas()" in content:
            self.tester.log_test("Step 8 call exists", "PASS")
        else:
            self.tester.log_test("Step 8 call exists", "FAIL")

    async def test_extract_attributes_method(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        has_method_def = "async def extract_attributes(self):" in content
        has_docstring = "STEP 7: Extract product attributes" in content
        has_api_check = 'os.getenv("ANTHROPIC_API_KEY")' in content

        if has_method_def and has_docstring and has_api_check:
            self.tester.log_test("extract_attributes() method", "PASS")
        else:
            missing = []
            if not has_method_def: missing.append("method def")
            if not has_docstring: missing.append("docstring")
            if not has_api_check: missing.append("API key check")
            self.tester.log_test("extract_attributes() method", "FAIL", f"- Missing: {', '.join(missing)}")

    async def test_generate_ideas_method(self):
        with open("main.py", "r", encoding="utf-8") as f:
            content = f.read()

        has_method_def = "async def generate_product_ideas(self):" in content
        has_docstring = "STEP 8: Generate AI-powered product ideas" in content
        has_ideation_engine = "IdeationEngine" in content

        if has_method_def and has_docstring and has_ideation_engine:
            self.tester.log_test("generate_product_ideas() method", "PASS")
        else:
            missing = []
            if not has_method_def: missing.append("method def")
            if not has_docstring: missing.append("docstring")
            if not has_ideation_engine: missing.append("IdeationEngine")
            self.tester.log_test("generate_product_ideas() method", "FAIL", f"- Missing: {', '.join(missing)}")

    async def test_total_line_count(self):
        with open("main.py", "r", encoding="utf-8") as f:
            lines = f.readlines()

        total_lines = len(lines)
        # Should be around 809 lines (+/- 20)
        if 789 <= total_lines <= 829:
            self.tester.log_test("Line count", "PASS", f"- {total_lines} lines (expected ~809)")
        else:
            self.tester.log_test("Line count", "FAIL", f"- {total_lines} lines (expected ~809)")


class AnalyzerCodeTests:
    """Test analyzer implementation code"""

    def __init__(self, tester):
        self.tester = tester

    async def run_all(self):
        logger.info("\n[TEST SUITE 3] Analyzer Implementation")
        logger.info("-" * 70)

        await self.test_attribute_extractor_class()
        await self.test_gap_analyzer_class()
        await self.test_ideation_engine_class()
        await self.test_budget_tracker_exists()
        await self.test_cache_manager_exists()

    async def test_attribute_extractor_class(self):
        try:
            from analyzers.attribute_extractor import AttributeExtractor

            # Check required methods
            required_methods = ['extract_single', 'extract_batch', 'save_results']
            has_all = all(hasattr(AttributeExtractor, method) for method in required_methods)

            if has_all:
                self.tester.log_test("AttributeExtractor class", "PASS")
            else:
                self.tester.log_test("AttributeExtractor class", "FAIL", "- Missing required methods")
        except Exception as e:
            self.tester.log_test("AttributeExtractor class", "FAIL", f"- {e}")

    async def test_gap_analyzer_class(self):
        try:
            from analyzers.gap_analyzer import MarketGapAnalyzer

            required_methods = ['analyze_category']
            has_all = all(hasattr(MarketGapAnalyzer, method) for method in required_methods)

            if has_all:
                self.tester.log_test("MarketGapAnalyzer class", "PASS")
            else:
                self.tester.log_test("MarketGapAnalyzer class", "FAIL", "- Missing analyze_category method")
        except Exception as e:
            self.tester.log_test("MarketGapAnalyzer class", "FAIL", f"- {e}")

    async def test_ideation_engine_class(self):
        try:
            from analyzers.ideation_engine import IdeationEngine

            required_methods = ['generate_ideas_for_category', 'generate_for_all_categories', 'save_report']
            has_all = all(hasattr(IdeationEngine, method) for method in required_methods)

            if has_all:
                self.tester.log_test("IdeationEngine class", "PASS")
            else:
                self.tester.log_test("IdeationEngine class", "FAIL", "- Missing required methods")
        except Exception as e:
            self.tester.log_test("IdeationEngine class", "FAIL", f"- {e}")

    async def test_budget_tracker_exists(self):
        budget_tracker_path = Path("utils/budget_tracker.py")
        if budget_tracker_path.exists():
            try:
                from utils.budget_tracker import get_budget_tracker
                self.tester.log_test("BudgetTracker utility", "PASS")
            except ImportError as e:
                self.tester.log_test("BudgetTracker utility", "FAIL", f"- {e}")
        else:
            self.tester.log_test("BudgetTracker utility", "FAIL", "- File not found")

    async def test_cache_manager_exists(self):
        cache_manager_path = Path("utils/attribute_cache.py")
        if cache_manager_path.exists():
            try:
                from utils.attribute_cache import get_attribute_cache
                self.tester.log_test("AttributeCache utility", "PASS")
            except ImportError as e:
                self.tester.log_test("AttributeCache utility", "FAIL", f"- {e}")
        else:
            self.tester.log_test("AttributeCache utility", "FAIL", "- File not found")


class ConfigurationTests:
    """Test configuration files"""

    def __init__(self, tester):
        self.tester = tester

    async def run_all(self):
        logger.info("\n[TEST SUITE 4] Configuration Files")
        logger.info("-" * 70)

        await self.test_categories_yaml_structure()
        await self.test_scheduler_config_yaml()
        await self.test_attribute_schema_yaml()

    async def test_categories_yaml_structure(self):
        try:
            import yaml
            with open("config/categories.yaml", "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            has_hierarchy = "hierarchy" in config
            has_depth0 = has_hierarchy and "depth_0" in config["hierarchy"]
            has_depth1 = has_hierarchy and "depth_1" in config["hierarchy"]
            has_depth2 = has_hierarchy and "depth_2" in config["hierarchy"]

            if has_hierarchy and has_depth0 and has_depth1 and has_depth2:
                depth0_count = len(config["hierarchy"]["depth_0"])
                depth1_count = len(config["hierarchy"]["depth_1"])
                depth2_count = len(config["hierarchy"]["depth_2"])

                self.tester.log_test(
                    "categories.yaml structure",
                    "PASS",
                    f"- D0:{depth0_count}, D1:{depth1_count}, D2:{depth2_count}"
                )
            else:
                self.tester.log_test("categories.yaml structure", "FAIL", "- Missing hierarchy structure")
        except Exception as e:
            self.tester.log_test("categories.yaml structure", "FAIL", f"- {e}")

    async def test_scheduler_config_yaml(self):
        try:
            import yaml
            with open("config/scheduler_config.yaml", "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            has_performance = "performance" in config
            has_claude_api = "claude_api" in config

            if has_performance and has_claude_api:
                self.tester.log_test("scheduler_config.yaml", "PASS")
            else:
                missing = []
                if not has_performance: missing.append("performance")
                if not has_claude_api: missing.append("claude_api")
                self.tester.log_test("scheduler_config.yaml", "FAIL", f"- Missing: {', '.join(missing)}")
        except Exception as e:
            self.tester.log_test("scheduler_config.yaml", "FAIL", f"- {e}")

    async def test_attribute_schema_yaml(self):
        try:
            import yaml
            with open("config/attribute_schema.yaml", "r", encoding="utf-8") as f:
                schema = yaml.safe_load(f)

            required_categories = [
                "ingredients",
                "benefits",
                "certifications",
                "demographics"
            ]

            has_all = all(
                cat in schema.get("attribute_categories", {})
                for cat in required_categories
            )

            if has_all:
                self.tester.log_test("attribute_schema.yaml", "PASS")
            else:
                self.tester.log_test("attribute_schema.yaml", "FAIL", "- Missing required categories")
        except Exception as e:
            self.tester.log_test("attribute_schema.yaml", "FAIL", f"- {e}")


class RuntimeTests:
    """Test runtime behavior without API calls"""

    def __init__(self, tester):
        self.tester = tester

    async def run_all(self):
        logger.info("\n[TEST SUITE 5] Runtime Behavior (No API)")
        logger.info("-" * 70)

        await self.test_no_api_key_handling()
        await self.test_collector_instantiation()

    async def test_no_api_key_handling(self):
        """Test that pipeline handles missing API key gracefully"""
        try:
            # Ensure no API key
            if "ANTHROPIC_API_KEY" in os.environ:
                del os.environ["ANTHROPIC_API_KEY"]

            from main import DataCollectionPipeline

            collector = DataCollectionPipeline()

            # Mock collected_data
            collector.collected_data = {
                "products": {
                    "B001": {"name": "Test Product", "brand": "Test Brand"}
                },
                "ranks": {},
                "reviews": {},
                "attributes": {}
            }

            # Test extract_attributes - should skip gracefully
            await collector.extract_attributes()

            # Test generate_product_ideas - should skip gracefully
            await collector.generate_product_ideas()

            self.tester.log_test("No API key handling", "PASS", "- Graceful skip confirmed")

        except Exception as e:
            self.tester.log_test("No API key handling", "FAIL", f"- {e}")

    async def test_collector_instantiation(self):
        """Test that AmazonDataCollector can be instantiated"""
        try:
            from main import DataCollectionPipeline

            collector = DataCollectionPipeline()

            # Check that collected_data has attributes key
            if "attributes" in collector.collected_data:
                self.tester.log_test("Collector instantiation", "PASS", "- Has attributes key")
            else:
                self.tester.log_test("Collector instantiation", "FAIL", "- Missing attributes key")

        except Exception as e:
            self.tester.log_test("Collector instantiation", "FAIL", f"- {e}")


async def run_all_tests():
    """Run complete test suite"""

    logger.info("=" * 70)
    logger.info("AMAZON DATA COLLECTOR - INTEGRATION TEST SUITE")
    logger.info("Testing Steps 7 & 8 Integration")
    logger.info("=" * 70)

    tester = IntegrationTester()

    # Run all test suites
    try:
        suite1 = FileStructureTests(tester)
        await suite1.run_all()

        suite2 = MainPyIntegrationTests(tester)
        await suite2.run_all()

        suite3 = AnalyzerCodeTests(tester)
        await suite3.run_all()

        suite4 = ConfigurationTests(tester)
        await suite4.run_all()

        suite5 = RuntimeTests(tester)
        await suite5.run_all()

    except Exception as e:
        logger.error(f"Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()

    # Print summary
    success = tester.print_summary()

    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
