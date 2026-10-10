const fs = require('fs');
const dir = 'D:/careerhub/apps/web/src';
const results = [];
const walk = (d) => {
  const items = fs.readdirSync(d);
  items.forEach((i) => {
    const p = d + '/' + i;
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(i)) {
      const c = fs.readFileSync(p, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, idx) => {
        if (!/[\u0600-\u06FF]/.test(l)) return;
        const t = l.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        const hasLocaleGuard = /isAr|locale\s*===|locale\s*==\s*'ar'|\bar\s*\?\s*'|\(ar\s*\?|isRtl|direction|locale === 'en'|language\s*===\s*'ar'|lang\s*===\s*'ar'|currentLocale|useLocale\(\)/.test(l);
        const isDataField = /titleAr|titleEn|textAr|textEn|descriptionAr|descriptionEn|labelAr|labelEn|on: 'ar'|step\.titleAr|n\.titleAr|\.titleAr\|\||\.titleEn\|\||contentAr\|\||contentEn\|\|/.test(l);
        const isComment = /console\.log|console\.error|Debug|\u2705|\u274c/.test(l);
        if (!hasLocaleGuard && !isDataField && !isComment) {
          results.push(p.replace('D:/careerhub/apps/web/src/', '') + ':' + (idx + 1) + ': ' + t.substring(0, 150));
        }
      });
    }
  });
};
walk(dir);
console.log('REMAINING ' + results.length + ' matches');
results.forEach((r) => console.log(r));