const fs = require('fs-extra');
const path = require('path');

async function syncDashboardData() {
    console.log('🔄 Syncing dashboard data...');
    
    const dataDir = '../data';
    const dashboardDataDir = '../dashboard/data';
    const complianceData = [];

    try {
        await fs.ensureDir(dashboardDataDir);

        if (!await fs.pathExists(dataDir)) {
            console.log('📁 No data directory found, creating empty dashboard data...');
            await fs.writeJson(path.join(dashboardDataDir, 'compliance-data.json'), [], { spaces: 2 });
            return;
        }

        const years = await fs.readdir(dataDir);
        
        for (const year of years) {
            if (!/^\d{4}$/.test(year)) continue;
            
            const yearPath = path.join(dataDir, year);
            const stats = await fs.stat(yearPath);
            if (!stats.isDirectory()) continue;
            
            const months = await fs.readdir(yearPath);
            
            for (const month of months) {
                const monthPath = path.join(yearPath, month);
                const monthStats = await fs.stat(monthPath);
                if (!monthStats.isDirectory()) continue;
                
                const checks = await fs.readdir(monthPath);
                
                for (const check of checks) {
                    if (!check.startsWith('check-')) continue;
                    
                    const checkPath = path.join(monthPath, check);
                    const checkStats = await fs.stat(checkPath);
                    if (!checkStats.isDirectory()) continue;
                    
                    const metadataPath = path.join(checkPath, 'metadata.json');
                    
                    try {
                        if (await fs.pathExists(metadataPath)) {
                            const metadata = await fs.readJson(metadataPath);
                            
                            // Get actual files in directory
                            const files = await fs.readdir(checkPath);
                            const dataFiles = files.filter(f => f !== 'metadata.json');
                            
                            complianceData.push({
                                ...metadata,
                                year: parseInt(year),
                                month: month,
                                monthNumber: getMonthNumber(month),
                                path: checkPath.replace(/\\/g, '/'),
                                files: dataFiles,
                                lastUpdated: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️  Could not read metadata for ${checkPath}:`, error.message);
                    }
                }
            }
        }

        // Write dashboard data
        await fs.writeJson(
            path.join(dashboardDataDir, 'compliance-data.json'), 
            complianceData, 
            { spaces: 2 }
        );

        // Generate summary
        const summary = generateSummary(complianceData);
        await fs.writeJson(
            path.join(dashboardDataDir, 'summary.json'),
            summary,
            { spaces: 2 }
        );

        console.log(`✅ Dashboard sync complete! Updated ${complianceData.length} checks.`);
        console.log(`📊 Status breakdown:`, summary.byStatus);
        return complianceData;

    } catch (error) {
        console.error('❌ Dashboard sync failed:', error.message);
        throw error;
    }
}

function generateSummary(data) {
    return {
        totalChecks: data.length,
        byStatus: data.reduce((acc, check) => {
            acc[check.status] = (acc[check.status] || 0) + 1;
            return acc;
        }, {}),
        byYear: data.reduce((acc, check) => {
            acc[check.year] = (acc[check.year] || 0) + 1;
            return acc;
        }, {}),
        byResponsibility: data.reduce((acc, check) => {
            acc[check.responsibility] = (acc[check.responsibility] || 0) + 1;
            return acc;
        }, {}),
        byBusinessArea: data.reduce((acc, check) => {
            acc[check.businessArea] = (acc[check.businessArea] || 0) + 1;
            return acc;
        }, {}),
        lastUpdated: new Date().toISOString()
    };
}

function getMonthNumber(monthName) {
    const months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    return months[monthName.toLowerCase()] || 1;
}

if (require.main === module) {
    syncDashboardData().catch(console.error);
}

module.exports = { syncDashboardData };