"""
Data Copier Utility
Copies collected data from data-collector/output to app/src/data
"""
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from loguru import logger
import yaml


class DataCopier:
    """Handles copying data files from collector output to frontend data directory"""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize DataCopier

        Args:
            config_path: Path to scheduler config YAML file
        """
        # Default paths
        self.project_root = Path(__file__).parent.parent.parent
        self.output_dir = self.project_root / "data-collector" / "output"
        self.frontend_data_dir = self.project_root / "app" / "src" / "data"

        # Load configuration
        if config_path is None:
            config_path = self.project_root / "data-collector" / "config" / "scheduler_config.yaml"

        self.config = self._load_config(config_path)

        # Ensure directories exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.frontend_data_dir.mkdir(parents=True, exist_ok=True)

    def _load_config(self, config_path: Path) -> dict:
        """Load scheduler configuration"""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.warning(f"Failed to load config from {config_path}: {e}")
            # Return default config
            return {
                "data_copy": {
                    "enabled": True,
                    "create_backup": True,
                    "backup_suffix": "_backup",
                }
            }

    def _find_latest_file(self, pattern: str) -> Optional[Path]:
        """
        Find the most recent file matching the pattern

        Args:
            pattern: File pattern (e.g., "test_5_categories_*.json")

        Returns:
            Path to the latest file, or None if not found
        """
        matching_files = list(self.output_dir.glob(pattern))

        if not matching_files:
            logger.warning(f"No files found matching pattern: {pattern}")
            return None

        # Sort by modification time (newest first)
        latest_file = max(matching_files, key=lambda p: p.stat().st_mtime)
        return latest_file

    def _create_backup(self, file_path: Path) -> bool:
        """
        Create a backup of existing file

        Args:
            file_path: Path to file to backup

        Returns:
            True if backup created successfully
        """
        if not file_path.exists():
            return True  # Nothing to backup

        try:
            backup_suffix = self.config.get("data_copy", {}).get("backup_suffix", "_backup")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # Create backup filename: category_products_backup_20240101_120000.json
            backup_name = f"{file_path.stem}{backup_suffix}_{timestamp}{file_path.suffix}"
            backup_path = file_path.parent / backup_name

            shutil.copy2(file_path, backup_path)
            logger.info(f"✓ Created backup: {backup_path.name}")
            return True

        except Exception as e:
            logger.error(f"✗ Failed to create backup for {file_path.name}: {e}")
            return False

    def copy_file(
        self,
        source_pattern: str,
        destination: str,
        use_latest: bool = False,
        create_backup: bool = True
    ) -> bool:
        """
        Copy a file from output to frontend data directory

        Args:
            source_pattern: Source file pattern (e.g., "test_5_categories_*.json")
            destination: Destination filename in frontend data directory
            use_latest: If True, find the latest file matching pattern
            create_backup: If True, backup existing destination file

        Returns:
            True if copy successful
        """
        try:
            # Find source file
            if use_latest:
                source_file = self._find_latest_file(source_pattern)
                if source_file is None:
                    logger.error(f"✗ No source file found for pattern: {source_pattern}")
                    return False
            else:
                source_file = self.output_dir / source_pattern
                if not source_file.exists():
                    logger.error(f"✗ Source file not found: {source_file}")
                    return False

            # Destination file path
            dest_file = self.frontend_data_dir / destination

            # Create backup if requested
            if create_backup and dest_file.exists():
                self._create_backup(dest_file)

            # Copy file
            shutil.copy2(source_file, dest_file)
            logger.info(f"✓ Copied: {source_file.name} → {dest_file.name}")

            # Log file size
            file_size_kb = dest_file.stat().st_size / 1024
            logger.info(f"  File size: {file_size_kb:.1f} KB")

            return True

        except Exception as e:
            logger.error(f"✗ Failed to copy {source_pattern} → {destination}: {e}")
            return False

    def copy_all_files(self) -> Dict[str, bool]:
        """
        Copy all files according to configuration

        Returns:
            Dictionary of {destination: success_status}
        """
        if not self.config.get("data_copy", {}).get("enabled", True):
            logger.warning("Data copy is disabled in configuration")
            return {}

        logger.info("=" * 60)
        logger.info("Starting data copy to frontend...")
        logger.info("=" * 60)

        file_mappings = self.config.get("data_copy", {}).get("file_mappings", [])
        create_backup = self.config.get("data_copy", {}).get("create_backup", True)

        results = {}

        for mapping in file_mappings:
            source_pattern = mapping.get("source_pattern")
            destination = mapping.get("destination")
            use_latest = mapping.get("use_latest", False)

            if not source_pattern or not destination:
                logger.warning(f"Invalid mapping configuration: {mapping}")
                continue

            logger.info(f"\nCopying: {source_pattern} → {destination}")

            success = self.copy_file(
                source_pattern=source_pattern,
                destination=destination,
                use_latest=use_latest,
                create_backup=create_backup
            )

            results[destination] = success

        # Copy historical data files
        logger.info("\n📅 Copying historical data files...")
        historical_success = self._copy_historical_files()
        results["historical_data"] = historical_success

        # Print summary
        logger.info("\n" + "=" * 60)
        logger.info("📋 Copy Summary:")
        successful = sum(1 for v in results.values() if v)
        total = len(results)
        logger.info(f"  ✓ Successful: {successful}/{total}")

        if successful < total:
            failed = [k for k, v in results.items() if not v]
            logger.warning(f"  ✗ Failed: {', '.join(failed)}")

        logger.info("=" * 60)

        return results

    def _copy_historical_files(self) -> bool:
        """
        Copy all historical test_5_categories_*.json files to frontend

        Returns:
            True if copy successful
        """
        try:
            # Find all test_5_categories_YYYYMMDD_*.json files
            historical_files = list(self.output_dir.glob("test_5_categories_202*.json"))

            if not historical_files:
                logger.warning("No historical data files found")
                return False

            # Create historical subdirectory in frontend
            historical_dir = self.frontend_data_dir / "historical"
            historical_dir.mkdir(parents=True, exist_ok=True)

            # Group files by date (YYYYMMDD) and keep only the latest for each date
            files_by_date = {}
            for file_path in historical_files:
                # Extract date from filename: test_5_categories_YYYYMMDD_*.json
                filename = file_path.name
                if filename.startswith("test_5_categories_"):
                    parts = filename.replace("test_5_categories_", "").replace(".json", "").split("_")
                    if len(parts) >= 1:
                        date_str = parts[0]  # YYYYMMDD
                        if len(date_str) == 8 and date_str.isdigit():
                            if date_str not in files_by_date:
                                files_by_date[date_str] = []
                            files_by_date[date_str].append(file_path)

            # Copy only the latest file for each date
            copied_count = 0
            for date_str, file_list in sorted(files_by_date.items()):
                # Sort by modification time and take the latest
                latest_file = max(file_list, key=lambda p: p.stat().st_mtime)

                # Destination: test_5_categories_YYYYMMDD.json (simplified name)
                dest_filename = f"test_5_categories_{date_str}.json"
                dest_path = historical_dir / dest_filename

                # Copy file
                shutil.copy2(latest_file, dest_path)
                size_kb = dest_path.stat().st_size / 1024
                logger.info(f"  ✓ {dest_filename} ({size_kb:.1f} KB)")
                copied_count += 1

            logger.success(f"✅ Copied {copied_count} historical data files")
            return True

        except Exception as e:
            logger.error(f"✗ Failed to copy historical files: {e}")
            return False

    def verify_frontend_data(self) -> bool:
        """
        Verify that all required files exist in frontend data directory

        Returns:
            True if all required files exist
        """
        required_files = [
            "category_products.json",
            "m1_breadcrumb_traffic.json",
            "m1_volatility_index.json",
            "m1_emerging_brands.json",
            "m2_usage_context.json",
            "m2_intelligence_bridge.json",
        ]

        logger.info("\n🔍 Verifying frontend data files...")

        all_exist = True
        for filename in required_files:
            file_path = self.frontend_data_dir / filename
            exists = file_path.exists()

            if exists:
                size_kb = file_path.stat().st_size / 1024
                logger.info(f"  ✓ {filename} ({size_kb:.1f} KB)")
            else:
                logger.warning(f"  ✗ {filename} - MISSING")
                all_exist = False

        # Check historical files
        historical_dir = self.frontend_data_dir / "historical"
        if historical_dir.exists():
            historical_files = list(historical_dir.glob("test_5_categories_*.json"))
            logger.info(f"\n📅 Historical data: {len(historical_files)} files")
        else:
            logger.warning("\n📅 Historical data: No files found")
            all_exist = False

        if all_exist:
            logger.success("\n✅ All required files exist in frontend data directory")
        else:
            logger.warning("\n⚠️ Some files are missing from frontend data directory")

        return all_exist


def main():
    """Standalone execution for testing"""
    logger.info("Data Copier - Standalone Execution")

    copier = DataCopier()
    results = copier.copy_all_files()

    # Verify files
    copier.verify_frontend_data()

    # Exit code based on results
    success = all(results.values())
    exit(0 if success else 1)


if __name__ == "__main__":
    main()
