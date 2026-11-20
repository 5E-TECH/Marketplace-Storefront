import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const phone = loadTypeScript('src/lib/phone.ts');
const pricing = loadTypeScript('src/lib/pricing.ts');
const form = loadTypeScript('src/lib/lead-form.ts');
const cookie = loadTypeScript('src/lib/lead-cookie.ts');
const hours = loadTypeScript('src/lib/hours.ts');
const pixels = loadTypeScript('src/lib/pixel-events.ts');
const routing = loadTypeScript('src/lib/routing.ts');
const { FORM } = loadTypeScript('src/lib/texts.ts');

const fd = (entries) => { const data = new FormData(); for (const [key, value] of entries) data.append(key, value); return data; };
const base = [['code', 'k7Qm2x'], ['variant', 's3'], ['ism', ' Aziza '], ['telefon', '90 123 45 67'], ['rozilik', '1'], ['districtSoato', '1730405'], ['addressLine', ' Turkiston ko‘chasi, 27-uy ']];
const address = { regionSoato: '', districtSoato: '1730405', addressLine: 'Turkiston ko‘chasi, 27-uy' };
const filled = { name: 'Aziza', phone: '901234567', consent: true, whereDeliver: 'CENTER', ...address };

test('telefon: +998 dan keyin 9 raqam, ko‘rinish 2-3-2-2', () => {
  assert.equal(phone.phoneDigits('+998 (90) 123-45-67'), '901234567');
  assert.equal(phone.phoneDigits('998901234567'), '901234567');
  assert.equal(phone.phoneDigits('90 12'), '9012');
  assert.equal(phone.formatPhoneLocal('901234567'), '90 123 45 67');
  assert.equal(phone.formatPhoneLocal('90123'), '90 123');
  assert.equal(phone.toE164('901234567'), '+998901234567');
  assert.equal(phone.toE164('90123'), null);
  assert.equal(phone.formatPhoneFull('+998901234567'), '+998 90 123 45 67');
});

test('narx: jami = tovar + yetkazish; ikkala haq 0 — bepul (narx-4)', () => {
  const view = pricing.priceView({ salePrice: 262000, centerDeliveryFee: 30000, addressDeliveryFee: 50000 });
  assert.equal(view.free, false);
  assert.equal(pricing.totalFor(view, 'CENTER'), 292000);
  assert.equal(pricing.totalFor(view, 'ADDRESS'), 312000);
  const free = pricing.priceView({ salePrice: 294000, centerDeliveryFee: 0, addressDeliveryFee: 0 });
  assert.equal(free.free, true);
  assert.equal(pricing.totalFor(free, 'ADDRESS'), 294000);
  assert.equal(pricing.parseWhere('ADDRESS'), 'ADDRESS');
  assert.equal(pricing.parseWhere('boshqa'), 'CENTER');
});

test('forma: maydonlar, variant, yetkazish, clickId; JS siz kuzatuv parametrlari Referer’dan (TC4)', () => {
  const parsed = form.readForm(fd([...base, ['whereDeliver', 'ADDRESS'], ['clickId', '90311'], ['js', '1']]), 'https://sotuv.example/k7Qm2x?sub1=abc&utm_source=fb');
  assert.deepEqual(parsed.values, { ...filled, whereDeliver: 'ADDRESS' });
  assert.equal(parsed.code, 'k7Qm2x');
  assert.equal(parsed.variant, 's3');
  assert.equal(parsed.clickId, '90311');
  assert.equal(parsed.js, true);
  assert.deepEqual(parsed.tracking, { sub1: 'abc', utmSource: 'fb' });
  // JS bilan forma parametrlarni o‘zi yuboradi — Referer ishlatilmaydi.
  assert.deepEqual(form.readForm(fd([...base, ['sub2', 'x']]), 'https://sotuv.example/k7Qm2x?sub1=abc').tracking, { sub2: 'x' });
  const wrong = form.readForm(fd([['code', '../x'], ['variant', 's2'], ['clickId', 'abc'], ['fbclid', 'y'.repeat(600)]]), null);
  assert.equal(wrong.code, null);
  assert.equal(wrong.variant, null);
  assert.equal(wrong.clickId, null);
  assert.deepEqual(wrong.tracking, {});
  assert.equal(wrong.values.consent, false);
});

test('TC1: noto‘g‘ri telefon, bo‘sh ism, rozilik yo‘q — yuborilmaydi (forma-3, -4, -6)', () => {
  assert.deepEqual(form.validate(filled), {});
  assert.deepEqual(form.validate({ ...filled, name: '', phone: '90123', consent: false }), {
    name: FORM.nameError, phone: FORM.phoneError, consent: FORM.consentError,
  });
  assert.equal(form.validate({ ...filled, name: 'a'.repeat(101) }).name, FORM.nameError);
});

test('SF-06: manzil majburiy — tumansiz, ko‘cha/uysiz yuborilmaydi; JS bilan viloyat tanlanmagan bo‘lsa xato viloyatda', () => {
  assert.deepEqual(form.validate({ ...filled, districtSoato: '', addressLine: '' }), { district: FORM.districtError, address: FORM.addressError });
  assert.deepEqual(form.validate({ ...filled, districtSoato: '' }, true), { region: FORM.regionError });
  assert.deepEqual(form.validate({ ...filled, regionSoato: '1730', districtSoato: '' }, true), { district: FORM.districtError });
  // TC0: «Markazgacha» tanlanganda ham ko‘cha/uy majburiy.
  assert.deepEqual(form.validate({ ...filled, whereDeliver: 'CENTER', addressLine: '' }), { address: FORM.addressError });
  assert.equal(form.validate({ ...filled, addressLine: 'x'.repeat(256) }).address, FORM.addressError);
});

test('TC6 va TC4: lid so‘rovida variant, yetkazish, rozilik versiyasi, sub va utm; yashirin maydon uzatiladi', () => {
  const parsed = form.readForm(fd([...base, ['website', 'bot'], ['clickId', '90311']]), 'https://sotuv.example/k7Qm2x?sub1=abc&utm_source=fb');
  assert.deepEqual(form.buildLead({ ...parsed, code: 'k7Qm2x' }, '1730'), {
    code: 'k7Qm2x', name: 'Aziza', phone: '+998901234567', regionSoato: '1730', districtSoato: '1730405', addressLine: 'Turkiston ko‘chasi, 27-uy',
    whereDeliver: 'CENTER', consentVersion: form.CONSENT_VERSION,
    sub1: 'abc', utmSource: 'fb', variant: 's3', clickId: '90311', website: 'bot',
  });
});

test('backend 400: operator kodi — forma-5, telefon — forma-4, ism; formada yo‘q maydon — server xatosi', () => {
  assert.deepEqual(form.errorsFromBackend(['phone'], ['phone O‘zbekiston operator kodi bilan bo‘lishi kerak']), { phone: FORM.operatorError });
  assert.deepEqual(form.errorsFromBackend(['phone', 'name'], ['phone +998XXXXXXXXX formatida bo‘lishi kerak']), { phone: FORM.phoneError, name: FORM.nameError });
  assert.equal(form.errorsFromBackend(['regionSoato'], ['regionSoato should not be empty']), null);
  assert.deepEqual(form.errorsFromBackend(['addressLine'], ['addressLine should not be empty']), { address: FORM.addressError });
  assert.equal(form.errorsFromBackend(['districtSoato'], ['tuman boshqa viloyatniki']), null);
  assert.equal(form.errorsFromBackend([], ['x']), null);
});

test('«Rahmat» cookie: ism va raqam URL’da emas; buzuq qiymat — null', () => {
  const value = { code: 'k7Qm2x', leadId: '7001', duplicate: false, name: 'Aziza', phone: '+998901234567', where: 'ADDRESS', pixel: true };
  assert.deepEqual(cookie.decodeLeadCookie(cookie.encodeLeadCookie(value)), value);
  assert.equal(cookie.decodeLeadCookie('buzuq'), null);
  assert.equal(cookie.decodeLeadCookie(undefined), null);
  assert.equal(cookie.decodeLeadCookie(Buffer.from('{"code":1}').toString('base64url')), null);
});

test('rahmat-3: 21:00 dan keyin va 09:00 dan oldin (Toshkent, UTC+5) — ish vaqtidan tashqari', () => {
  assert.equal(hours.isOffHours(new Date('2026-11-19T03:59:00Z')), true); // 08:59
  assert.equal(hours.isOffHours(new Date('2026-11-19T04:00:00Z')), false); // 09:00
  assert.equal(hours.isOffHours(new Date('2026-11-19T15:59:00Z')), false); // 20:59
  assert.equal(hours.isOffHours(new Date('2026-11-19T16:00:00Z')), true); // 21:00
});

test('yo‘llar: /<kod>/buyurtma va /<kod>/rahmat — ichki variant yo‘liga', () => {
  assert.deepEqual(routing.classifyPath('/k7Qm2x/rahmat'), { kind: 'landing', code: 'k7Qm2x', sub: 'rahmat' });
  assert.deepEqual(routing.classifyPath('/k7Qm2x/buyurtma'), { kind: 'landing', code: 'k7Qm2x', sub: 'buyurtma' });
  assert.deepEqual(routing.classifyPath('/k7Qm2x/boshqa'), { kind: 'other' });
  assert.equal(routing.variantPath('s3', 'k7Qm2x', 'rahmat'), '/v/s3/k7Qm2x/rahmat');
  assert.equal(routing.landingUrl('k7Qm2x', 'buyurtma'), '/k7Qm2x/buyurtma');
  assert.deepEqual(routing.classifyPath('/oferta'), { kind: 'other' });
});

const pixelEnv = () => {
  const calls = [];
  let jar = '';
  return {
    calls,
    env: {
      meta: () => (...args) => calls.push(['fbq', ...args]),
      tiktok: (id) => ({ page: () => calls.push(['ttq.page', id]), track: (...args) => calls.push(['ttq', ...args]) }),
      cookie: () => jar,
      setCookie: (value) => { jar = [jar, value.split(';')[0]].filter(Boolean).join('; '); },
    },
  };
};

test('TC3: Lead bir marta, eventID = lid ID; qayta yuklanganda yuborilmaydi; PageView har safar', () => {
  const { calls, env } = pixelEnv();
  const ids = { meta: '123456789012345', tiktok: 'CABCDEFGH12345' };
  assert.deepEqual(pixels.firePixelEvents(env, ids, '7001'), { lead: true });
  assert.deepEqual(calls.filter((call) => call[2] === 'Lead' || call[1] === 'SubmitForm'), [
    ['fbq', 'track', 'Lead', {}, { eventID: '7001' }],
    ['ttq', 'SubmitForm', {}, { event_id: '7001' }],
  ]);
  calls.length = 0;
  assert.deepEqual(pixels.firePixelEvents(env, ids, '7001'), { lead: false });
  assert.deepEqual(calls, [['fbq', 'init', '123456789012345'], ['fbq', 'track', 'PageView'], ['ttq.page', 'CABCDEFGH12345']]);
});

test('piksel kodi xato bersa ham: belgi oldin yozilgan — qayta yuklashda Lead takrorlanmaydi, sahifa buzilmaydi', () => {
  const { calls, env } = pixelEnv();
  const broken = { ...env, tiktok: () => ({ page: () => { throw new Error('SDK'); }, track: () => calls.push(['ttq']) }) };
  assert.deepEqual(pixels.firePixelEvents(broken, { meta: '123456789012345', tiktok: 'CABCDEFGH12345' }, '7002'), { lead: true });
  assert.ok(calls.some((call) => call[2] === 'Lead'));
  assert.match(env.cookie(), /elchi_px_7002=1/);
});

test('piksel: noto‘g‘ri yoki bo‘sh ID — skript yuklanmaydi; lidsiz sahifada Lead yo‘q', () => {
  const { calls, env } = pixelEnv();
  assert.deepEqual(pixels.firePixelEvents(env, { meta: "1');alert(1", tiktok: null }, '7001'), { lead: false });
  assert.deepEqual(calls, []);
  assert.equal(env.cookie(), '');
  const second = pixelEnv();
  pixels.firePixelEvents(second.env, { meta: '123456789012345', tiktok: null });
  assert.deepEqual(second.calls, [['fbq', 'init', '123456789012345'], ['fbq', 'track', 'PageView']]);
});

const address_ = loadTypeScript('src/lib/address.ts');

test('viloyatlar holat-matnlari.md:387 tartibida; tumansiz viloyat chiqmaydi; tumandan viloyat topiladi', () => {
  const tree = [
    { satoCode: '1730', name: 'Farg‘ona viloyati', districts: [{ satoCode: '1730405', name: 'Qo‘qon shahri' }] },
    { satoCode: '1799', name: 'Noma’lum', districts: [{ satoCode: '1799001', name: 'X' }] },
    { satoCode: '1735', name: 'Qoraqalpog‘iston Respublikasi', districts: [] },
    { satoCode: '1726', name: 'Toshkent shahri', districts: [{ satoCode: '1726266', name: 'Yunusobod tumani' }] },
  ];
  assert.deepEqual(address_.sortRegions(tree).map((region) => region.satoCode), ['1726', '1730', '1799']);
  assert.equal(address_.regionOfDistrict(tree, '1730405'), '1730');
  assert.equal(address_.regionOfDistrict(tree, '0000000'), null);
});
