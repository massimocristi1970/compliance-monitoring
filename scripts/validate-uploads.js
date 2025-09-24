const fs = require('fs-extra');
const path = require('path');
const Joi = require('joi');

const metadataSchema = Joi.object({
    checkRef: Joi.number().integer().positive().required(),
    businessArea: Joi.string().required(),
    action: Joi.string().required(),
    frequency: Joi.string().required(),
    responsibility: Joi.string().required(),
    status: Joi.string().valid('pending', 'completed', 'overdue', 'due_soon', 'monitoring').required(),
    uploadDate: Joi.string().isoDate().required(),
    uploadedBy: Joi.string().required(),
    files: Joi.array().items(Joi.string()).default([]),
    comments: Joi.string().allow('').default(''),
    dueDate: Joi.string().allow('').optional(),
    completedDate: Joi.string().allow('').optional(),
    lastReviewMonth: Joi.string().optional(),
    nextReviewMonth: Joi.string().optional(),
    nextReviewYear: Joi.number().optional(),
    records: Joi.string().optional(),
    number: [Joi.number(), Joi.string()]
});

async function validateFileStructure() {
    console.log('🔍 Validating compliance file structure...');
    
    const dataDir = '../data';
    let errors = [];
    let validFiles = 0;

    try {
        if (!await fs.pathExists(dataDir)) {
            console.log('📁 Creating data directory...');
            await fs.ensureDir(dataDir);
            return;
        }

        const years = await fs.readdir(dataDir);
        
        for (const year of years) {
            if (!/^\d{4}$/.test(year)) {
                errors.push(`Invalid year folder: ${year} (must be 4-digit year)`);
                continue;
            }

            const yearPath = path.join(dataDir, year);
            const stats = await fs.stat(yearPath);
            if (!stats.isDirectory()) continue;
            
            const months = await fs.readdir(yearPath);
            
            for (const month of months) {
                const validMonths = [
                    'january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december'
                ];
                
                if (!validMonths.includes(month.toLowerCase())) {
                    errors.push(`Invalid month folder: ${month} (must be lowercase month name)`);
                    continue;
                }

                const monthPath = path.join(yearPath, month);
                const monthStats = await fs.stat(monthPath);
                if (!monthStats.isDirectory()) continue;
                
                const checks = await fs.readdir(monthPath);
                
                for (const check of checks) {
                    if (!check.match(/^check-\d+$/)) {
                        errors.push(`Invalid check folder: ${check} (must be format: check-N)`);
                        continue;
                    }

                    const checkPath = path.join(monthPath, check);
                    await validateCheckFolder(checkPath, errors);
                    validFiles++;
                }
            }
        }

        if (errors.length > 0) {
            console.error('❌ Validation errors found:');
            errors.forEach(error => console.error(`  - ${error}`));
            process.exit(1);
        } else {
            console.log(`✅ Validation successful! Processed ${validFiles} check folders.`);
        }

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

async function validateCheckFolder(checkPath, errors) {
    const metadataPath = path.join(checkPath, 'metadata.json');
    
    if (await fs.pathExists(metadataPath)) {
        try {
            const metadata = await fs.readJson(metadataPath);
            const { error } = metadataSchema.validate(metadata);
            
            if (error) {
                errors.push(`Invalid metadata in ${checkPath}: ${error.message}`);
                return;
            }

            // Validate that referenced files exist
            for (const file of metadata.files || []) {
                const filePath = path.join(checkPath, file);
                if (!await fs.pathExists(filePath)) {
                    console.warn(`⚠️  Referenced file not found: ${filePath}`);
                }
            }

        } catch (error) {
            errors.push(`Cannot read metadata in ${checkPath}: ${error.message}`);
        }
    } else {
        // Create basic metadata if missing
        const checkRef = parseInt(path.basename(checkPath).replace('check-', ''));
        const basicMetadata = {
            checkRef,
            businessArea: 'Unknown',
            action: 'Unknown',
            frequency: 'Unknown',
            responsibility: 'Unknown',
            status: 'pending',
            uploadDate: new Date().toISOString(),
            uploadedBy: 'system',
            files: [],
            comments: ''
        };
        
        await fs.writeJson(metadataPath, basicMetadata, { spaces: 2 });
        console.log(`📝 Created basic metadata for ${checkPath}`);
    }
}

if (require.main === module) {
    validateFileStructure().catch(console.error);
}

module.exports = { validateFileStructure };