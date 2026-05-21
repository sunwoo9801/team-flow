// backend/scripts/postbuild.js
// nest build 후 자동 실행 (package.json "postbuild" 스크립트)
// generated/prisma/에 package.json이 없으면 ESM으로 해석되는 문제 방지

const fs = require('fs');
const path = require('path');

const targets = [
  // Prisma generated client 디렉터리들에 CJS 강제 지정
  path.join(__dirname, '..', 'generated', 'prisma'),
  path.join(__dirname, '..', 'generated', 'prisma', 'client'),
];

const content = JSON.stringify({ type: 'commonjs' }, null, 2);

for (const dir of targets) {
  if (fs.existsSync(dir)) {
    const pkgPath = path.join(dir, 'package.json');
    fs.writeFileSync(pkgPath, content, 'utf-8');
    console.log(`✅ postbuild: wrote ${pkgPath}`);
  }
}
