const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const bumpType = process.argv[2] || 'patch';
const platform = process.argv[3] || 'all'; // android | ios | all

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('사용법: npm run release -- [patch|minor|major] [android|ios|all]');
  process.exit(1);
}

const appJsonPath = path.join(__dirname, '..', 'app.json');
const pkgPath = path.join(__dirname, '..', 'package.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const version = appJson.expo.version;
const [major, minor, patch] = version.split('.').map(Number);

let newVersion;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

// package.json 버전도 동기화
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
} catch (_) {}

console.log(`버전 업데이트: ${version} → ${newVersion} (${bumpType})`);
console.log('EAS 빌드 시작... (npx eas-cli)');

execSync(`npx eas-cli build --platform ${platform} --profile production`, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
