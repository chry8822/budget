const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const bumpType = process.argv[2] || 'patch';
const platform = process.argv[3] || 'all'; // android | ios | all
const autoSubmit = process.argv[4] === '--auto-submit' ? true : false;

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('사용법: npm run release -- [patch|minor|major] [android|ios|all] [--auto-submit]');
  process.exit(1);
}

const appJsonPath = path.join(__dirname, '..', 'app.json');
const pkgPath = path.join(__dirname, '..', 'package.json');
const releaseNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const version = appJson.expo.version;
const [major, minor, patch] = version.split('.').map(Number);

let newVersion;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// ── 릴리즈 노트 자동 생성 ──────────────────────────────────────────────────

/**
 * app.json의 버전이 현재 version 으로 처음 설정된 커밋 해시를 반환합니다.
 * 이 커밋이 "마지막 릴리즈 기준점"이 됩니다.
 */
function findLastReleasedCommit(currentVersion) {
  try {
    const lines = execSync('git log --oneline -- app.json', { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    for (const line of lines) {
      const hash = line.split(' ')[0];
      try {
        const json = JSON.parse(execSync(`git show ${hash}:app.json`, { encoding: 'utf8' }));
        if (json.expo?.version === currentVersion) {
          return hash;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

/**
 * 커밋 메시지에서 접두어(feat:, fix: 등)를 파싱해서
 * 카테고리별로 분류한 뒤 한국어 릴리즈 노트 문자열을 반환합니다.
 */
function buildReleaseNote(newVer, commits) {
  const categories = {
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    chore: [],
    docs: [],
    other: [],
  };

  const labelMap = {
    feat: '새 기능',
    fix: '버그 수정',
    perf: '성능 개선',
    refactor: '리팩토링',
    chore: '기타 변경',
    docs: '문서',
    other: '기타',
  };

  for (const { message } of commits) {
    const match = message.match(/^(\w+)[\s:：]+(.+)/);
    if (match) {
      const type = match[1].toLowerCase();
      const body = match[2].trim();
      if (categories[type]) {
        categories[type].push(body);
      } else {
        categories.other.push(body);
      }
    } else {
      categories.other.push(message.trim());
    }
  }

  // 릴리즈 노트 본문 조립
  const lines = [];
  for (const [type, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    lines.push(`**${labelMap[type]}**`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  const bumpLabel = bumpType === 'major' ? '주요 업데이트' : bumpType === 'minor' ? '기능 업데이트' : '버그 수정';
  const body = lines.join('\n').trimEnd();

  return [
    `## 출시명`,
    `한눈쏙 가계부 ${newVer} ${bumpLabel}`,
    ``,
    `---`,
    ``,
    `## ko-KR 출시 노트 (스토어용, 1개 언어)`,
    ``,
    `**v${newVer} — ${bumpLabel}**`,
    ``,
    body,
    ``,
    `---`,
  ].join('\n');
}

function generateReleaseNotes() {
  const baseCommit = findLastReleasedCommit(version);

  let rawLog;
  try {
    const range = baseCommit ? `${baseCommit}..HEAD` : 'HEAD~20..HEAD';
    rawLog = execSync(`git log --oneline ${range}`, { encoding: 'utf8' }).trim();
  } catch (_) {
    rawLog = '';
  }

  if (!rawLog) {
    console.log('ℹ️  새 커밋이 없어 릴리즈 노트를 건너뜁니다.');
    return;
  }

  const commits = rawLog
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const spaceIdx = line.indexOf(' ');
      return { hash: line.slice(0, spaceIdx), message: line.slice(spaceIdx + 1) };
    })
    // docs / readme 전용 커밋은 스토어 노트에서 제외
    .filter(c => !/^(docs|readme)/i.test(c.message));

  if (commits.length === 0) {
    console.log('ℹ️  스토어 노트에 포함할 커밋이 없습니다.');
    return;
  }

  console.log(`\n📝 릴리즈 노트 생성 중 (${commits.length}개 커밋 기준)...`);
  commits.forEach(c => console.log(`   ${c.hash.slice(0, 7)}  ${c.message}`));

  const newNote = buildReleaseNote(newVersion, commits);

  // 기존 RELEASE_NOTES.md 앞에 prepend
  const header = `# 한눈쏙 가계부 — 출시 노트 (ko-KR)\n\n`;
  let existing = '';
  if (fs.existsSync(releaseNotesPath)) {
    existing = fs.readFileSync(releaseNotesPath, 'utf8')
      .replace(/^#\s+한눈쏙.*\n+/, ''); // 기존 헤더 제거
  }

  const divider = existing.startsWith('---') ? '' : '\n---\n';
  fs.writeFileSync(releaseNotesPath, header + newNote + '\n' + divider + existing);
  console.log(`✅ RELEASE_NOTES.md 업데이트 완료 (v${newVersion})`);
}

generateReleaseNotes();

// ── 버전 파일 업데이트 ────────────────────────────────────────────────────

appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
} catch (_) {}

console.log(`\n🔖 버전 업데이트: ${version} → ${newVersion} (${bumpType})`);

const submitFlag = autoSubmit ? ' --auto-submit' : '';
console.log(`🚀 EAS 빌드 시작 (platform: ${platform}${autoSubmit ? ', 스토어 자동 제출 포함' : ', 빌드 파일만 생성'})\n`);

execSync(`npx eas-cli build --platform ${platform} --profile production${submitFlag}`, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});
