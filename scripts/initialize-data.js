const fs = require('fs-extra');
const path = require('path');

async function initializeComplianceData() {
    console.log('🚀 Initializing compliance monitoring data...');
    
    // Comprehensive compliance checks based on your Excel structure
    const complianceChecks = [
        {
            checkRef: 1,
            businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
            action: "Adequate Explanations",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Sep",
            records: "Document",
            nextReviewMonth: "Sep",
            nextReviewYear: 2026,
            status: "completed",
            completedDate: "2024-09-15",
            comments: "Review completed successfully. All explanations meet regulatory standards.",
            files: ["adequate_explanations_2024.pdf"],
            uploadDate: "2024-09-15T10:30:00Z",
            uploadedBy: "Massimo Cristi",
            dueDate: "2025-09-30"
        },
        {
            checkRef: 2,
            businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
            action: "Pre-contract information (PCCI)",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Sep",
            records: "Document",
            nextReviewMonth: "Sep",
            nextReviewYear: 2026,
            status: "pending",
            dueDate: "2025-09-30",
            comments: "",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        },
        {
            checkRef: 3,
            businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
            action: "Credit Agreement / Terms & Conditions",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Sep",
            records: "Document",
            nextReviewMonth: "Sep",
            nextReviewYear: 2026,
            status: "pending",
            dueDate: "2025-09-30",
            comments: "",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        },
        {
            checkRef: 4,
            businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
            action: "Sample test of agreements (disclosures, repayment frequency)",
            frequency: "Quarterly",
            number: 20,
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Jun",
            records: "Document",
            nextReviewMonth: "Sep",
            nextReviewYear: 2025,
            status: "overdue",
            dueDate: "2025-09-30",
            comments: "Quarterly review in progress. 15 out of 20 samples completed.",
            files: ["sample_test_q3_2025.xlsx"],
            uploadDate: "2024-09-20T14:15:00Z",
            uploadedBy: "Massimo Cristi"
        },
        {
            checkRef: 7,
            businessArea: "SMCR & Governance",
            action: "Fitness & propriety (SMCR Certification)",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Oct",
            records: "Review",
            nextReviewMonth: "Oct",
            nextReviewYear: 2025,
            status: "due_soon",
            dueDate: "2025-10-31",
            comments: "",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        },
        {
            checkRef: 8,
            businessArea: "SMCR & Governance",
            action: "FCA controlled functions / approval status",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Oct",
            records: "Review",
            nextReviewMonth: "Oct",
            nextReviewYear: 2025,
            status: "due_soon",
            dueDate: "2025-10-31",
            comments: "",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        },
        {
            checkRef: 9,
            businessArea: "SMCR & Governance",
            action: "FCA notifications of breaches (SUP 15)",
            frequency: "Event-driven",
            number: "As needed",
            responsibility: "Massimo Cristi",
            records: "Report",
            status: "monitoring",
            comments: "No breaches reported this month.",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        },
        {
            checkRef: 10,
            businessArea: "SMCR & Governance",
            action: "Companies House filing (confirmation statement/accounts)",
            frequency: "Annually",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Jun",
            records: "Document",
            nextReviewMonth: "Jun",
            nextReviewYear: 2026,
            status: "completed",
            completedDate: "2024-06-15",
            dueDate: "2025-06-30",
            comments: "Annual filing completed on time.",
            files: ["companies_house_filing_2024.pdf"],
            uploadDate: "2024-06-15T10:00:00Z",
            uploadedBy: "Massimo Cristi"
        },
        {
            checkRef: 11,
            businessArea: "Collections & Arrears (CONC / Consumer Duty)",
            action: "Arrears procedures review",
            frequency: "Quarterly",
            number: "As needed",
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Sep",
            records: "Document",
            nextReviewMonth: "Dec",
            nextReviewYear: 2025,
            status: "completed",
            completedDate: "2024-09-10",
            dueDate: "2024-12-31",
            comments: "Procedures updated to reflect latest CONC guidance.",
            files: ["arrears_procedures_2024.pdf"],
            uploadDate: "2024-09-10T15:00:00Z",
            uploadedBy: "Massimo Cristi"
        },
        {
            checkRef: 12,
            businessArea: "Consumer Duty (PRIN 12 / PS24/3)",
            action: "Customer outcomes monitoring",
            frequency: "Quarterly",
            number: 100,
            responsibility: "Massimo Cristi",
            lastReviewMonth: "Sep",
            records: "Data Review",
            nextReviewMonth: "Dec",
            nextReviewYear: 2025,
            status: "pending",
            dueDate: "2025-12-31",
            comments: "",
            files: [],
            uploadDate: "2024-09-01T09:00:00Z",
            uploadedBy: "System"
        }
    ];

    try {
        // Create data structure for each check
        for (const check of complianceChecks) {
            const year = check.dueDate ? new Date(check.dueDate).getFullYear() : 2025;
            let month = 'september'; // default
            
            if (check.nextReviewMonth) {
                month = check.nextReviewMonth.toLowerCase();
            } else if (check.dueDate) {
                const dueDate = new Date(check.dueDate);
                const monthNames = [
                    'january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december'
                ];
                month = monthNames[dueDate.getMonth()];
            }
            
            const checkPath = path.join('../data', year.toString(), month, `check-${check.checkRef}`);
            await fs.ensureDir(checkPath);
            
            const metadataPath = path.join(checkPath, 'metadata.json');
            await fs.writeJson(metadataPath, check, { spaces: 2 });
            
            // Create placeholder files if they exist in metadata
            for (const fileName of check.files || []) {
                const filePath = path.join(checkPath, fileName);
                if (!await fs.pathExists(filePath)) {
                    await fs.writeFile(filePath, `Placeholder file for ${fileName}\nCreated: ${new Date().toISOString()}\nCheck: ${check.action}`);
                }
            }
        }

        console.log(`✅ Initialized ${complianceChecks.length} compliance checks`);
        
        // Sync dashboard data
        const { syncDashboardData } = require('./sync-dashboard');
        await syncDashboardData();
        
        console.log('🎉 Compliance monitoring system fully initialized!');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    initializeComplianceData().catch(console.error);
}

module.exports = { initializeComplianceData };