/**
 * app.js – Ramadan Calendar Wallpaper Generator
 * Full canvas rendering + UI controller
 */

'use strict';

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
const STATE = {
  canvas: { w: 1080, h: 1920 },
  theme: 'pastel',
  zoom: 0.5,
  title: 'Ramadan 2026',
  location: 'HATYAI',
  dayLabels: ['อา','จ','อ','พ','พฤ','ศ','ส'],
  duaSuhoor: 'وَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هٰذِهِ السَّنَةِ لِلّٰهِ تَعَالَ',
  duaIftar:  'اللّٰهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
  bg: {
    type: 'gradient',
    color1: '#fde8f0',
    color2: '#fdf6e3',
    dir: 'vertical',
    imageData: null,
    overlayOpacity: 0.3,
    patternColor: '#c9a96e',
    patternOpacity: 0.15,
    showGeometric: true,
  },
  card: {
    color: '#f9c8d8',
    opacity: 0.9,
    radius: 0.35,
    showIcons: true,
    height: 155,      // base card height (px at 1080w)
    gap: 8,           // gap between rows
    marginX: 28,      // left-right margin
    offsetY: 0,       // vertical shift of entire grid
  },
  font: {
    ramadan: "'Fredoka One', cursive",    // big Ramadan day number
    body:    "'Noto Sans Thai', sans-serif", // times, month
    title:   "'Fredoka One', cursive",    // header title
    numSize:  48,   // Ramadan day number size (at 1080w)
    timeSize: 16,   // time text size
  },
  data: [],          // array of day objects
  bgImage: null,     // HTMLImageElement
  showMobileFrame: true,
};

// ═══════════════════════════════════════════
//  THEMES
// ═══════════════════════════════════════════
const THEMES = {
  pastel: {
    bg1: '#fde8f0', bg2: '#fdf6e3',
    titleColor: ['#e07da0','#c9a96e'],
    locationColor: '#b05870',
    cardColor: '#f9c8d8',
    cardTextColor: '#3d2c35',
    timeColor: '#5a3040',
    headerDayBg: '#8b6060',
    headerDayColor: '#ffffff',
    duaBg: '#fff0f5',
    duaText: '#5a3040',
    patternColor: '#c9a96e',
    accent: '#e07da0',
    moonIcon: '🌙', sunIcon: '☀️',
    starIcon: '✨',
  },
  dark: {
    bg1: '#0d1b2a', bg2: '#1a1a2e',
    titleColor: ['#c9a96e','#e8d5a0'],
    locationColor: '#a8956a',
    cardColor: '#1e2d42',
    cardTextColor: '#e8d5b0',
    timeColor: '#c9a96e',
    headerDayBg: '#c9a96e',
    headerDayColor: '#0d1b2a',
    duaBg: '#162236',
    duaText: '#c9a96e',
    patternColor: '#c9a96e',
    accent: '#c9a96e',
    moonIcon: '🌙', sunIcon: '⭐', starIcon: '✨',
  },
  minimal: {
    bg1: '#ffffff', bg2: '#f8f4ef',
    titleColor: ['#333333','#666666'],
    locationColor: '#555555',
    cardColor: '#f5f0ea',
    cardTextColor: '#333333',
    timeColor: '#555555',
    headerDayBg: '#333333',
    headerDayColor: '#ffffff',
    duaBg: '#f0ece6',
    duaText: '#444444',
    patternColor: '#ccbbaa',
    accent: '#8b7355',
    moonIcon: '🌙', sunIcon: '☀️', starIcon: '★',
  },
};

// ═══════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════
const canvas     = document.getElementById('mainCanvas');
const ctx        = canvas.getContext('2d');
const wrapper    = document.getElementById('canvasWrapper');
const mobileFrame= document.getElementById('mobileFrame');

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  applyCanvasSize();
  loadDefaultData();
  bindUI();
  render();
});

// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════

// ── Location database (mirrors server.js) ──
// Location database with lat/lng per district — used for direct AlAdhan API calls from browser
const PROVINCE_DATA = {
  songkhla:    { nameTh:'สงขลา', districts:{
    mueang:       { nameTh:'เมืองสงขลา',  lat:7.2075,  lng:100.5967 },
    hatyai:       { nameTh:'หาดใหญ่',      lat:7.0086,  lng:100.4747 },
    sadao:        { nameTh:'สะเดา',         lat:6.6381,  lng:100.4183 },
    thepha:       { nameTh:'เทพา',          lat:6.8405,  lng:100.9792 },
    nathawi:      { nameTh:'นาทวี',         lat:6.7131,  lng:100.7231 },
    ranot:        { nameTh:'ระโนด',         lat:7.7730,  lng:100.3116 },
    sathing:      { nameTh:'สทิงพระ',       lat:7.5170,  lng:100.4200 },
    singhanakhon: { nameTh:'สิงหนคร',       lat:7.2920,  lng:100.5550 },
    khlong_hoi:   { nameTh:'คลองหอยโข่ง',  lat:6.9770,  lng:100.4470 },
    bang_klam:    { nameTh:'บางกล่ำ',       lat:7.1320,  lng:100.5120 },
    na_mom:       { nameTh:'นาหม่อม',       lat:7.0900,  lng:100.6230 },
    khuan_niang:  { nameTh:'ควนเนียง',      lat:7.1750,  lng:100.4050 },
    chana:        { nameTh:'จะนะ',          lat:6.9110,  lng:100.7760 },
    sabayoi:      { nameTh:'สะบ้าย้อย',     lat:6.5680,  lng:100.9050 },
  }},
  pattani: { nameTh:'ปัตตานี', districts:{
    mueang:           { nameTh:'เมืองปัตตานี',   lat:6.8695, lng:101.2500 },
    nong_chik:        { nameTh:'หนองจิก',         lat:6.9360, lng:101.1810 },
    mayo:             { nameTh:'มายอ',             lat:6.6680, lng:101.5100 },
    yarang:           { nameTh:'ยะรัง',            lat:6.7380, lng:101.3660 },
    sai_buri:         { nameTh:'สายบุรี',          lat:6.6400, lng:101.7920 },
    kapho:            { nameTh:'กะพ้อ',            lat:6.5060, lng:101.7260 },
    khok_pho:         { nameTh:'โคกโพธิ์',         lat:6.8280, lng:101.1450 },
    panare:           { nameTh:'ปะนาเระ',          lat:6.7900, lng:101.5730 },
    mae_lan:          { nameTh:'แม่ลาน',           lat:6.9120, lng:101.2250 },
    thung_yang_daeng: { nameTh:'ทุ่งยางแดง',       lat:6.6080, lng:101.5280 },
    yaring:           { nameTh:'ยะริง',            lat:6.7090, lng:101.2360 },
    bacho:            { nameTh:'บาเจาะ',           lat:6.5630, lng:101.6430 },
  }},
  yala: { nameTh:'ยะลา', districts:{
    mueang:       { nameTh:'เมืองยะลา',  lat:6.5413, lng:101.2800 },
    betong:       { nameTh:'เบตง',        lat:5.7750, lng:101.0700 },
    bannang:      { nameTh:'บันนังสตา',   lat:6.2640, lng:101.2530 },
    yaha:         { nameTh:'ยะหา',        lat:6.4420, lng:101.2100 },
    raman:        { nameTh:'รามัน',        lat:6.4680, lng:101.3380 },
    kabang:       { nameTh:'กาบัง',       lat:6.1870, lng:101.3020 },
    krong_pinang: { nameTh:'กรงปินัง',   lat:6.3190, lng:101.4260 },
    than_to:      { nameTh:'ธารโต',       lat:6.0010, lng:101.1990 },
  }},
  narathiwat: { nameTh:'นราธิวาส', districts:{
    mueang:    { nameTh:'เมืองนราธิวาส', lat:6.4251, lng:101.8233 },
    takbai:    { nameTh:'ตากใบ',          lat:6.2580, lng:102.0450 },
    bacho:     { nameTh:'บาเจาะ',         lat:6.5630, lng:101.6430 },
    yi_ngo:    { nameTh:'ยี่งอ',          lat:6.4840, lng:101.9350 },
    ra_ngae:   { nameTh:'ระแงะ',          lat:6.2300, lng:101.8360 },
    ruso:      { nameTh:'รือเสาะ',        lat:6.2200, lng:101.6990 },
    si_sakhon: { nameTh:'ศรีสาคร',        lat:6.1600, lng:101.6500 },
    sukhirin:  { nameTh:'สุคิริน',        lat:5.8840, lng:101.7950 },
    chanae:    { nameTh:'จะแนะ',          lat:6.0640, lng:101.7800 },
    sungnoen:  { nameTh:'สุไหงโก-ลก',    lat:6.0330, lng:101.9730 },
    waeng:     { nameTh:'แว้ง',           lat:5.8490, lng:101.9080 },
  }},
  satun: { nameTh:'สตูล', districts:{
    mueang:       { nameTh:'เมืองสตูล',  lat:6.6238, lng:100.0673 },
    khuan_don:    { nameTh:'ควนโดน',      lat:6.7560, lng:100.1250 },
    khuan_kalong: { nameTh:'ควนกาหลง',   lat:6.9050, lng:100.1730 },
    tha_phae:     { nameTh:'ท่าแพ',       lat:6.5840, lng:100.2430 },
    la_ngu:       { nameTh:'ละงู',        lat:6.9140, lng:99.8280  },
    thung_wa:     { nameTh:'ทุ่งหว้า',    lat:6.9140, lng:99.6820  },
    manang:       { nameTh:'มะนัง',       lat:6.3390, lng:100.3010 },
  }},
  phuket: { nameTh:'ภูเก็ต', districts:{
    mueang:  { nameTh:'เมืองภูเก็ต', lat:7.8804, lng:98.3923 },
    kathu:   { nameTh:'กะทู้',        lat:7.9050, lng:98.3270 },
    thalang: { nameTh:'ถลาง',         lat:8.0720, lng:98.3550 },
  }},
  trang: { nameTh:'ตรัง', districts:{
    mueang:   { nameTh:'เมืองตรัง', lat:7.5593, lng:99.6113 },
    kantang:  { nameTh:'กันตัง',     lat:7.4060, lng:99.5150 },
    palian:   { nameTh:'ปะเหลียน',   lat:7.2050, lng:99.7360 },
    sikao:    { nameTh:'สิเกา',      lat:7.5850, lng:99.3440 },
    huai_yot: { nameTh:'ห้วยยอด',   lat:7.7920, lng:99.6410 },
  }},
  phatthalung: { nameTh:'พัทลุง', districts:{
    mueang:       { nameTh:'เมืองพัทลุง', lat:7.6166, lng:100.0741 },
    kong_ra:      { nameTh:'กงหรา',        lat:7.4910, lng:99.8540  },
    pak_phayun:   { nameTh:'ปากพะยูน',    lat:7.3480, lng:100.2650 },
    khuan_khanun: { nameTh:'ควนขนุน',     lat:7.7250, lng:100.0160 },
  }},
  krabi: { nameTh:'กระบี่', districts:{
    mueang:      { nameTh:'เมืองกระบี่', lat:8.0863, lng:98.9063 },
    ao_luek:     { nameTh:'อ่าวลึก',     lat:8.3990, lng:98.7680 },
    khao_phanom: { nameTh:'เขาพนม',      lat:8.4730, lng:99.1360 },
    ko_lanta:    { nameTh:'เกาะลันตา',   lat:7.6380, lng:99.0780 },
  }},
  surat_thani: { nameTh:'สุราษฎร์ธานี', districts:{
    mueang:   { nameTh:'เมืองสุราษฎร์ธานี', lat:9.1382, lng:99.3214  },
    ko_samui: { nameTh:'เกาะสมุย',           lat:9.5530, lng:100.0680 },
    chaiya:   { nameTh:'ไชยา',               lat:9.3760, lng:99.1820  },
  }},
  bangkok: { nameTh:'กรุงเทพมหานคร', districts:{
    phra_nakhon: { nameTh:'พระนคร',    lat:13.7563, lng:100.5018 },
    min_buri:    { nameTh:'มีนบุรี',   lat:13.8150, lng:100.7120 },
    lat_krabang: { nameTh:'ลาดกระบัง', lat:13.7240, lng:100.7800 },
    bang_rak:    { nameTh:'บางรัก',    lat:13.7280, lng:100.5150 },
    chatuchak:   { nameTh:'จตุจักร',   lat:13.8220, lng:100.5630 },
  }},
  chiangmai: { nameTh:'เชียงใหม่', districts:{
    mueang:    { nameTh:'เมืองเชียงใหม่', lat:18.7883, lng:98.9853 },
    hang_dong: { nameTh:'หางดง',           lat:18.6750, lng:98.9440 },
    san_sai:   { nameTh:'สันทราย',         lat:18.8660, lng:99.0630 },
    mae_rim:   { nameTh:'แม่ริม',          lat:18.9200, lng:98.9560 },
  }},
};

// ── Populate district dropdown when province changes ──
function populateDistricts(provKey) {
  const sel   = document.getElementById('selectDistrict');
  const pData = PROVINCE_DATA[provKey];
  if (!pData) return;
  sel.innerHTML = '';
  for (const [key, d] of Object.entries(pData.districts)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = d.nameTh;
    sel.appendChild(opt);
  }
}

function loadDefaultData() {
  // Populate districts for default province (songkhla)
  populateDistricts('songkhla');
  // Set default district to hatyai
  document.getElementById('selectDistrict').value = 'hatyai';
  STATE.data = generateFallbackData();
  STATE.location = 'HATYAI';
  document.getElementById('inputLocation').value = STATE.location;
  setStatus('ใช้ข้อมูลตัวอย่าง – กด "โหลดข้อมูล" เพื่อดึงจาก AlAdhan API', 'info');
}

async function fetchData() {
  const province  = document.getElementById('selectProvince').value;
  const distKey   = document.getElementById('selectDistrict').value;
  const pData     = PROVINCE_DATA[province];
  const distData  = pData?.districts[distKey];
  const dName     = distData?.nameTh || distKey;
  const pName     = pData?.nameTh    || province;
  const lat       = distData?.lat    || 7.0086;
  const lng       = distData?.lng    || 100.4747;

  setStatus('⏳ กำลังดึงข้อมูลจาก AlAdhan API...', 'info');
  showLoading(true);

  try {
    // เรียก AlAdhan API โดยตรงจาก browser (รองรับ CORS)
    const data = await fetchAlAdhanDirect(lat, lng);

    STATE.data = data;
    STATE.location = dName + ' ' + pName;
    document.getElementById('inputLocation').value = dName + ' ' + pName;

    const coordEl = document.getElementById('coordInfo');
    coordEl.textContent = '📍 ' + dName + ', ' + pName + '  |  ' + lat.toFixed(4) + '°N, ' + lng.toFixed(4) + '°E';
    coordEl.classList.add('visible');

    setStatus('✅ โหลดสำเร็จ ' + data.length + ' วัน (19 ก.พ.–20 มี.ค. 2569) | ' + dName + ' จาก AlAdhan API', 'ok');
    render();
  } catch (e) {
    console.error('AlAdhan direct error:', e);
    STATE.data = generateFallbackData();
    setStatus('❌ ดึงข้อมูลไม่สำเร็จ: ' + e.message + ' — ใช้ข้อมูลสำรอง', 'err');
    render();
  }
  showLoading(false);
}

// ── เรียก AlAdhan API โดยตรงจาก browser ──────────────────────
async function fetchAlAdhanDirect(lat, lng) {
  const ALADHAN  = 'https://api.aladhan.com/v1';
  const METHOD   = 11; // MUIS (ใช้ใน SEA / ไทย)
  const TIMEZONE = 'Asia/Bangkok';

  const thaiMonths = ['ม.ค.','ก.พ.','มี.นา','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const thaiDays   = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  // ดึง 2 เดือนคู่กัน: กุมภาพันธ์ + มีนาคม 2026
  const urls = [
    `${ALADHAN}/calendar/2026/2?latitude=${lat}&longitude=${lng}&method=${METHOD}&timezone=${TIMEZONE}`,
    `${ALADHAN}/calendar/2026/3?latitude=${lat}&longitude=${lng}&method=${METHOD}&timezone=${TIMEZONE}`,
  ];

  const [res1, res2] = await Promise.all(urls.map(u => fetch(u)));
  if (!res1.ok) throw new Error('AlAdhan Feb: HTTP ' + res1.status);
  if (!res2.ok) throw new Error('AlAdhan Mar: HTTP ' + res2.status);

  const [json1, json2] = await Promise.all([res1.json(), res2.json()]);
  if (json1.code !== 200) throw new Error('AlAdhan: ' + json1.status);
  if (json2.code !== 200) throw new Error('AlAdhan: ' + json2.status);

  const allDays = [...json1.data, ...json2.data];

  // กรองเฉพาะ 19 ก.พ. – 20 มี.ค. 2026
  const t0 = new Date(2026, 1, 19).getTime();
  const t1 = new Date(2026, 2, 20).getTime();

  let ramadanDay = 1;
  return allDays
    .map(d => {
      const parts = d.date.gregorian.date.split('-'); // DD-MM-YYYY
      const dt    = new Date(+parts[2], +parts[1]-1, +parts[0]);
      const strip = t => t.split(' ')[0]; // ตัด timezone suffix
      return { dt, d, strip };
    })
    .filter(({ dt }) => dt.getTime() >= t0 && dt.getTime() <= t1)
    .map(({ dt, d, strip }) => ({
      ramadanDay:     ramadanDay++,
      date:           dt.getDate(),
      month:          thaiMonths[dt.getMonth()],
      monthIndex:     dt.getMonth(),
      year:           dt.getFullYear(),
      dayOfWeek:      thaiDays[dt.getDay()],
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

// Built-in fallback data (30 days Ramadan 2026, Hat Yai)
// Ramadan 1447H starts Feb 18 2026 — verified as Wednesday in Thailand
// but per the image reference day 1 falls on Thursday column (พฤ = index 4)
// so we pin dayOfWeekIndex=4 for day 1 and increment normally.
function generateFallbackData(city, year) {
  const thaiMonths = ['ม.ค.','ก.พ.','มี.นา','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const thaiDays   = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const days = [];
  const fmt = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

  // Day 1 = 19 ก.พ. on Thursday (dowIndex = 4)
  const startDow = 4; // พฤหัสบดี
  const startDate = 19;
  const startMonth = 1; // February (0-indexed)
  const startYear = 2026;

  for (let i = 0; i < 30; i++) {
    const d = new Date(startYear, startMonth, startDate + i);
    const fajr   = 5*60 + 20 - Math.floor(i*0.33);
    const maghrib= 18*60+ 30 - Math.floor(i*0.034);
    const dow = (startDow + i) % 7;
    days.push({
      ramadanDay: i + 1,
      date: d.getDate(),
      month: thaiMonths[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      dayOfWeek: thaiDays[dow],
      dayOfWeekIndex: dow,
      fajr:    fmt(fajr),
      sunrise: fmt(6*60+35 - Math.floor(i*0.2)),
      dhuhr:   fmt(12*60+22),
      asr:     fmt(15*60+41),
      maghrib: fmt(maghrib),
      isha:    fmt(19*60+45),
      suhoor:  fmt(fajr),
      iftar:   fmt(maghrib),
    });
  }
  return days;
}

// ═══════════════════════════════════════════
//  UI BINDING
// ═══════════════════════════════════════════
function bindUI() {
  // Data – province/district two-level dropdown
  document.getElementById('selectProvince').addEventListener('change', e => {
    populateDistricts(e.target.value);
    document.getElementById('coordInfo').classList.remove('visible');
  });
  document.getElementById('btnFetchData').addEventListener('click', fetchData);

  // Canvas size
  document.getElementById('btnApplySize').addEventListener('click', () => {
    STATE.canvas.w = parseInt(document.getElementById('canvasW').value) || 1080;
    STATE.canvas.h = parseInt(document.getElementById('canvasH').value) || 1920;
    applyCanvasSize();
    render();
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.canvas.w = parseInt(btn.dataset.w);
      STATE.canvas.h = parseInt(btn.dataset.h);
      document.getElementById('canvasW').value = STATE.canvas.w;
      document.getElementById('canvasH').value = STATE.canvas.h;
      applyCanvasSize();
      render();
    });
  });

  // Theme
  document.querySelectorAll('.theme-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.theme = btn.dataset.theme;
      applyThemeDefaults();
      render();
    });
  });

  // Text
  ['inputTitle','inputLocation','inputDuaSuhoor','inputDuaIftar','inputDayLabels'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      STATE.title    = document.getElementById('inputTitle').value;
      STATE.location = document.getElementById('inputLocation').value;
      STATE.duaSuhoor= document.getElementById('inputDuaSuhoor').value;
      STATE.duaIftar = document.getElementById('inputDuaIftar').value;
      STATE.dayLabels= document.getElementById('inputDayLabels').value.split(',').map(s=>s.trim());
      render();
    });
  });

  // Background
  document.getElementById('bgType').addEventListener('change', e => {
    STATE.bg.type = e.target.value;
    document.getElementById('bgGradientOpts').style.display = STATE.bg.type==='gradient' ? '' : 'none';
    document.getElementById('bgImageOpts').style.display    = STATE.bg.type==='image'    ? '' : 'none';
    document.getElementById('bgPatternOpts').style.display  = STATE.bg.type==='pattern'  ? '' : 'none';
    render();
  });
  document.getElementById('bgColor1').addEventListener('input', e => { STATE.bg.color1 = e.target.value; render(); });
  document.getElementById('bgColor2').addEventListener('input', e => { STATE.bg.color2 = e.target.value; render(); });
  document.getElementById('bgGradientDir').addEventListener('change', e => { STATE.bg.dir = e.target.value; render(); });
  document.getElementById('bgOverlay').addEventListener('input', e => { STATE.bg.overlayOpacity = e.target.value/100; render(); });
  document.getElementById('patternColor').addEventListener('input', e => { STATE.bg.patternColor = e.target.value; render(); });
  document.getElementById('patternOpacity').addEventListener('input', e => { STATE.bg.patternOpacity = e.target.value/100; render(); });
  document.getElementById('showGeometric').addEventListener('change', e => { STATE.bg.showGeometric = e.target.checked; render(); });

  document.getElementById('bgImageUpload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => { STATE.bgImage = img; render(); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Card
  document.getElementById('cardColor').addEventListener('input', e => { STATE.card.color = e.target.value; render(); });
  document.getElementById('cardOpacity').addEventListener('input', e => { STATE.card.opacity = e.target.value/100; render(); });
  document.getElementById('cardRadius').addEventListener('input', e => { STATE.card.radius = e.target.value/100; render(); });
  document.getElementById('showIcons').addEventListener('change', e => { STATE.card.showIcons = e.target.checked; render(); });

  // ── Font selectors ──────────────────────────────────
  function updateFontPreview() {
    const numEl   = document.querySelector('.fp-num');
    const bodyEl  = document.querySelector('.fp-body');
    const titleEl = document.querySelector('.fp-title');
    if (numEl)   numEl.style.fontFamily   = STATE.font.ramadan;
    if (bodyEl)  bodyEl.style.fontFamily  = STATE.font.body;
    if (titleEl) titleEl.style.fontFamily = STATE.font.title;
  }

  document.getElementById('fontRamadan').addEventListener('change', e => {
    STATE.font.ramadan = e.target.value;
    updateFontPreview();
    render();
  });
  document.getElementById('fontBody').addEventListener('change', e => {
    STATE.font.body = e.target.value;
    updateFontPreview();
    render();
  });
  document.getElementById('fontTitle').addEventListener('change', e => {
    STATE.font.title = e.target.value;
    updateFontPreview();
    render();
  });
  // Init font preview
  updateFontPreview();

  // ── Card layout sliders ─────────────────────────────
  function bindSlider(id, stateKey, valId, suffix, isNested, nestedKey) {
    const el  = document.getElementById(id);
    const lbl = document.getElementById(valId);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (isNested) STATE[nestedKey][stateKey] = v;
      else          STATE[stateKey] = v;
      if (lbl) lbl.textContent = v + suffix;
      render();
    });
  }
  bindSlider('cardHeight',   'height',   'cardHeightVal',   'px',  true,  'card');
  bindSlider('cardGap',      'gap',      'cardGapVal',      'px',  true,  'card');
  bindSlider('cardMarginX',  'marginX',  'cardMarginXVal',  'px',  true,  'card');
  bindSlider('gridOffsetY',  'offsetY',  'gridOffsetYVal',  'px',  true,  'card');
  bindSlider('numFontSize',  'numSize',  'numFontSizeVal',  'px',  true,  'font');
  bindSlider('timeFontSize', 'timeSize', 'timeFontSizeVal', 'px',  true,  'font');

  // Zoom
  document.getElementById('btnZoomIn').addEventListener('click', () => { STATE.zoom = Math.min(2, STATE.zoom+0.1); applyZoom(); });
  document.getElementById('btnZoomOut').addEventListener('click', () => { STATE.zoom = Math.max(0.1, STATE.zoom-0.1); applyZoom(); });
  document.getElementById('btnZoomFit').addEventListener('click', fitZoom);

  // Mobile frame
  document.getElementById('showMobileFrame').addEventListener('change', e => {
    STATE.showMobileFrame = e.target.checked;
    mobileFrame.classList.toggle('hidden', !STATE.showMobileFrame);
  });

  // Export
  document.getElementById('btnExportPng').addEventListener('click', () => exportCanvas('png'));
  document.getElementById('btnExportJpg').addEventListener('click', () => exportCanvas('jpeg'));
}

function applyThemeDefaults() {
  const t = THEMES[STATE.theme];
  STATE.bg.color1 = t.bg1;
  STATE.bg.color2 = t.bg2;
  STATE.card.color = t.cardColor;
  document.getElementById('bgColor1').value = t.bg1;
  document.getElementById('bgColor2').value = t.bg2;
  document.getElementById('cardColor').value = t.cardColor;
}

// ═══════════════════════════════════════════
//  CANVAS SIZE & ZOOM
// ═══════════════════════════════════════════
function applyCanvasSize() {
  canvas.width  = STATE.canvas.w;
  canvas.height = STATE.canvas.h;
  fitZoom();
}

function fitZoom() {
  const stage = document.getElementById('canvasStage');
  const availW = stage.clientWidth  - 80;
  const availH = stage.clientHeight - 80;
  const zW = availW / STATE.canvas.w;
  const zH = availH / STATE.canvas.h;
  STATE.zoom = Math.min(zW, zH, 1);
  applyZoom();
}

function applyZoom() {
  const z = STATE.zoom;
  canvas.style.width  = `${STATE.canvas.w * z}px`;
  canvas.style.height = `${STATE.canvas.h * z}px`;
  document.getElementById('zoomLabel').textContent = `${Math.round(z*100)}%`;
}

// ═══════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════
function exportCanvas(fmt) {
  const mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
  const ext  = fmt;
  const link = document.createElement('a');
  link.download = `ramadan-2026-${STATE.location.toLowerCase()}.${ext}`;
  link.href = canvas.toDataURL(mime, 0.95);
  link.click();
}

// ═══════════════════════════════════════════
//  RENDER  (main canvas drawing function)
// ═══════════════════════════════════════════
function render() {
  const W = STATE.canvas.w;
  const H = STATE.canvas.h;
  const t = THEMES[STATE.theme];
  ctx.clearRect(0, 0, W, H);

  // Scale factor based on reference 1080×1920
  const SF = W / 1080;

  drawBackground(W, H, t, SF);
  if (STATE.bg.showGeometric) drawGeometricOverlay(W, H, t, SF);
  drawHeader(W, H, t, SF);
  drawDayHeaders(W, H, t, SF);
  drawCalendarGrid(W, H, t, SF);
  drawDuaSection(W, H, t, SF);
}

// ─── Background ───────────────────────────
function drawBackground(W, H, t, SF) {
  const bg = STATE.bg;

  if (bg.type === 'image' && STATE.bgImage) {
    // Cover fill
    const img = STATE.bgImage;
    const scale = Math.max(W/img.width, H/img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, (W-sw)/2, (H-sh)/2, sw, sh);
    // Overlay
    ctx.fillStyle = `rgba(253,232,240,${bg.overlayOpacity})`;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Gradient or pattern (use gradient as base)
  let grad;
  const c1 = bg.type === 'pattern' ? t.bg1 : bg.color1;
  const c2 = bg.type === 'pattern' ? t.bg2 : bg.color2;

  if (bg.dir === 'horizontal') {
    grad = ctx.createLinearGradient(0, 0, W, 0);
  } else if (bg.dir === 'diagonal') {
    grad = ctx.createLinearGradient(0, 0, W, H);
  } else {
    grad = ctx.createLinearGradient(0, 0, 0, H);
  }
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (bg.type === 'pattern') drawIslamicPattern(W, H, bg.patternColor, bg.patternOpacity, SF);
}

// ─── Islamic Geometric Pattern ───────────────────────────
function drawIslamicPattern(W, H, color, opacity, SF) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const size = 80 * SF;
  const hex = color;
  ctx.strokeStyle = hex;
  ctx.lineWidth = 1 * SF;

  // Simple 8-pointed star tiling
  for (let y = -size; y < H + size; y += size * 1.15) {
    for (let x = -size; x < W + size; x += size * 1.15) {
      drawEightPointedStar(x, y, size * 0.4);
    }
  }
  ctx.restore();
}

function drawEightPointedStar(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 - Math.PI/8;
    const innerR = r * 0.4;
    const outerA = angle;
    const innerA = angle + Math.PI/8;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(outerA), cy + r * Math.sin(outerA));
    else ctx.lineTo(cx + r * Math.cos(outerA), cy + r * Math.sin(outerA));
    ctx.lineTo(cx + innerR * Math.cos(innerA), cy + innerR * Math.sin(innerA));
  }
  ctx.closePath();
  ctx.stroke();
}

// ─── Geometric Overlay (decorative) ───────────────────────────
function drawGeometricOverlay(W, H, t, SF) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = t.patternColor;
  ctx.lineWidth = 1.5 * SF;

  // Large decorative arcs top-right
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W, 0, (120 + i*80)*SF, 0, Math.PI*2);
    ctx.stroke();
  }
  // Large decorative arcs bottom-left
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, H, (80 + i*90)*SF, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Header ───────────────────────────────────────────────
function drawHeader(W, H, t, SF) {
  const cx = W / 2;

  // Decorative crescent moon (top decoration)
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.arc(cx, -40*SF, 220*SF, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Title "Ramadan"
  const titleY = 148 * SF;
  ctx.font = `bold ${88*SF}px ${STATE.font.title}`;
  ctx.textAlign = 'center';

  // Gradient text
  const grad = ctx.createLinearGradient(cx - 220*SF, 0, cx + 220*SF, 0);
  grad.addColorStop(0, t.titleColor[0]);
  grad.addColorStop(1, t.titleColor[1]);
  ctx.fillStyle = grad;
  ctx.fillText(STATE.title, cx, titleY);

  // Shadow/glow
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.filter = `blur(${12*SF}px)`;
  ctx.fillStyle = t.titleColor[0];
  ctx.fillText(STATE.title, cx, titleY);
  ctx.restore();

  // Location pin icon + name
  const locY = titleY + 56*SF;
  ctx.font = `${32*SF}px 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = t.locationColor;
  ctx.textAlign = 'center';
  ctx.fillText(`📍 ${STATE.location}`, cx, locY);

  // Decorative divider line
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 2 * SF;
  const lw = 120 * SF;
  ctx.beginPath();
  ctx.moveTo(cx - lw, locY + 20*SF);
  ctx.lineTo(cx + lw, locY + 20*SF);
  ctx.stroke();
  ctx.restore();
}

// ─── Day-of-week header row ─────────────────────────────────
function drawDayHeaders(W, H, t, SF) {
  const labels = STATE.dayLabels.length === 7
    ? STATE.dayLabels
    : ['อา','จ','อ','พ','พฤ','ศ','ส'];

  const marginX = 28 * SF;
  const gridW   = W - marginX * 2;
  const cellW   = gridW / 7;
  const topY    = 260 * SF;
  const cellH   = 52 * SF;
  const pad     = 4 * SF;

  labels.forEach((label, i) => {
    const x = marginX + i * cellW;
    const cx = x + cellW / 2;

    // Background blob
    const r = Math.min(cellW, cellH) / 2 - pad;
    ctx.save();
    ctx.fillStyle = t.headerDayBg;
    drawRoundedRect(cx - r, topY, r * 2, cellH - pad, r * 0.55);
    ctx.fill();
    ctx.restore();

    ctx.font = `bold ${26*SF}px 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = t.headerDayColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, topY + (cellH - pad) / 2);
    ctx.textBaseline = 'alphabetic';
  });
}

// ─── Calendar Grid ──────────────────────────────────────────
function drawCalendarGrid(W, H, t, SF) {
  const data = STATE.data;
  if (!data || data.length === 0) return;

  const marginX = STATE.card.marginX * SF;
  const gridW   = W - marginX * 2;
  const cellW   = gridW / 7;
  const startY  = 326 * SF + STATE.card.offsetY * SF;
  const cellH   = STATE.card.height * SF;
  const gap     = STATE.card.gap * SF;
  const padCard = 4 * SF;

  // First day of the week for the first data entry
  const firstDow = data[0].dayOfWeekIndex; // 0=Sun

  let col = firstDow;
  let row = 0;

  // Draw special "start marker" for first cell (ซูฮูร/มัฆริบ labels)
  if (firstDow > 0) {
    // Draw legend in first row, first half
    const lx = marginX + padCard;
    const ly = startY + padCard;
    const lw = cellW * firstDow - padCard * 2;
    const lh = cellH - padCard * 2;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = STATE.card.color;
    drawRoundedRect(lx, ly, lw, lh, lh * STATE.card.radius * 0.5);
    ctx.fill();
    ctx.restore();

    // Label
    ctx.fillStyle = t.timeColor;
    ctx.font = `bold ${20*SF}px 'Noto Sans Thai',sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ซูฮูร', lx + lw/2, ly + lh/2 - 12*SF);
    ctx.fillText('มัฆริบ', lx + lw/2, ly + lh/2 + 16*SF);
  }

  data.forEach((day, idx) => {
    const x = marginX + col * cellW + padCard;
    const y = startY + row * (cellH + gap) + padCard;
    const cw = cellW - padCard * 2;
    const ch = cellH - padCard * 2;

    drawDayCard(day, x, y, cw, ch, t, SF);

    col++;
    if (col >= 7) { col = 0; row++; }
  });
}

function drawDayCard(day, x, y, w, h, t, SF) {
  const r = h * STATE.card.radius * 0.6;

  // Card background
  ctx.save();
  ctx.globalAlpha = STATE.card.opacity;

  // Subtle shadow
  ctx.shadowColor = 'rgba(180,80,120,0.18)';
  ctx.shadowBlur  = 12 * SF;
  ctx.shadowOffsetY = 4 * SF;

  ctx.fillStyle = STATE.card.color;
  drawRoundedRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  ctx.save();

  // ── Consistent inner padding ──
  const px = 10 * SF;  // horizontal padding inside card
  const pt = 8 * SF;   // top padding
  const pb = 10 * SF;  // bottom padding

  // ── Dynamic font sizes ──
  const fNum  = STATE.font.numSize  * SF;   // Ramadan day number
  const fTime = STATE.font.timeSize * SF;   // time text
  const fSmall= Math.max(10, fTime * 0.82);  // date/month small text
  const fIcon = Math.max(10, fTime * 0.88);  // icon size

  // Big Ramadan day number – top-left
  ctx.font = `bold ${fNum}px ${STATE.font.ramadan}`;
  ctx.fillStyle = t.cardTextColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(day.ramadanDay, x + px, y + pt);

  // Small Gregorian date – top-right
  ctx.font = `bold ${fSmall}px ${STATE.font.body}`;
  ctx.fillStyle = t.accent;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(day.date, x + w - px, y + pt + 2*SF);

  // Small month label – just below date, top-right
  ctx.font = `${fSmall * 0.88}px ${STATE.font.body}`;
  ctx.fillStyle = t.timeColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(day.month, x + w - px, y + pt + 2*SF + fSmall + 2*SF);

  // ── BOTTOM: Suhoor / Iftar times ──
  const rowSpacing = fTime + 6*SF;
  const row2Y = y + h - pb;
  const row1Y = row2Y - rowSpacing;

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  if (STATE.card.showIcons) {
    // Suhoor row
    ctx.font = `${fIcon}px sans-serif`;
    ctx.fillText('🌙', x + px, row1Y);
    ctx.font = `bold ${fTime}px ${STATE.font.body}`;
    ctx.fillStyle = t.timeColor;
    ctx.fillText(day.suhoor || day.fajr, x + px + fIcon + 3*SF, row1Y);

    // Iftar row
    ctx.font = `${fIcon}px sans-serif`;
    ctx.fillText('☀️', x + px, row2Y);
    ctx.font = `bold ${fTime}px ${STATE.font.body}`;
    ctx.fillStyle = t.timeColor;
    ctx.fillText(day.iftar || day.maghrib, x + px + fIcon + 3*SF, row2Y);
  } else {
    ctx.font = `bold ${fTime}px ${STATE.font.body}`;
    ctx.fillStyle = t.timeColor;
    ctx.fillText(day.fajr,    x + px, row1Y);
    ctx.fillText(day.maghrib, x + px, row2Y);
  }

  ctx.restore();
}

// ─── Dua Section ──────────────────────────────────────────
function drawDuaSection(W, H, t, SF) {
  const rows = STATE.data.length;
  if (!rows) return;

  // Calculate where the last grid row ends
  const firstDow = STATE.data[0].dayOfWeekIndex;
  const totalCells = firstDow + rows;
  const numRows = Math.ceil(totalCells / 7);

  const marginX = STATE.card.marginX * SF;
  const startY  = 326 * SF + STATE.card.offsetY * SF;
  const cellH   = STATE.card.height * SF;
  const gap     = STATE.card.gap * SF;
  const duaY    = startY + numRows * (cellH + gap) + 20 * SF;

  const boxW = W - marginX * 2;

  // Suhoor dua box
  drawDuaBox(marginX, duaY, boxW, 115*SF, t, SF,
    'เนียต ซูฮูร', STATE.duaSuhoor,
    'نَوَيْتُ', t.duaBg, t.duaText);

  // Iftar dua box
  const ifY = duaY + 125 * SF;
  drawDuaBox(marginX, ifY, boxW, 115*SF, t, SF,
    'ดุอาอ์ ละหมาด', STATE.duaIftar,
    'اللّٰهُمَّ', t.duaBg, t.duaText);
}

function drawDuaBox(x, y, w, h, t, SF, labelTh, arabicText, arabicSmall, bgCol, textCol) {
  // Box background
  ctx.save();
  ctx.fillStyle = bgCol;
  ctx.globalAlpha = 0.88;
  drawRoundedRect(x, y, w, h, 18*SF);
  ctx.fill();
  ctx.restore();

  // Label badge
  const badgeW = 110*SF;
  const badgeH = 28*SF;
  ctx.save();
  ctx.fillStyle = t.accent;
  ctx.globalAlpha = 0.9;
  drawRoundedRect(x + 10*SF, y - badgeH/2, badgeW, badgeH, badgeH/2);
  ctx.fill();
  ctx.restore();
  ctx.font = `bold ${17*SF}px 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelTh, x + 16*SF, y);
  ctx.textBaseline = 'alphabetic';

  // Arabic text (right-to-left display)
  ctx.font = `${22*SF}px 'Libre Baskerville', serif`;
  ctx.fillStyle = textCol;
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillText(arabicText, x + w/2, y + 52*SF);
  ctx.direction = 'ltr';

  // Decorative star
  ctx.font = `${14*SF}px sans-serif`;
  ctx.fillStyle = t.accent;
  ctx.textAlign = 'right';
  ctx.fillText('✦ ✦ ✦', x + w - 12*SF, y + h - 12*SF);
}

// ─── Utility ────────────────────────────────────────────────
function drawRoundedRect(x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function setStatus(msg, type) {
  const el = document.getElementById('dataStatus');
  el.textContent = msg;
  el.className = `status-msg ${type}`;
}

function showLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}