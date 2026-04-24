import prisma from '@/lib/db'
import { NextResponse } from 'next/server'
import { fetchHorseNews } from '@/lib/scraper/netkeiba'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const horses = await prisma.horse.findMany()
    const dbEvents = await prisma.updateEvent.findMany()
    let testNews: any[] = []
    try {
      testNews = await fetchHorseNews("イクイノックス", 1)
    } catch (e: any) {
      testNews = [{ error: e.message, stack: e.stack }]
    }
    return NextResponse.json({ ok: true, horses, dbEvents, testNews })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
