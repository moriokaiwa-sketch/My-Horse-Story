import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function fetchHorseProfile(netkeibaId: string) {
  const url = `https://db.netkeiba.com/horse/${netkeibaId}/`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, cache: 'no-store' });
  const html = await res.arrayBuffer();
  const decodedHtml = iconv.decode(Buffer.from(html), 'euc-jp');
  
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
        const $next = cheerio.load(iconv.decode(Buffer.from(nextHtml), 'euc-jp'));
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
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, cache: 'no-store' });
  const html = await res.arrayBuffer();
  const decodedHtml = iconv.decode(Buffer.from(html), 'euc-jp');
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

// ニュースの日付文字列（「2時間前」「2026年04月20日」など）をDateオブジェクトにパースするヘルパー
function parseNewsDate(dateText: string): Date {
  const now = new Date();
  if (dateText.includes('時間前')) {
    const hours = parseInt(dateText, 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }
  if (dateText.includes('分前')) {
    const mins = parseInt(dateText, 10);
    return new Date(now.getTime() - mins * 60 * 1000);
  }
  
  // YYYY年MM月DD日 の形式
  const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    // 時間表記があれば設定
    const timeMatch = dateText.match(/(\d{1,2})時(\d{1,2})分/);
    if (timeMatch) {
      date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    }
    return date;
  }
  return now; // パースできない場合は現在時刻をフォールバック
}

// 関連ニュースを取得して戦績イベント互換の形式で返す
export async function fetchHorseNews(horseName: string, limit: number = 3) {
  const url = `https://news.netkeiba.com/?pid=api_get_news_search&keyword=${encodeURIComponent(horseName)}&limit=${limit}&output=jsonp`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
    const buffer = await res.arrayBuffer();
    const rawStr = iconv.decode(Buffer.from(buffer), 'euc-jp');
    
    // JSONPレスポンス ("<html>...") から前後のカッコを外し、JSONパースしてHTML文字列を取り出す
    const jsonStr = rawStr.replace(/^\(/, '').replace(/\)$/, '');
    const html = JSON.parse(jsonStr);
    
    const $ = cheerio.load(html);
    const articles: any[] = [];
    
    $('.NewsList').each((i, el) => {
      if (articles.length >= limit) return;
      
      const a = $(el).find('a.ArticleLink');
      if (a.length === 0) return;
      
      const title = a.find('.NewsTitle').text().trim();
      const link = a.attr('href');
      const img = a.find('img.Image').attr('src');
      const dateText = a.find('.NewsData .Time').text().trim();
      
      if (title && link) {
        articles.push({
          id: `news_${horseName}_${i}`, // タイムラインのマージキー用ダミーID
          type: 'NEWS',
          title,
          summary: null,
          sourceUrl: link,
          thumbnailUrl: img || null,
          date: parseNewsDate(dateText),
          horse: { name: horseName }
        });
      }
    });
    return articles;
  } catch (e: any) {
    if (e.digest === 'DYNAMIC_SERVER_USAGE') throw e;
    console.error(`Failed to fetch news for ${horseName}:`, e);
    return [];
  }
}
