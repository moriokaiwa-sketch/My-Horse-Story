import prisma from '@/lib/db'
import { fetchHorseEvents, fetchHorseProfile } from '@/lib/scraper/netkeiba'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Force dynamic execution for API route
export const dynamic = 'force-dynamic'

export async function GET() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  let updatedCount = 0

  try {
    // 1時間以上更新されていない馬を取得 (タイムアウト防止のため最大3件ずつ)
    const horsesToUpdate = await prisma.horse.findMany({
      where: {
        updatedAt: {
          lt: oneHourAgo
        }
      },
      take: 3,
      orderBy: {
        updatedAt: 'asc'
      }
    })

    if (horsesToUpdate.length === 0) {
      return NextResponse.json({ success: true, message: 'No horses need syncing' })
    }

    for (const horse of horsesToUpdate) {
      try {
        // 次走情報などのプロフィールを更新
        const profile = await fetchHorseProfile(horse.netkeibaId)
        
        // updatedAt を確実に更新するため、強制的に現在時刻を入れる
        await prisma.horse.update({
          where: { id: horse.id },
          data: { 
            nextRace: profile?.nextRace || horse.nextRace,
            updatedAt: new Date() 
          }
        })

        // 新しい戦績イベントを取得して追加
        const events = await fetchHorseEvents(horse.netkeibaId, horse.id)
        for (const event of events) {
          const existing = await prisma.updateEvent.findFirst({
            where: {
              horseId: horse.id,
              title: event.title,
              date: event.date
            }
          })

          if (!existing) {
            await prisma.updateEvent.create({ data: event })
          }
        }
        
        updatedCount++
      } catch (e) {
        console.error(`Failed to sync horse ${horse.name}:`, e)
      }
    }

    if (updatedCount > 0) {
      // キャッシュを破棄して次回の画面アクセス時に最新データが表示されるようにする
      revalidatePath('/')
      revalidatePath('/horses')
    }

    return NextResponse.json({ success: true, updatedCount })
  } catch (error) {
    console.error('Sync process failed:', error)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
