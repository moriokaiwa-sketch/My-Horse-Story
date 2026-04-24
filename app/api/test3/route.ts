import { NextResponse } from 'next/server';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = 'https://db.netkeiba.com/horse/2019105216/';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8' }, cache: 'no-store' });
    const status = res.status;
    const html = await res.arrayBuffer();
    const decodedHtml = iconv.decode(Buffer.from(html), 'euc-jp');
    
    return NextResponse.json({ ok: true, status, preview: decodedHtml.substring(0, 500) });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
