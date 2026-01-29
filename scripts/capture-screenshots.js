const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://blacklabel.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '../guide-screenshots');

async function captureScreenshots() {
  // 출력 폴더 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro 사이즈
    deviceScaleFactor: 2,
    isMobile: true,
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  console.log('캡처 시작...\n');

  // 1. 대시보드 (메인 페이지)
  console.log('1. 대시보드 캡처 중...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '01_dashboard.png'),
    fullPage: true
  });
  console.log('   ✓ 01_dashboard.png 저장됨\n');

  // 2. 반납상태 등록 페이지
  console.log('2. 반납상태 등록 페이지 캡처 중...');
  await page.goto(`${BASE_URL}/inspections/new?mode=return`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '02_return_status_form.png'),
    fullPage: true
  });
  console.log('   ✓ 02_return_status_form.png 저장됨\n');

  // 3. 세차·점검 등록 페이지
  console.log('3. 세차·점검 등록 페이지 캡처 중...');
  await page.goto(`${BASE_URL}/inspections/new?mode=carwash`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '03_carwash_form.png'),
    fullPage: true
  });
  console.log('   ✓ 03_carwash_form.png 저장됨\n');

  // 4. 소모품·경정비 등록 페이지
  console.log('4. 소모품·경정비 등록 페이지 캡처 중...');
  await page.goto(`${BASE_URL}/maintenance/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '04_maintenance_form.png'),
    fullPage: true
  });
  console.log('   ✓ 04_maintenance_form.png 저장됨\n');

  // 5. 차량 목록 페이지
  console.log('5. 차량 목록 페이지 캡처 중...');
  await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, '05_vehicle_list.png'),
    fullPage: true
  });
  console.log('   ✓ 05_vehicle_list.png 저장됨\n');

  // 데스크톱 버전도 캡처
  console.log('데스크톱 버전 캡처 중...\n');

  await context.close();

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'ko-KR',
  });

  const desktopPage = await desktopContext.newPage();

  // 6. 대시보드 (데스크톱)
  console.log('6. 대시보드 (데스크톱) 캡처 중...');
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({
    path: path.join(OUTPUT_DIR, '06_dashboard_desktop.png'),
    fullPage: true
  });
  console.log('   ✓ 06_dashboard_desktop.png 저장됨\n');

  await browser.close();

  console.log('========================================');
  console.log(`모든 캡처 완료! 저장 위치: ${OUTPUT_DIR}`);
  console.log('========================================');
}

captureScreenshots().catch(console.error);
