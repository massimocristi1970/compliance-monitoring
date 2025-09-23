@echo off
echo Creating Compliance Monitoring System Files...

REM Create README.md
echo # Compliance Monitoring System > README.md
echo. >> README.md
echo A comprehensive compliance monitoring dashboard with GitHub integration for automated workflows, file management, and reporting. >> README.md
echo. >> README.md
echo ## Features >> README.md
echo. >> README.md
echo - 📊 Interactive dashboard for compliance tracking >> README.md
echo - 📁 Automated file organization in GitHub >> README.md
echo - 📈 Monthly and quarterly reporting >> README.md
echo - 🔄 GitHub Actions workflows for automation >> README.md
echo - 👥 Team collaboration with issue tracking >> README.md
echo - 📋 Check templates and standardized procedures >> README.md
echo. >> README.md
echo ## Dashboard URL >> README.md
echo. >> README.md
echo https://massimocristi1970.github.io/compliance-monitoring/ >> README.md

REM Create .gitignore
echo # Dependencies > .gitignore
echo node_modules/ >> .gitignore
echo npm-debug.log* >> .gitignore
echo yarn-debug.log* >> .gitignore
echo yarn-error.log* >> .gitignore
echo. >> .gitignore
echo # Build outputs >> .gitignore
echo dist/ >> .gitignore
echo build/ >> .gitignore
echo *.tgz >> .gitignore
echo. >> .gitignore
echo # Environment files >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .env.development.local >> .gitignore
echo .env.test.local >> .gitignore
echo .env.production.local >> .gitignore
echo. >> .gitignore
echo # IDE files >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo *.swp >> .gitignore
echo *.swo >> .gitignore
echo. >> .gitignore
echo # OS files >> .gitignore
echo .DS_Store >> .gitignore
echo Thumbs.db >> .gitignore
echo. >> .gitignore
echo # Logs >> .gitignore
echo logs/ >> .gitignore
echo *.log >> .gitignore
echo. >> .gitignore
echo # Python cache >> .gitignore
echo __pycache__/ >> .gitignore
echo *.pyc >> .gitignore
echo *.pyo >> .gitignore

REM Create directory structure
mkdir .github\workflows 2>nul
mkdir .github\ISSUE_TEMPLATE 2>nul
mkdir data\2024 2>nul
mkdir data\2025\january 2>nul
mkdir data\2025\february 2>nul
mkdir data\2025\march 2>nul
mkdir data\2025\april 2>nul
mkdir data\2025\may 2>nul
mkdir data\2025\june 2>nul
mkdir data\2025\july 2>nul
mkdir data\2025\august 2>nul
mkdir data\2025\september 2>nul
mkdir data\2025\october 2>nul
mkdir data\2025\november 2>nul
mkdir data\2025\december 2>nul
mkdir data\2026 2>nul
mkdir reports\monthly 2>nul
mkdir reports\quarterly 2>nul
mkdir reports\annual 2>nul
mkdir templates\check-templates 2>nul
mkdir templates\report-templates 2>nul
mkdir dashboard\src 2>nul
mkdir dashboard\data 2>nul
mkdir scripts 2>nul

REM Create sample check directories
mkdir data\2025\september\check-1 2>nul
mkdir data\2025\september\check-2 2>nul
mkdir data\2025\september\check-4 2>nul
mkdir data\2025\september\check-7 2>nul
mkdir data\2025\september\check-9 2>nul

REM Create scripts package.json
(
echo {
echo   "name": "compliance-automation",
echo   "version": "1.0.0",
echo   "description": "Automation scripts for compliance monitoring",
echo   "main": "sync-dashboard.js",
echo   "scripts": {
echo     "validate": "node validate-uploads.js",
echo     "sync": "node sync-dashboard.js",
echo     "check-overdue": "node check-overdue.js",
echo     "test": "node sync-dashboard.js"
echo   },
echo   "dependencies": {
echo     "fs-extra": "^11.1.1",
echo     "date-fns": "^2.30.0",
echo     "glob": "^10.3.10",
echo     "joi": "^17.11.0"
echo   }
echo }
) > scripts\package.json

REM Create dashboard package.json
(
echo {
echo   "name": "compliance-dashboard",
echo   "version": "1.0.0",
echo   "description": "Compliance Monitoring Dashboard",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "lucide-react": "^0.263.1",
echo     "date-fns": "^2.30.0"
echo   },
echo   "devDependencies": {
echo     "@vitejs/plugin-react": "^4.0.3",
echo     "autoprefixer": "^10.4.14",
echo     "postcss": "^8.4.27",
echo     "tailwindcss": "^3.3.3",
echo     "vite": "^4.4.5"
echo   }
echo }
) > dashboard\package.json

REM Create dashboard vite.config.js
(
echo import { defineConfig } from 'vite'
echo import react from '@vitejs/plugin-react'
echo.
echo export default defineConfig({
echo   plugins: [react^(^)],
echo   base: '/compliance-monitoring/',
echo   build: {
echo     outDir: 'dist',
echo     assetsDir: 'assets'
echo   }
echo })
) > dashboard\vite.config.js

REM Create dashboard index.html
(
echo ^<!doctype html^>
echo ^<html lang="en"^>
echo   ^<head^>
echo     ^<meta charset="UTF-8" /^>
echo     ^<link rel="icon" type="image/svg+xml" href="/compliance-monitoring/favicon.ico" /^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo     ^<title^>Compliance Monitoring Dashboard^</title^>
echo   ^</head^>
echo   ^<body^>
echo     ^<div id="root"^>^</div^>
echo     ^<script type="module" src="/src/main.jsx"^>^</script^>
echo   ^</body^>
echo ^</html^>
) > dashboard\index.html

REM Create dashboard main.jsx
(
echo import React from 'react'
echo import ReactDOM from 'react-dom/client'
echo import ComplianceDashboard from './ComplianceDashboard.jsx'
echo import './index.css'
echo.
echo ReactDOM.createRoot^(document.getElementById^('root'^)^).render^(
echo   ^<React.StrictMode^>
echo     ^<ComplianceDashboard /^>
echo   ^</React.StrictMode^>,
echo ^)
) > dashboard\src\main.jsx

REM Create dashboard index.css
(
echo @import 'tailwindcss/base';
echo @import 'tailwindcss/components';
echo @import 'tailwindcss/utilities';
echo.
echo body {
echo   margin: 0;
echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
echo     'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
echo     sans-serif;
echo   -webkit-font-smoothing: antialiased;
echo   -moz-osx-font-smoothing: grayscale;
echo }
) > dashboard\src\index.css

REM Create dashboard tailwind.config.js
(
echo /** @type {import^('tailwindcss'^).Config} */
echo export default {
echo   content: [
echo     "./index.html",
echo     "./src/**/*.{js,ts,jsx,tsx}",
echo   ],
echo   theme: {
echo     extend: {},
echo   },
echo   plugins: [],
echo }
) > dashboard\tailwind.config.js

REM Create dashboard postcss.config.js
(
echo export default {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo }
) > dashboard\postcss.config.js

REM Create Python requirements
(
echo pandas==2.1.3
echo openpyxl==3.1.2
echo jinja2==3.1.2
echo matplotlib==3.8.2
echo seaborn==0.13.0
echo python-dateutil==2.8.2
) > scripts\requirements.txt

REM Create sample metadata files
(
echo {
echo   "checkRef": 1,
echo   "businessArea": "Credit Agreements & Disclosures ^(CCA / CONC^)",
echo   "action": "Adequate Explanations",
echo   "frequency": "Annually",
echo   "number": "As needed",
echo   "responsibility": "Massimo Cristi",
echo   "lastReviewMonth": "Sep",
echo   "records": "Document",
echo   "nextReviewMonth": "Sep",
echo   "nextReviewYear": 2026,
echo   "status": "completed",
echo   "completedDate": "2024-09-15",
echo   "comments": "Review completed successfully. All explanations meet regulatory standards.",
echo   "files": ["adequate_explanations_2024.pdf"],
echo   "uploadDate": "2024-09-15T10:30:00Z",
echo   "uploadedBy": "Massimo Cristi"
echo }
) > data\2025\september\check-1\metadata.json

(
echo {
echo   "checkRef": 2,
echo   "businessArea": "Credit Agreements & Disclosures ^(CCA / CONC^)",
echo   "action": "Pre-contract information ^(PCCI^)",
echo   "frequency": "Annually",
echo   "number": "As needed",
echo   "responsibility": "Massimo Cristi",
echo   "lastReviewMonth": "Sep",
echo   "records": "Document",
echo   "nextReviewMonth": "Sep",
echo   "nextReviewYear": 2026,
echo   "status": "pending",
echo   "dueDate": "2025-09-30",
echo   "comments": "",
echo   "files": [],
echo   "uploadDate": "2024-09-01T09:00:00Z",
echo   "uploadedBy": "System"
echo }
) > data\2025\september\check-2\metadata.json

(
echo {
echo   "checkRef": 4,
echo   "businessArea": "Credit Agreements & Disclosures ^(CCA / CONC^)",
echo   "action": "Sample test of agreements ^(disclosures, repayment frequency^)",
echo   "frequency": "Quarterly",
echo   "number": 20,
echo   "responsibility": "Massimo Cristi",
echo   "lastReviewMonth": "Jun",
echo   "records": "Document",
echo   "nextReviewMonth": "Sep",
echo   "nextReviewYear": 2025,
echo   "status": "overdue",
echo   "dueDate": "2025-09-30",
echo   "comments": "Quarterly review in progress. 15 out of 20 samples completed.",
echo   "files": ["sample_test_q3_2025.xlsx"],
echo   "uploadDate": "2024-09-20T14:15:00Z",
echo   "uploadedBy": "Massimo Cristi"
echo }
) > data\2025\september\check-4\metadata.json

REM Create .gitkeep files to preserve empty directories
echo. > dashboard\data\.gitkeep
echo. > reports\monthly\.gitkeep
echo. > reports\quarterly\.gitkeep
echo. > reports\annual\.gitkeep
echo. > templates\check-templates\.gitkeep
echo. > templates\report-templates\.gitkeep

echo.
echo ✅ All files and directories created successfully!
echo.
echo Next steps:
echo 1. Run this script in your compliance-monitoring folder
echo 2. cd scripts
echo 3. npm install
echo 4. cd ..\dashboard  
echo 5. npm install
echo 6. cd ..
echo 7. git add .
echo 8. git commit -m "Initial setup with all files"
echo 9. git push origin main
echo.
echo The dashboard component will be provided separately.
pause