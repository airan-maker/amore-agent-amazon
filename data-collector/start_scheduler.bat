@echo off
REM Start the automated data collection scheduler
REM 자동 데이터 수집 스케줄러 시작

echo ============================================================
echo   Amazon Data Collection Scheduler
echo ============================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting scheduler...
echo.
echo The scheduler will run data collection at the configured time.
echo Press Ctrl+C to stop the scheduler.
echo.

REM Run the scheduler
cd /d "%~dp0"
python run_scheduler.py

pause
