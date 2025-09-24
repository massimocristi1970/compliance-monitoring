const fs = require('fs-extra');
const path = require('path');

async function checkOverdueItems() {
    console.log('⏰ Checking for overdue compliance items...');
    
    const dashboardDataPath = '../dashboard/data/compliance-data.json';
    const overdueOutputPath = 'overdue-checks.json';
    
    try {
        if (!await fs.pathExists(dashboardDataPath)) {
            console.log('📊 No dashboard data found, running sync first...');
            const { syncDashboardData } = require('./sync-dashboard');
            await syncDashboardData();
        }

        const complianceData = await fs.readJson(dashboardDataPath);
        const today = new Date();
        const overdueItems = [];

        for (const check of complianceData) {
            if (check.status === 'completed') continue;
            
            const dueDate = check.dueDate ? new Date(check.dueDate) : null;
            
            if (dueDate && dueDate < today) {
                const timeDiff = today.getTime() - dueDate.getTime();
                const daysOverdue = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                overdueItems.push({
                    checkRef: check.checkRef,
                    action: check.action,
                    businessArea: check.businessArea,
                    responsibility: check.responsibility,
                    dueDate: check.dueDate,
                    daysOverdue: daysOverdue,
                    status: check.status,
                    path: check.path,
                    priority: daysOverdue > 30 ? 'HIGH' : daysOverdue > 14 ? 'MEDIUM' : 'LOW',
                    githubUsername: getGithubUsername(check.responsibility)
                });
            }
        }

        // Sort by days overdue (most overdue first)
        overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);

        await fs.writeJson(overdueOutputPath, overdueItems, { spaces: 2 });

        if (overdueItems.length > 0) {
            console.log(`🚨 Found ${overdueItems.length} overdue items:`);
            overdueItems.forEach(item => {
                console.log(`  - Check #${item.checkRef}: ${item.daysOverdue} days overdue (${item.priority} priority)`);
            });
        } else {
            console.log('✅ No overdue items found!');
        }

        return overdueItems;

    } catch (error) {
        console.error('❌ Overdue check failed:', error.message);
        throw error;
    }
}

function getGithubUsername(responsibility) {
    const userMapping = {
        'Massimo Cristi': 'massimocristi1970',
        'Alex Cross': 'alex-cross',
        'Zoe Quick': 'zoe-quick',
        'Yigal Gluzman': 'yigal-gluzman'
    };
    
    return userMapping[responsibility] || null;
}

if (require.main === module) {
    checkOverdueItems().catch(console.error);
}

module.exports = { checkOverdueItems };