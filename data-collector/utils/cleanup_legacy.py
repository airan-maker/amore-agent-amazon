"""
Cleanup Legacy Data Files
Automatically removes old backup files and organizes data structure
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
from loguru import logger
import shutil

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


class LegacyDataCleaner:
    """Cleans up legacy and backup data files"""

    def __init__(self, data_dir: Path):
        """
        Initialize cleaner

        Args:
            data_dir: Path to app/src/data directory
        """
        self.data_dir = data_dir
        self.legacy_dir = data_dir / "legacy"

        # Ensure legacy directory exists
        self.legacy_dir.mkdir(exist_ok=True)

    def find_backup_files(self) -> list[Path]:
        """Find all backup files in data directory"""
        return list(self.data_dir.glob("*_backup_*.json"))

    def find_old_files(self) -> list[Path]:
        """Find all OLD files in data directory"""
        return list(self.data_dir.glob("*_OLD.json"))

    def find_temp_files(self) -> list[Path]:
        """Find temporary/development files"""
        patterns = [
            "temp_*.txt",
            "temp_*.json",
            "check_*.py",
            "test_*.txt",
            "products_for_ai_generation.json",
            "products_list.json",
            "extracted_reviews.json",
        ]

        temp_files = []
        for pattern in patterns:
            temp_files.extend(self.data_dir.glob(pattern))

        return temp_files

    def move_to_legacy(self, files: list[Path], category: str) -> int:
        """
        Move files to legacy directory

        Args:
            files: List of file paths to move
            category: Category name for logging

        Returns:
            Number of files moved
        """
        moved_count = 0

        for file_path in files:
            if file_path.exists() and file_path.is_file():
                try:
                    dest_path = self.legacy_dir / file_path.name
                    shutil.move(str(file_path), str(dest_path))
                    logger.debug(f"Moved {file_path.name} to legacy/")
                    moved_count += 1
                except Exception as e:
                    logger.error(f"Failed to move {file_path.name}: {e}")

        if moved_count > 0:
            logger.info(f"Moved {moved_count} {category} files to legacy/")

        return moved_count

    def delete_old_backups(self, days: int = 30) -> int:
        """
        Delete backup files older than specified days

        Args:
            days: Delete backups older than this many days

        Returns:
            Number of files deleted
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0

        backup_files = list(self.legacy_dir.glob("*_backup_*.json"))

        for file_path in backup_files:
            file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

            if file_mtime < cutoff_date:
                try:
                    file_path.unlink()
                    logger.debug(f"Deleted old backup: {file_path.name}")
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Failed to delete {file_path.name}: {e}")

        if deleted_count > 0:
            logger.info(f"Deleted {deleted_count} backups older than {days} days")

        return deleted_count

    def get_directory_size(self, directory: Path) -> float:
        """
        Get total size of directory in MB

        Args:
            directory: Path to directory

        Returns:
            Size in MB
        """
        total_size = 0
        for file_path in directory.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size

        return total_size / (1024 * 1024)  # Convert to MB

    def get_legacy_stats(self) -> dict:
        """Get statistics about legacy directory"""
        if not self.legacy_dir.exists():
            return {
                "exists": False,
                "file_count": 0,
                "size_mb": 0,
                "backup_count": 0,
                "old_count": 0,
            }

        backup_count = len(list(self.legacy_dir.glob("*_backup_*.json")))
        old_count = len(list(self.legacy_dir.glob("*_OLD.json")))
        total_files = len(list(self.legacy_dir.glob("*"))) - 1  # Exclude README.md

        return {
            "exists": True,
            "file_count": total_files,
            "size_mb": self.get_directory_size(self.legacy_dir),
            "backup_count": backup_count,
            "old_count": old_count,
        }

    def cleanup_all(self, delete_old_backups_days: int = None):
        """
        Run full cleanup process

        Args:
            delete_old_backups_days: If specified, delete backups older than this many days
        """
        logger.info("=" * 60)
        logger.info("Starting Legacy Data Cleanup")
        logger.info("=" * 60)

        # Get initial stats
        initial_stats = self.get_legacy_stats()

        # Find files to move
        backup_files = self.find_backup_files()
        old_files = self.find_old_files()
        temp_files = self.find_temp_files()

        logger.info(f"\nFound files to move:")
        logger.info(f"  - Backup files: {len(backup_files)}")
        logger.info(f"  - OLD files: {len(old_files)}")
        logger.info(f"  - Temp/dev files: {len(temp_files)}")

        # Move files to legacy
        total_moved = 0
        if backup_files:
            total_moved += self.move_to_legacy(backup_files, "backup")
        if old_files:
            total_moved += self.move_to_legacy(old_files, "OLD")
        if temp_files:
            total_moved += self.move_to_legacy(temp_files, "temp/dev")

        # Delete old backups if requested
        deleted_count = 0
        if delete_old_backups_days:
            logger.info(f"\nDeleting backups older than {delete_old_backups_days} days...")
            deleted_count = self.delete_old_backups(delete_old_backups_days)

        # Get final stats
        final_stats = self.get_legacy_stats()

        # Print summary
        logger.success("\n" + "=" * 60)
        logger.success("Cleanup completed!")
        logger.success("=" * 60)

        logger.info(f"\n📊 Summary:")
        logger.info(f"  - Files moved to legacy: {total_moved}")
        logger.info(f"  - Old backups deleted: {deleted_count}")
        logger.info(f"\n📁 Legacy directory:")
        logger.info(f"  - Total files: {final_stats['file_count']}")
        logger.info(f"  - Backup files: {final_stats['backup_count']}")
        logger.info(f"  - OLD files: {final_stats['old_count']}")
        logger.info(f"  - Total size: {final_stats['size_mb']:.2f} MB")

        logger.info(f"\n✅ Current data directory is now clean!")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Cleanup legacy data files")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(__file__).parent.parent.parent / "app" / "src" / "data",
        help="Path to app/src/data directory",
    )
    parser.add_argument(
        "--delete-old-backups",
        type=int,
        metavar="DAYS",
        help="Delete backups older than N days",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually doing it",
    )

    args = parser.parse_args()

    # Validate data directory
    if not args.data_dir.exists():
        logger.error(f"Data directory not found: {args.data_dir}")
        return 1

    cleaner = LegacyDataCleaner(args.data_dir)

    if args.dry_run:
        logger.info("DRY RUN MODE - No files will be modified")

        backup_files = cleaner.find_backup_files()
        old_files = cleaner.find_old_files()
        temp_files = cleaner.find_temp_files()

        logger.info(f"\nWould move {len(backup_files)} backup files")
        logger.info(f"Would move {len(old_files)} OLD files")
        logger.info(f"Would move {len(temp_files)} temp/dev files")

        if args.delete_old_backups:
            logger.info(f"\nWould delete backups older than {args.delete_old_backups} days")

        stats = cleaner.get_legacy_stats()
        logger.info(f"\nCurrent legacy directory: {stats['file_count']} files, {stats['size_mb']:.2f} MB")
    else:
        cleaner.cleanup_all(delete_old_backups_days=args.delete_old_backups)

    return 0


if __name__ == "__main__":
    sys.exit(main())
