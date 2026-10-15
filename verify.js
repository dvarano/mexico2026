/* verify.js: drives the real index.html in Chromium and checks the data, the
   day-switching clock, every tab at phone width, and the shopping ticks.
     npm i playwright && node verify.js
   Set SHOTS=1 to also write screenshots to ./shots/. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const FILE = 'file://' + path.join(__dirname, 'index.html');
let pass = 0, fail = 0;
function ok(cond, msg){
  if(cond){ pass++; } else { fail++; console.log('  FAIL ' + msg); }
}

async function open(browser, iso, opts = {}){
  const ctx = await browser.newContext({ viewport:{ width:390, height:844 }, colorScheme: opts.dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
  await page.clock.setFixedTime(new Date(iso));
  await page.goto(FILE);
  return { ctx, page, errors };
}
const state = page => page.evaluate(() => ({ tab, day: DAYS[cur].d }));
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

(async () => {
  const browser = await chromium.launch();

  console.log('§1 data');
  {
    const { ctx, page, errors } = await open(browser, '2026-10-12T17:00:00Z');
    const r = await page.evaluate(() => {
      const bad = [];
      DAYS.forEach((D, i) => {
        if(D.d !== 2 + i) bad.push('day order ' + D.d);
        if(!CITIES[D.city]) bad.push('city ' + D.d);
        if(D.stay && !STAYS[D.stay]) bad.push('stay ' + D.d);
        if(!D.items.length) bad.push('empty ' + D.d);
        let prev = '';
        D.items.forEach(x => {
          const all = [x.d, x.todo || ''].join(' ');
          if(x.at && !/^\d\d:\d\d$/.test(x.at)) bad.push('at format ' + D.d + ' ' + x.t);
          if(x.at && x.at < prev) bad.push('at order ' + D.d + ' ' + x.t);
          if(x.at) prev = x.at;
          if(x.ok && !STATUS[x.ok]) bad.push('status ' + x.ok);
          if(x.res && !x.ok) bad.push('res without status ' + x.res);
          if((all.match(/\*\*/g) || []).length % 2) bad.push('unbalanced bold ' + D.d + ' ' + x.t);
          (all.match(/\]\(([^)]+)\)/g) || []).forEach(l => {
            const u = l.slice(2, -1);
            if(!/^(https:\/\/|map:)/.test(u)) bad.push('link ' + u);
          });
        });
      });
      Object.entries(STAYS).forEach(([k, S]) => {
        for(let d = S.from; d < S.to; d++) if(DAYS[dayIdx(d)].stay !== k) bad.push('stay night ' + k + ' ' + d);
      });
      IDEAS.forEach(I => I.opts.forEach(o => {
        if(dayIdx(o.day) < 0) bad.push('idea day ' + o.day);
        const all = [o.p || ''].concat((o.rows || []).map(r => r[1])).join(' ');
        if((all.match(/\*\*/g) || []).length % 2) bad.push('unbalanced bold in idea ' + o.h);
        (all.match(/\]\(([^)]+)\)/g) || []).forEach(l => { const u = l.slice(2, -1); if(!/^(https:\/\/|map:)/.test(u)) bad.push('idea link ' + u); });
      }));
      SHOP.forEach(s => s.items.forEach(x => (x.on || []).forEach(d => { if(dayIdx(d) < 0) bad.push('shop day ' + d); })));
      return bad;
    });
    ok(r.length === 0, 'data problems: ' + r.join('; '));
    ok(errors.length === 0, 'page errors: ' + errors.join(' | '));
    await ctx.close();
  }

  console.log('§2 which day the site opens on');
  const cases = [
    ['2026-10-12T17:00:00Z', 'trip', 2,  'a month out: Trip tab'],
    ['2026-11-02T08:59:00Z', 'trip', 2,  'Nov 2 02:59 CDMX: still before'],
    ['2026-11-02T09:00:00Z', 'today', 2, 'Nov 2 03:00 CDMX: day 1'],
    ['2026-11-04T05:30:00Z', 'today', 3, 'Nov 3 23:30 CDMX: still the 3rd'],
    ['2026-11-04T09:00:00Z', 'today', 4, 'Nov 4 03:00 CDMX: the 4th'],
    ['2026-11-10T01:59:00Z', 'today', 9, 'Nov 9 19:59 SMA: still the 9th'],
    ['2026-11-10T03:00:00Z', 'today', 9, 'Nov 9 21:00 SMA: still the 9th (pickup is 5:00, not pre-dawn)'],
    ['2026-11-10T09:00:00Z', 'today', 10,'Nov 10 03:00 SMA: the 10th, ahead of the 5:00 AM pickup'],
    ['2026-11-11T07:59:00Z', 'today', 10,'Nov 11 02:59 Cancún: still the 10th'],
    ['2026-11-11T08:00:00Z', 'today', 11,'Nov 11 03:00 Cancún: the 11th'],
    ['2026-11-14T16:00:00Z', 'today', 14,'Nov 14 11:00 Cancún: travel home'],
    ['2026-11-15T08:00:00Z', 'trip', 14, 'after the trip: Trip tab'],
  ];
  for(const [iso, tab, day, label] of cases){
    const { ctx, page, errors } = await open(browser, iso);
    const s = await state(page);
    ok(s.tab === tab && s.day === day, label + ' → got ' + s.tab + ' ' + s.day);
    ok(errors.length === 0, label + ' errors: ' + errors.join(' | '));
    await ctx.close();
  }

  console.log('§3 now / next');
  {
    const { ctx, page } = await open(browser, '2026-11-03T16:30:00Z');   // 10:30 CDMX
    const tags = await page.$$eval('#tab-today .it', els => els.map(e => (e.querySelector('.t em') || {}).textContent || ''));
    const nowAt = tags.indexOf('Now'), nextAt = tags.indexOf('Next');
    const items = await page.evaluate(() => DAYS[1].items.map(x => x.t));
    ok(items[nowAt] === '10:00–11:40', 'Now on the 10:00 Centro loop, got ' + items[nowAt]);
    ok(items[nextAt] === '~11:40', 'Next on Templo Mayor, got ' + items[nextAt]);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, '2026-11-10T10:30:00Z');   // Nov 10 04:30 SMA
    const tags = await page.$$eval('#tab-today .it', els => els.map(e => (e.querySelector('.t em') || {}).textContent || ''));
    ok(tags[0] === 'Next' && tags.indexOf('Now') < 0, 'early on the 10th: the 5:00 pickup is Next, nothing Now');
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, '2026-11-10T03:00:00Z');   // Nov 9 21:00 SMA
    ok(/~5:00 AM/.test(await page.textContent('#tab-today .tmrw')), 'the evening of the 9th previews the 5:00 AM pickup');
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, '2026-10-12T17:00:00Z');
    const t = await page.textContent('#tab-trip');
    ok(/21 days to go/.test(t), 'countdown reads 21 days on Oct 12');
    await ctx.close();
  }

  console.log('§4 every tab and day renders at phone width');
  for(const dark of [false, true]){
    const { ctx, page, errors } = await open(browser, '2026-11-03T16:30:00Z', { dark });
    for(const t of ['today', 'trip', 'info', 'shop', 'ideas']){
      await page.click('nav button[data-tab="' + t + '"]');
      ok(!(await overflow(page)), (dark ? 'dark ' : '') + t + ' overflows horizontally');
      ok((await page.textContent('#tab-' + t)).trim().length > 50, t + ' is empty');
    }
    await page.click('nav button[data-tab="today"]');
    for(let i = 0; i < 13; i++){
      await page.selectOption('#dayPick', String(i));
      ok(!(await overflow(page)), 'day ' + (i + 2) + ' overflows');
    }
    ok(errors.length === 0, 'render errors: ' + errors.join(' | '));
    const hrefs = await page.$$eval('a', as => as.map(a => [a.href, a.target]));
    ok(hrefs.every(([h, t]) => /^https:\/\//.test(h) && t === '_blank'), 'every link is https and opens a new tab');
    await ctx.close();
  }

  console.log('§5 navigation');
  {
    const { ctx, page } = await open(browser, '2026-10-12T17:00:00Z');
    await page.click('#tab-trip .dayrow[data-day="7"]');
    let s = await state(page);
    ok(s.tab === 'today' && s.day === 7, 'Trip row opens that day on Today');
    ok(/Streetiversary/.test(await page.textContent('#tab-today .dayhero')), 'the 7th is flagged Streetiversary');
    ok(/Anniversary/.test(await page.textContent('#tab-trip .dayrow[data-day="13"]')), 'the 13th is flagged Anniversary on Trip');
    await page.click('nav button[data-tab="ideas"]');
    const secs = await page.$$eval('#tab-ideas .ideasec h2', els => els.map(e => e.textContent));
    ok(secs.join('|') === 'Day by day|Other ideas', 'Ideas has Day by day then Other ideas, got ' + secs.join('|'));
    ok(await page.evaluate(() => { const c = document.querySelectorAll('#tab-ideas .card.idea'); const firstOther = [...c].findIndex(e => e.classList.contains('other')); return [...c].slice(firstOther).every(e => e.classList.contains('other')); }), 'no day card after the Other ideas heading');
    await page.click('#tab-ideas .dayidea .db[data-day="4"]');
    ok((await state(page)).day === 4, 'day card date opens that day');
    await page.click('nav button[data-tab="ideas"]');
    await page.click('#tab-ideas .chip[data-day="7"]');
    ok((await state(page)).day === 7, 'Other ideas chip opens that day');
    await page.click('nav button[data-tab="ideas"]');
    await page.click('#tab-ideas .dayidea .db[data-day="5"]');
    s = await state(page);
    ok(s.tab === 'today' && s.day === 5, 'Ideas chip opens that day');
    await page.click('#nextD');
    s = await state(page);
    ok(s.day === 6, 'next-day button');
    ok(/Hotel change/.test(await page.textContent('#tab-today .dayhero')), 'the 6th shows the hotel change');
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, '2026-11-05T15:00:00Z');   // 09:00 CDMX on the 5th
    await page.click('#nextD');
    ok(/Back to today/.test(await page.textContent('#tab-today')), 'viewing another day offers Back to today');
    await page.click('#tab-today .backbtn button');
    ok((await state(page)).day === 5, 'Back to today returns to the 5th');
    await ctx.close();
  }

  console.log('§6 info lists');
  {
    const { ctx, page } = await open(browser, '2026-10-12T17:00:00Z');
    await page.click('nav button[data-tab="info"]');
    const t = await page.textContent('#tab-info');
    ['Taverna', 'Rosetta', 'Comedor Jacinta', 'The Restaurant', 'Bocaciega', 'Sazón Cooking School', 'Luna Rooftop']
      .forEach(n => ok(t.includes(n), 'Reservations lists ' + n));
    ok(/BajíoGo/.test(t) && /CUN transfer/.test(t), 'Still to sort lists the transfers');
    ok(/Check-in 3:00 PM Mon · check-out 11:00 AM Wed/.test(t) && /guaranteed 4:00 PM late checkout/.test(t), 'Info shows hotel times and perks');
    await ctx.close();
  }

  console.log('§7 shopping ticks persist');
  {
    const { ctx, page } = await open(browser, '2026-10-12T17:00:00Z');
    await page.click('nav button[data-tab="shop"]');
    await page.check('input[data-shop="linens"]');
    await page.reload();
    await page.click('nav button[data-tab="shop"]');
    ok(await page.isChecked('input[data-shop="linens"]'), 'tick survives a reload');
    await ctx.close();
  }

  if(process.env.SHOTS){
    fs.mkdirSync(path.join(__dirname, 'shots'), { recursive:true });
    const shots = [
      ['today-nov3', '2026-11-03T16:30:00Z', 'today', false],
      ['trip', '2026-10-12T17:00:00Z', 'trip', false],
      ['ideas', '2026-10-12T17:00:00Z', 'ideas', false],
      ['today-nov7-dark', '2026-11-07T15:00:00Z', 'today', true],
      ['info', '2026-10-12T17:00:00Z', 'info', false],
      ['shop', '2026-10-12T17:00:00Z', 'shop', false],
    ];
    for(const [name, iso, t, dark] of shots){
      const { ctx, page } = await open(browser, iso, { dark });
      await page.click('nav button[data-tab="' + t + '"]');
      await page.screenshot({ path: path.join(__dirname, 'shots', name + '.png'), fullPage:true });
      await ctx.close();
    }
  }

  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
