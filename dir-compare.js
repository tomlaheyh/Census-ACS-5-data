// dir-compare.js
const fs = require('fs');
const https = require('https');

// Get command line argument and check for proper usage
const githubRepo = process.argv[2];
if (!githubRepo) {
    console.log('\nDirectory Comparison Tool for GitHub Repositories');
    console.log('------------------------------------------------');
    console.log('Usage: node dir-compare.js username/repository');
    console.log('\nExample:');
    console.log('node dir-compare.js tomlaheyh/Census-ACS-5-data');
    process.exit(1);
}

// Get local directory structure with dates and sizes
function getLocalStructure(dir = '.') {
    const items = {};
    fs.readdirSync(dir).forEach(file => {
        if (file !== '.git' && file !== 'node_modules') {
            const stats = fs.statSync(file);
            items[file] = {
                modifiedDate: stats.mtime,
                size: stats.size
            };
        }
    });
    return items;
}

// Get GitHub repository structure with dates and sizes
function getGitHubStructure(repo) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${repo}/contents`,
            headers: {
                'User-Agent': 'Directory-Compare-Tool'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const items = {};
                    JSON.parse(data).forEach(item => {
                        items[item.name] = {
                            modifiedDate: new Date(item.last_modified),
                            size: item.size
                        };
                    });
                    resolve(items);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// Compare structures and show differences
async function compareDirectories() {
    try {
        const localFiles = getLocalStructure();
        const githubFiles = await getGitHubStructure(githubRepo);

        console.log('\nComparing local directory with GitHub repository...\n');

        // Compare files that exist in both
        Object.keys(localFiles).forEach(file => {
            if (githubFiles[file]) {
                const localDate = localFiles[file].modifiedDate;
                const githubDate = githubFiles[file].modifiedDate;
                const localSize = localFiles[file].size;
                const githubSize = githubFiles[file].size;

                if (localDate > githubDate) {
                    console.log(`${file} is newer locally:`);
                    console.log(`  Local: ${localDate.toISOString()}`);
                    console.log(`  GitHub: ${githubDate.toISOString()}`);
                }

                if (localSize !== githubSize) {
                    console.log(`${file} has different sizes:`);
                    console.log(`  Local: ${localSize} bytes`);
                    console.log(`  GitHub: ${githubSize} bytes`);
                }
            } else {
                console.log(`Only in local: ${file}`);
            }
        });

        // Check files only in GitHub
        Object.keys(githubFiles).forEach(file => {
            if (!localFiles[file]) {
                console.log(`Only in GitHub: ${file}`);
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

compareDirectories();