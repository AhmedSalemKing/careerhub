import { chromium } from 'playwright';

const BASE = 'https://deveway-teal.vercel.app';

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  // Language switcher
  await p.goto(`${BASE}/ar`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(3000);
  const lang = await p.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const langBtn = buttons.find(b => b.textContent && (b.textContent.includes('العربية') || b.textContent.includes('English')));
    return {
      found: !!langBtn,
      text: langBtn?.textContent?.trim(),
      tag: langBtn?.tagName,
    };
  });
  console.log('LANG_TOGGLE:', JSON.stringify(lang, null, 2));

  // Click language toggle
  const langBtn = p.locator('button').filter({ hasText: 'العربية' });
  const btnCount = await langBtn.count();
  console.log(`Found ${btnCount} Arabic buttons`);
  if (btnCount > 0) {
    await langBtn.first().click();
    await p.waitForTimeout(3000);
    console.log('URL after lang click:', p.url());
  }

  // Login error
  await p.goto(`${BASE}/ar/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(3000);
  
  const loginForm = await p.evaluate(() => ({
    emailInput: document.querySelector('#email') ? true : false,
    passwordInput: document.querySelector('#password') ? true : false,
    submitBtn: Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('تسجيل الدخول'))?.textContent?.trim(),
  }));
  console.log('LOGIN_FORM:', JSON.stringify(loginForm, null, 2));

  await p.fill('#email', 'wrong@test.com');
  await p.fill('#password', 'wrongpass');
  await p.locator('button').filter({ hasText: 'تسجيل الدخول' }).first().click();
  await p.waitForTimeout(5000);

  const loginResult = await p.evaluate(() => ({
    url: window.location.href,
    errorEl: document.querySelector('[class*="error"], [class*="danger"], [role="alert"], .text-red-500, [class*="text-red"]')?.textContent?.trim() || 'none',
    bodyText: document.body?.innerText?.substring(300, 800),
  }));
  console.log('LOGIN_RESULT:', JSON.stringify(loginResult, null, 2));

  // Careers page - check for path detail links
  await p.goto(`${BASE}/ar/careers`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(4000);
  const careers = await p.evaluate(() => ({
    heading: document.querySelector('h1, h2')?.textContent?.trim(),
    allLinks: Array.from(document.querySelectorAll('a[href]')).filter(a => a.getAttribute('href')?.includes('career')).map(a => ({ href: a.getAttribute('href'), text: a.textContent?.trim()?.slice(0,40) })),
    pathButtons: Array.from(document.querySelectorAll('button')).filter(b => b.textContent?.includes('ابدأ المسار')).length,
  }));
  console.log('CAREERS:', JSON.stringify(careers, null, 2));

  // Courses page - check card availability
  await p.goto(`${BASE}/ar/courses`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(5000);
  const courses = await p.evaluate(() => ({
    grid: document.querySelector('[class*="grid"]') ? true : false,
    bodyLen: document.body?.textContent?.length,
    courseLinks: Array.from(document.querySelectorAll('a[href]')).filter(a => a.getAttribute('href')?.includes('course')).map(a => ({ href: a.getAttribute('href')?.slice(0,80), text: a.textContent?.trim()?.slice(0,30) })),
    searchBtn: Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ابحث'))?.textContent?.trim(),
  }));
  console.log('COURSES:', JSON.stringify(courses, null, 2));

  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
