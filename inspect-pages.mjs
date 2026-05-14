import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();

  // Landing page - dark mode, OG image
  await p.goto('https://deveway-teal.vercel.app/ar');
  await p.waitForTimeout(3000);
  const landing = await p.evaluate(() => ({
    buttons: Array.from(document.querySelectorAll('button')).map(b => ({
      text: (b.textContent||'').trim().slice(0,30),
      innerHTML: b.innerHTML.slice(0,80),
      ariaLabel: b.getAttribute('aria-label'),
      className: b.className.slice(0,60)
    })).slice(0,8),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.slice(0,80),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    hreflang: document.querySelector('link[rel="alternate"][hreflang]')?.getAttribute('hreflang'),
  }));
  console.log('LANDING:', JSON.stringify(landing, null, 2));

  // Check og endpoint
  const res = await p.goto('https://deveway-teal.vercel.app/opengraph-image');
  console.log('OG_ENDPOINT_STATUS:', res?.status());

  // Sitemap
  const res2 = await p.goto('https://deveway-teal.vercel.app/sitemap.xml');
  console.log('SITEMAP_STATUS:', res2?.status());
  
  // Robots
  const res3 = await p.goto('https://deveway-teal.vercel.app/robots.txt');
  console.log('ROBOTS_STATUS:', res3?.status());
  const robotsBody = await res3?.text();
  console.log('ROBOTS_BODY:', robotsBody?.slice(0,300));

  await b.close();
})();
