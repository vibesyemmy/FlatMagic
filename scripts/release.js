const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Function to get commits since last tag
function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%s"`).toString().split('\n');
    return commits.filter(commit => commit.length > 0); // Filter out empty commits
  } catch (error) {
    // If no tags exist, get all commits
    const commits = execSync('git log --pretty=format:"%s"').toString().split('\n');
    return commits.filter(commit => commit.length > 0);
  }
}

// Function to determine version bump type from commits
function determineVersionBump(commits) {
  let isMajor = false;
  let isMinor = false;
  let isPatch = false;

  commits.forEach(commit => {
    const commitLower = commit.toLowerCase();
    
    // Major changes (breaking changes)
    if (
      commitLower.includes('breaking change') ||
      commitLower.startsWith('feat!:') ||
      commitLower.includes('major:')
    ) {
      isMajor = true;
    }
    // Minor changes (new features)
    else if (
      commitLower.startsWith('feat:') ||
      commitLower.includes('minor:') ||
      commitLower.includes('feature:')
    ) {
      isMinor = true;
    }
    // Patch changes (fixes)
    else if (
      commitLower.startsWith('fix:') ||
      commitLower.startsWith('chore:') ||
      commitLower.startsWith('style:') ||
      commitLower.startsWith('refactor:') ||
      commitLower.startsWith('perf:') ||
      commitLower.includes('patch:')
    ) {
      isPatch = true;
    }
  });

  // Return the highest impact change type
  if (isMajor) return 'major';
  if (isMinor) return 'minor';
  if (isPatch) return 'patch';
  return 'patch'; // Default to patch if no conventional commits found
}

// Function to generate changelog content from commits
function generateChangelogContent(commits) {
  const categories = {
    '💥 Breaking Changes': [],
    '✨ New Features': [],
    '🐛 Bug Fixes': [],
    '🔧 Maintenance': []
  };

  commits.forEach(commit => {
    const commitLower = commit.toLowerCase();
    const message = commit.replace(/^(\w+:)/, '').trim();

    if (commitLower.includes('breaking change') || commitLower.startsWith('feat!:')) {
      categories['💥 Breaking Changes'].push(message);
    }
    else if (commitLower.startsWith('feat:')) {
      categories['✨ New Features'].push(message);
    }
    else if (commitLower.startsWith('fix:')) {
      categories['🐛 Bug Fixes'].push(message);
    }
    else {
      categories['🔧 Maintenance'].push(message);
    }
  });

  let content = '';
  for (const [category, messages] of Object.entries(categories)) {
    if (messages.length > 0) {
      content += `\n### ${category}\n`;
      messages.forEach(msg => content += `- ${msg}\n`);
    }
  }
  return content;
}

// Get version type from command line or determine from commits
let versionType = process.argv[2];
if (!versionType || !['major', 'minor', 'patch'].includes(versionType)) {
  const commits = getCommitsSinceLastTag();
  versionType = determineVersionBump(commits);
  console.log(`\n📊 Based on commit analysis, suggesting a ${versionType.toUpperCase()} version bump`);
  console.log('\nCommits analyzed:');
  commits.forEach(commit => console.log(`- ${commit}`));
}

// Read current version from package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const package = require(packagePath);
const currentVersion = package.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
package.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

// Get current date
const date = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Generate changelog content
const commits = getCommitsSinceLastTag();
const changelogContent = generateChangelogContent(commits);

// Update CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const existingChangelog = fs.readFileSync(changelogPath, 'utf8');
const newChangelog = `# FlatMagic Changelog

## Version ${newVersion} (${date})
${changelogContent}

${existingChangelog}`;

fs.writeFileSync(changelogPath, newChangelog);

// Show summary and ask for confirmation
console.log('\n📦 Release Summary:');
console.log(`- Version: ${currentVersion} → ${newVersion}`);
console.log('- Changes:');
console.log(changelogContent);

// Wait for user confirmation
require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
}).question('\nDoes this look correct? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('\n❌ Release cancelled');
    process.exit(1);
  }

  try {
    // Git commands
    console.log('\n📦 Committing changes...');
    execSync('git add package.json CHANGELOG.md');
    execSync(`git commit -m "chore: bump version to ${newVersion}"`);
    execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`);
    execSync('git push origin main --tags');

    console.log(`\n✨ Successfully released version ${newVersion}!`);
    console.log('\nNext steps:');
    console.log('1. Update your Figma plugin with the new build');
    console.log('2. Test the new version thoroughly');
    console.log('3. Submit the update to Figma if ready');
  } catch (error) {
    console.error('\n❌ Error during release:', error.message);
    process.exit(1);
  }
  process.exit(0);
});
