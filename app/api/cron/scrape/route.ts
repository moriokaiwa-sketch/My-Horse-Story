import prisma from '@/lib/db'
import { fetchHorseEvents, fetchHorseProfile } from '@/lib/scraper/netkeiba'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Force dynamic execution for API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Simple auth for cron
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const horses = await prisma.horse.findMany()
  let totalNewEvents = 0

  for (const horse of horses) {
    try {
      // 次走情報の更新も一緒に行う
      const profile = await fetchHorseProfile(horse.netkeibaId)
      
      if (profile.nextRace !== horse.nextRace) {
        await prisma.horse.update({
          where: { id: horse.id },
          data: { nextRace: profile.nextRace }
        })

        // 新しい次走がセットされたら通知
        if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL && profile.nextRace && profile.nextRace !== '未定') {
          await resend.emails.send({
            from: 'My Horse Story <onboarding@resend.dev>',
            to: process.env.NOTIFICATION_EMAIL,
            subject: `【次走予定】${horse.name} - My Horse Story`,
            html: `
              <h2>🐴 ${horse.name} の次走予定が更新されました！</h2>
              <p>👉 <b>${profile.nextRace}</b></p>
              <br/>
              <p><a href="${profile.profileUrl || ''}">netkeibaで確認する</a></p>
            `
          }).catch(err => console.error("Email failed", err))
        }
      }

      const events = await fetchHorseEvents(horse.netkeibaId, horse.id)
      
      // Sequential check to correctly process inserts and avoid duplicates
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
          totalNewEvents++
          
          // Trigger Email if configured
          if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
            await resend.emails.send({
              from: 'My Horse Story <onboarding@resend.dev>',
              to: process.env.NOTIFICATION_EMAIL,
              subject: `【新着戦績】${horse.name} - My Horse Story`,
              html: `
                <h2>🐴 ${horse.name} の新着情報</h2>
                <p><b>${event.title}</b></p>
                <p>${event.summary || ''}</p>
                <br/>
                <p><a href="${event.sourceUrl}">netkeibaで確認する</a></p>
              `
            }).catch(err => console.error("Email failed", err))
          }
        }
      }
    } catch (e) {
      console.error(`Failed to update horse ${horse.name}:`, e)
    }
  }

  return NextResponse.json({ success: true, newEventsCount: totalNewEvents })
}
