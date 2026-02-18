/**
 * server.js - Ramadan Calendar Wallpaper Generator
 * ใช้ AlAdhan API (ฟรี ไม่ต้อง key) คำนวณเวลาละหมาดตามพิกัด GPS
 * รองรับจังหวัด + อำเภอทั่วไทย  |  Run: node server.js
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ═══════════════════════════════════════════════════════════
//  DATABASE  จังหวัด → อำเภอ → { nameTh, lat, lng }
// ═══════════════════════════════════════════════════════════
const LOCATIONS = {
  songkhla: {
    nameTh: 'สงขลา', lat: 7.2075, lng: 100.5967,
    districts: {
      mueang:      { nameTh: 'เมืองสงขลา',    lat: 7.2075,  lng: 100.5967 },
      hatyai:      { nameTh: 'หาดใหญ่',        lat: 7.0086,  lng: 100.4747 },
      sadao:       { nameTh: 'สะเดา',           lat: 6.6381,  lng: 100.4183 },
      thepha:      { nameTh: 'เทพา',            lat: 6.8405,  lng: 100.9792 },
      nathawi:     { nameTh: 'นาทวี',           lat: 6.7131,  lng: 100.7231 },
      ranot:       { nameTh: 'ระโนด',           lat: 7.7730,  lng: 100.3116 },
      sathing:     { nameTh: 'สทิงพระ',         lat: 7.5170,  lng: 100.4200 },
      singhanakhon:{ nameTh: 'สิงหนคร',         lat: 7.2920,  lng: 100.5550 },
      khlong_hoi:  { nameTh: 'คลองหอยโข่ง',    lat: 6.9770,  lng: 100.4470 },
      bang_klam:   { nameTh: 'บางกล่ำ',         lat: 7.1320,  lng: 100.5120 },
      na_mom:      { nameTh: 'นาหม่อม',         lat: 7.0900,  lng: 100.6230 },
      khuan_niang: { nameTh: 'ควนเนียง',        lat: 7.1750,  lng: 100.4050 },
      chana:       { nameTh: 'จะนะ',            lat: 6.9110,  lng: 100.7760 },
      sabayoi:     { nameTh: 'สะบ้าย้อย',       lat: 6.5680,  lng: 100.9050 },
    }
  },
  pattani: {
    nameTh: 'ปัตตานี', lat: 6.8695, lng: 101.2500,
    districts: {
      mueang:    { nameTh: 'เมืองปัตตานี', lat: 6.8695, lng: 101.2500 },
      nong_chik: { nameTh: 'หนองจิก',      lat: 6.9360, lng: 101.1810 },
      mayo:      { nameTh: 'มายอ',          lat: 6.6680, lng: 101.5100 },
      yarang:    { nameTh: 'ยะรัง',         lat: 6.7380, lng: 101.3660 },
      sai_buri:  { nameTh: 'สายบุรี',       lat: 6.6400, lng: 101.7920 },
      kapho:     { nameTh: 'กะพ้อ',         lat: 6.5060, lng: 101.7260 },
      khok_pho:  { nameTh: 'โคกโพธิ์',      lat: 6.8280, lng: 101.1450 },
      panare:    { nameTh: 'ปะนาเระ',       lat: 6.7900, lng: 101.5730 },
      mae_lan:   { nameTh: 'แม่ลาน',        lat: 6.9120, lng: 101.2250 },
      thung_yang_daeng: { nameTh: 'ทุ่งยางแดง', lat: 6.6080, lng: 101.5280 },
      yaring:    { nameTh: 'ยะริง',         lat: 6.7090, lng: 101.2360 },
      bacho:     { nameTh: 'บาเจาะ',        lat: 6.5630, lng: 101.6430 },
    }
  },
  yala: {
    nameTh: 'ยะลา', lat: 6.5413, lng: 101.2800,
    districts: {
      mueang:       { nameTh: 'เมืองยะลา',  lat: 6.5413, lng: 101.2800 },
      betong:       { nameTh: 'เบตง',        lat: 5.7750, lng: 101.0700 },
      bannang:      { nameTh: 'บันนังสตา',   lat: 6.2640, lng: 101.2530 },
      yaha:         { nameTh: 'ยะหา',        lat: 6.4420, lng: 101.2100 },
      raman:        { nameTh: 'รามัน',        lat: 6.4680, lng: 101.3380 },
      kabang:       { nameTh: 'กาบัง',       lat: 6.1870, lng: 101.3020 },
      krong_pinang: { nameTh: 'กรงปินัง',   lat: 6.3190, lng: 101.4260 },
      than_to:      { nameTh: 'ธารโต',       lat: 6.0010, lng: 101.1990 },
    }
  },
  narathiwat: {
    nameTh: 'นราธิวาส', lat: 6.4251, lng: 101.8233,
    districts: {
      mueang:    { nameTh: 'เมืองนราธิวาส',  lat: 6.4251, lng: 101.8233 },
      takbai:    { nameTh: 'ตากใบ',           lat: 6.2580, lng: 102.0450 },
      bacho:     { nameTh: 'บาเจาะ',          lat: 6.5630, lng: 101.6430 },
      yi_ngo:    { nameTh: 'ยี่งอ',           lat: 6.4840, lng: 101.9350 },
      ra_ngae:   { nameTh: 'ระแงะ',           lat: 6.2300, lng: 101.8360 },
      ruso:      { nameTh: 'รือเสาะ',         lat: 6.2200, lng: 101.6990 },
      si_sakhon: { nameTh: 'ศรีสาคร',         lat: 6.1600, lng: 101.6500 },
      sukhirin:  { nameTh: 'สุคิริน',         lat: 5.8840, lng: 101.7950 },
      chanae:    { nameTh: 'จะแนะ',           lat: 6.0640, lng: 101.7800 },
      sungnoen:  { nameTh: 'สุไหงโก-ลก',      lat: 6.0330, lng: 101.9730 },
      waeng:     { nameTh: 'แว้ง',             lat: 5.8490, lng: 101.9080 },
    }
  },
  satun: {
    nameTh: 'สตูล', lat: 6.6238, lng: 100.0673,
    districts: {
      mueang:       { nameTh: 'เมืองสตูล',   lat: 6.6238, lng: 100.0673 },
      khuan_don:    { nameTh: 'ควนโดน',       lat: 6.7560, lng: 100.1250 },
      khuan_kalong: { nameTh: 'ควนกาหลง',    lat: 6.9050, lng: 100.1730 },
      tha_phae:     { nameTh: 'ท่าแพ',         lat: 6.5840, lng: 100.2430 },
      la_ngu:       { nameTh: 'ละงู',           lat: 6.9140, lng: 99.8280  },
      thung_wa:     { nameTh: 'ทุ่งหว้า',       lat: 6.9140, lng: 99.6820  },
      manang:       { nameTh: 'มะนัง',          lat: 6.3390, lng: 100.3010 },
    }
  },
  phuket: {
    nameTh: 'ภูเก็ต', lat: 7.8804, lng: 98.3923,
    districts: {
      mueang:  { nameTh: 'เมืองภูเก็ต', lat: 7.8804, lng: 98.3923 },
      kathu:   { nameTh: 'กะทู้',        lat: 7.9050, lng: 98.3270 },
      thalang: { nameTh: 'ถลาง',         lat: 8.0720, lng: 98.3550 },
    }
  },
  trang: {
    nameTh: 'ตรัง', lat: 7.5593, lng: 99.6113,
    districts: {
      mueang:    { nameTh: 'เมืองตรัง',  lat: 7.5593, lng: 99.6113 },
      kantang:   { nameTh: 'กันตัง',      lat: 7.4060, lng: 99.5150 },
      palian:    { nameTh: 'ปะเหลียน',    lat: 7.2050, lng: 99.7360 },
      sikao:     { nameTh: 'สิเกา',       lat: 7.5850, lng: 99.3440 },
      huai_yot:  { nameTh: 'ห้วยยอด',    lat: 7.7920, lng: 99.6410 },
    }
  },
  phatthalung: {
    nameTh: 'พัทลุง', lat: 7.6166, lng: 100.0741,
    districts: {
      mueang:     { nameTh: 'เมืองพัทลุง', lat: 7.6166, lng: 100.0741 },
      kong_ra:    { nameTh: 'กงหรา',        lat: 7.4910, lng: 99.8540  },
      pak_phayun: { nameTh: 'ปากพะยูน',    lat: 7.3480, lng: 100.2650 },
      khuan_khanun:{ nameTh: 'ควนขนุน',    lat: 7.7250, lng: 100.0160 },
    }
  },
  krabi: {
    nameTh: 'กระบี่', lat: 8.0863, lng: 98.9063,
    districts: {
      mueang:      { nameTh: 'เมืองกระบี่', lat: 8.0863, lng: 98.9063 },
      ao_luek:     { nameTh: 'อ่าวลึก',     lat: 8.3990, lng: 98.7680 },
      khao_phanom: { nameTh: 'เขาพนม',      lat: 8.4730, lng: 99.1360 },
      ko_lanta:    { nameTh: 'เกาะลันตา',   lat: 7.6380, lng: 99.0780 },
    }
  },
  surat_thani: {
    nameTh: 'สุราษฎร์ธานี', lat: 9.1382, lng: 99.3214,
    districts: {
      mueang:    { nameTh: 'เมืองสุราษฎร์ธานี', lat: 9.1382, lng: 99.3214 },
      ko_samui:  { nameTh: 'เกาะสมุย',           lat: 9.5530, lng: 100.0680 },
      chaiya:    { nameTh: 'ไชยา',                lat: 9.3760, lng: 99.1820 },
    }
  },
  bangkok: {
    nameTh: 'กรุงเทพมหานคร', lat: 13.7563, lng: 100.5018,
    districts: {
      phra_nakhon: { nameTh: 'พระนคร',    lat: 13.7563, lng: 100.5018 },
      min_buri:    { nameTh: 'มีนบุรี',   lat: 13.8150, lng: 100.7120 },
      lat_krabang: { nameTh: 'ลาดกระบัง', lat: 13.7240, lng: 100.7800 },
      bang_rak:    { nameTh: 'บางรัก',     lat: 13.7280, lng: 100.5150 },
      chatuchak:   { nameTh: 'จตุจักร',   lat: 13.8220, lng: 100.5630 },
    }
  },
  chiangmai: {
    nameTh: 'เชียงใหม่', lat: 18.7883, lng: 98.9853,
    districts: {
      mueang:    { nameTh: 'เมืองเชียงใหม่', lat: 18.7883, lng: 98.9853 },
      hang_dong: { nameTh: 'หางดง',           lat: 18.6750, lng: 98.9440 },
      san_sai:   { nameTh: 'สันทราย',          lat: 18.8660, lng: 99.0630 },
      mae_rim:   { nameTh: 'แม่ริม',           lat: 18.9200, lng: 98.9560 },
    }
  },
};

// AlAdhan method 11 = MUIS (ใช้ใน SEA)
const ALADHAN_BASE = 'https://api.aladhan.com/v1';
const CALC_METHOD  = 11;

// ─── GET /api/locations ───────────────────────────────────────
app.get('/api/locations', (req, res) => {
  const result = {};
  for (const [pk, prov] of Object.entries(LOCATIONS)) {
    result[pk] = {
      nameTh: prov.nameTh,
      lat: prov.lat, lng: prov.lng,
      districts: Object.entries(prov.districts).map(([key, d]) => ({
        key, nameTh: d.nameTh, lat: d.lat, lng: d.lng,
      })),
    };
  }
  res.json(result);
});

// ─── GET /api/prayertime?province=songkhla&district=hatyai ────
app.get('/api/prayertime', async (req, res) => {
  const provKey = (req.query.province || 'songkhla').toLowerCase();
  const distKey = (req.query.district || 'hatyai').toLowerCase();

  const prov = LOCATIONS[provKey];
  if (!prov) return res.status(400).json({ error: 'Province not found' });

  const dist = prov.districts[distKey] || Object.values(prov.districts)[0];
  const { lat, lng } = dist;

  try {
    const data = await fetchRamadanTimes(lat, lng);
    res.json({ success: true, province: prov.nameTh, district: dist.nameTh, lat, lng, data });
  } catch (err) {
    console.error('AlAdhan error:', err.message);
    const data = generateFallbackData(lat, lng);
    res.json({ success: true, province: prov.nameTh, district: dist.nameTh, lat, lng, data, fallback: true });
  }
});

// ─── ดึงจาก AlAdhan API ────────────────────────────────────────
async function fetchRamadanTimes(lat, lng) {
  let fetch;
  try { fetch = (await import('node-fetch')).default; }
  catch { throw new Error('node-fetch not available'); }

  const thaiMonths = ['ม.ค.','ก.พ.','มี.นา','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const thaiDays   = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  // ดึง 2 เดือน คู่กัน
  const [febRaw, marRaw] = await Promise.all([
    fetchMonth(fetch, lat, lng, 2, 2026),
    fetchMonth(fetch, lat, lng, 3, 2026),
  ]);

  const allDays = [...febRaw, ...marRaw];

  // กรอง 19 ก.พ. – 20 มี.ค. 2026
  const t0 = new Date(2026, 1, 19).getTime();
  const t1 = new Date(2026, 2, 20).getTime();

  let ramadanDay = 1;
  return allDays
    .map(d => {
      // AlAdhan date format: "DD-MM-YYYY"
      const parts = d.date.gregorian.date.split('-');
      const dt    = new Date(+parts[2], +parts[1]-1, +parts[0]);
      const strip = t => t.split(' ')[0];
      return { dt, d, strip };
    })
    .filter(({ dt }) => dt.getTime() >= t0 && dt.getTime() <= t1)
    .map(({ dt, d, strip }) => ({
      ramadanDay: ramadanDay++,
      date:          dt.getDate(),
      month:         thaiMonths[dt.getMonth()],
      monthIndex:    dt.getMonth(),
      year:          dt.getFullYear(),
      dayOfWeek:     thaiDays[dt.getDay()],
      dayOfWeekIndex: dt.getDay(),
      fajr:    strip(d.timings.Fajr),
      sunrise: strip(d.timings.Sunrise),
      dhuhr:   strip(d.timings.Dhuhr),
      asr:     strip(d.timings.Asr),
      maghrib: strip(d.timings.Maghrib),
      isha:    strip(d.timings.Isha),
      suhoor:  strip(d.timings.Fajr),
      iftar:   strip(d.timings.Maghrib),
    }));
}

async function fetchMonth(fetch, lat, lng, month, year) {
  const url = `${ALADHAN_BASE}/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${CALC_METHOD}&tune=0,0,0,0,0,0,0,0,0`;
  console.log('[AlAdhan]', url);
  const res = await fetch(url, { timeout: 15000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.status);
  return json.data;
}

// ─── Fallback ──────────────────────────────────────────────────
function generateFallbackData(lat = 7.0, lng = 100.47) {
  const thaiMonths = ['ม.ค.','ก.พ.','มี.นา','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const thaiDays   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const fmt = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const latAdj  = (7.0 - lat) * 1.2;
  const baseFajr = 5*60 + 20 + latAdj;
  const baseMag  = 18*60 + 30 - latAdj * 0.5;
  const startDow = 4; // พฤหัส

  return Array.from({ length: 30 }, (_, i) => {
    const d   = new Date(2026, 1, 19 + i);
    const dow = (startDow + i) % 7;
    const fajr    = baseFajr - Math.floor(i * 0.33);
    const maghrib = baseMag  - Math.floor(i * 0.034);
    return {
      ramadanDay: i + 1,
      date: d.getDate(), month: thaiMonths[d.getMonth()],
      monthIndex: d.getMonth(), year: d.getFullYear(),
      dayOfWeek: thaiDays[dow], dayOfWeekIndex: dow,
      fajr: fmt(fajr), sunrise: fmt(6*60+35-Math.floor(i*0.2)),
      dhuhr: fmt(12*60+22), asr: fmt(15*60+41),
      maghrib: fmt(maghrib), isha: fmt(19*60+45),
      suhoor: fmt(fajr), iftar: fmt(maghrib),
    };
  });
}

app.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════════════════════╗
║  🌙 Ramadan Calendar Generator  → http://localhost:${PORT} ║
╚═════════════════════════════════════════════════════╝
  `);
});