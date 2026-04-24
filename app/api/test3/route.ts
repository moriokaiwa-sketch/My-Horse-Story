import { NextResponse } from 'next/server';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = 'https://db.netkeiba.com/horse/2019105216/';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, cache: 'no-store' });
    const status = res.status;
    const html = await res.arrayBuffer();
    const decodedHtml = iconv.decode(Buffer.from(html), 'euc-jp');
    
    return NextResponse.json({ ok: true, status, preview: decodedHtml.substring(0, 500) });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
