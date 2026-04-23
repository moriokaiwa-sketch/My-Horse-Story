import * as cheerio from 'cheerio';

export async function fetchHorseProfile(netkeibaId: string) {
  const url = `https://db.netkeiba.com/horse/${netkeibaId}/`;
  const res = await fetch(url, { cache: 'no-store' });
  const html = await res.arrayBuffer();
  const decoder = new TextDecoder('euc-jp');
  const decodedHtml = decoder.decode(html);
  
  const $ = cheerio.load(decodedHtml);
  
  const name = $('.horse_title h1').text().trim();
  if (!name) throw new Error('Horse not found');
  
  let nextRace = '未定';
  
  // プロフィール表から「次走」を探す (既存ロジック・保険)
  $('.db_prof_table tr').each((i, el) => {
    const th = $(el).find('th').text().trim();
    if (th === '次走') {
      nextRace = $(el).find('td').text().trim();
    }
  });

  // 専用の次走・近況情報ページから取得 (スクリーンショットのUI用)
  try {
    const nextUrl = `https://db.netkeiba.com/social/horse_info_next.html?id=${netkeibaId}`;
    const nextRes = await fetch(nextUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
    if (nextRes.ok) {
      const nextHtml = await nextRes.arrayBuffer();
      const $next = cheerio.load(decoder.decode(nextHtml));
      const nextRaceDd = $next('.next_race_dl dd').first();
      if (nextRaceDd.length > 0) {
        // 例: "2026/4/19 皐月賞" のように整形
        nextRace = nextRaceDd.text().replace(/\s+/g, ' ').trim();
      }
    }
  } catch(e) {
    console.error("次走・近況情報の取得に失敗しました", e);
  }
  
  return { name, profileUrl: url, nextRace };
}

export async function fetchHorseEvents(netkeibaId: string, horseDbId: string) {
  const url = `https://db.netkeiba.com/horse/result/${netkeibaId}/`;
  const res = await fetch(url, { cache: 'no-store' });
  const html = await res.arrayBuffer();
  const decoder = new TextDecoder('euc-jp');
  const decodedHtml = decoder.decode(html);
  const $ = cheerio.load(decodedHtml);
  
  const events: any[] = [];
  
  // Parse race results
  $('.db_h_race_results tbody tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length < 10) return;
    
    // Some rows might be cancelled races. We need basic info.
    const dateStr = $(tds[0]).text().trim(); // "2023/12/24"
    const raceName = $(tds[4]).text().trim(); // "有馬記念"
    const rank = $(tds[11]).text().trim(); // "1"
    const time = $(tds[18]).text().trim(); // "2:30.9"
    
    // Only parse valid dates
    const dateMatch = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!dateMatch) return;
    const parsedDate = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
    
    // Basic filtering to ensure we have a race outcome
    if (!rank || isNaN(Number(rank))) return; // Rank might be "取" (Cancelled)

    events.push({
      type: 'RACE',
      title: `${raceName} - ${rank}着`,
      summary: `タイム: ${time}`,
      sourceUrl: url,
      date: parsedDate,
      horseId: horseDbId,
    });
  });
  
  return events;
}
