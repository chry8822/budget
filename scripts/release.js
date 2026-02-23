const fs = require('fs');
const { execSync } = require('child_process');

const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('사용법: npm run release -- [patch|minor|major]');
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
const version = appJson.expo.version;
const [major, minor, patch] = version.split('.').map(Number);

let newVersion;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
if (bumpType === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;

appJson.expo.version = newVersion;
fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2));

console.log(`버전 업데이트: ${version} → ${newVersion} (${bumpType})`);
console.log('EAS 빌드 시작...');

execSync('eas build --platform android --profile production', {
  stdio: 'inherit',
});
