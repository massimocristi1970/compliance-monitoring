## Key Features

### Dashboard Capabilities
- **📊 Interactive Compliance Tracking** - Real-time view of all compliance checks with filtering by month, year, status, and responsibility
- **📈 Automated Reporting** - Generate monthly compliance reports in JSON format with completion statistics
- **👥 Team Management** - Assign checks to team members and track individual responsibilities
- **🏢 Business Area Organization** - Categorize checks by business areas with regulatory classifications
- **📁 File Management** - Upload evidence files directly to GitHub repository with OAuth authentication

### Admin Panel
- **🔐 GitHub OAuth Authentication** - Secure login with GitHub for administrative functions
- **✏️ Full CRUD Operations** - Create, edit, and delete assignees, business areas, and compliance checks
- **🔄 Cascading Dropdowns** - Smart form fields that populate based on business area selection
- **📅 Period Selection** - Target specific months/years for check management
- **⚡ Bulk Operations** - Generate multiple checks at once for testing or planning
- **💾 Data Persistence** - All changes saved to GitHub Issues for team-wide access

### Technical Features
- **🚀 GitHub Actions CI/CD** - Automatic build and deployment on every push
- **🔥 Firebase Authentication** - Secure OAuth token management with session persistence
- **📦 Modern React Stack** - Built with React, Vite, and Tailwind CSS
- **🎨 Responsive Design** - Works on desktop, tablet, and mobile devices

 
## Dashboard URL 
 
https://massimocristi1970.github.io/compliance-monitoring/ 


## Project Structure

compliance-monitoring/
├── .github/workflows/
│   └── deploy.yml              # Automated deployment workflow
├── dashboard/
│   ├── src/
│   │   ├── ComplianceDashboard.jsx  # Main dashboard component
│   │   ├── AdminPanel.jsx           # Admin management panel
│   │   ├── firebase.js              # Firebase/OAuth configuration
│   │   └── main.jsx                 # Application entry point
│   ├── public/                      # Static assets
│   └── package.json                 # Dependencies
├── data/                       # Compliance check data by year/month
└── scripts/                    # Utility scripts