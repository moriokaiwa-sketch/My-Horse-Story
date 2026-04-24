import { NextResponse } from 'next/server';
import { fetchHorseProfile } from '@/lib/scraper/netkeiba';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetchHorseProfile('2019105216');
    return NextResponse.json({ ok: true, res });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
