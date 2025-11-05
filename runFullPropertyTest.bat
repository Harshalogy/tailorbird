@echo off
echo ============================================
echo   Cloning and Running Playwright Test: TC02
echo ============================================

rem === Step 1: Clone the repo (if not already cloned) ===
set REPO_URL=https://github.com/Harshalogy/tailorbird.git
set CLONE_DIR=C:\temp\tailorbird-tests

if exist "%CLONE_DIR%" (
    echo Repository already exists. Pulling latest changes...
    cd /d "%CLONE_DIR%"
    git pull
) else (
    echo Cloning repository from %REPO_URL% ...
    git clone %REPO_URL% "%CLONE_DIR%"
    cd /d "%CLONE_DIR%"
)

rem === Step 2: Install dependencies ===
call npm install
call npx playwright install

rem === Step 3: Ask for the dropdown option dynamically ===
rem set /p OPTION="Enter property name (e.g., Creekstone at RTP): "
rem echo Running with OPTION=%OPTION%

rem === Step 4: Run Playwright test ===
call npx playwright test --headed

rem === Step 5: Show Playwright report ===
call npx playwright show-report

rem === Keep the terminal open after execution ===
echo ============================================
echo All tasks completed. Press Ctrl+C to close.
echo ============================================
cmd /k
