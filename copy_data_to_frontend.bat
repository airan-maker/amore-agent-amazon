@echo off
REM Copy latest product data to frontend

echo Copying latest product data to frontend...

REM Find the most recent test_5_categories JSON file
for /f "delims=" %%i in ('dir /b /od "data-collector\output\test_5_categories_*.json"') do set LATEST_FILE=%%i

if not defined LATEST_FILE (
    echo No test data found!
    exit /b 1
)

echo Found latest file: %LATEST_FILE%

REM Copy to frontend data folder
copy "data-collector\output\%LATEST_FILE%" "app\src\data\category_products.json"

echo Data copied successfully!
echo You can now run: cd app && npm run dev
