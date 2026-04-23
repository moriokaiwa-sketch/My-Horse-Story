import prisma from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home() {
  const events = await prisma.updateEvent.findMany({
    orderBy: { date: 'desc' },
    include: { horse: true },
    take: 50 // 直近50件
  })

  // 全登録馬のデータを取得し、次走予定を表示
  const horses = await prisma.horse.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-8 py-8">
      <header className="flex justify-between items-center py-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">🐴 My Horse Story</h1>
        <Link href="/horses" className="bg-zinc-900 border border-zinc-800 text-white shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors shrink-0">
          推し馬を管理
        </Link>
      </header>

      {/* 次走予定セクション */}
      {horses.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">🎯 次走予定</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {horses.map(horse => (
              <Card key={horse.id} className={`${horse.nextRace && horse.nextRace !== '未定' ? 'bg-blue-50 border-blue-200' : 'bg-zinc-50 border-zinc-200'} shadow-sm`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className={`text-base ${horse.nextRace && horse.nextRace !== '未定' ? 'text-blue-800' : 'text-zinc-700'}`}>
                    {horse.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className={`text-sm font-medium ${horse.nextRace && horse.nextRace !== '未定' ? 'text-blue-900' : 'text-zinc-600'}`}>
                    次走：{horse.nextRace || '未定'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* タイムラインセクション */}
      <h2 className="text-xl font-bold mb-4">📝 最近の更新・戦績</h2>
      <main className="space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed shadow-sm">
            <p className="text-zinc-500 mb-4">まだ情報がありません。</p>
            <Link href="/horses" className="text-sm font-medium text-blue-600 hover:underline">
              最初の推し馬を登録しましょう！
            </Link>
          </div>
        ) : (
          <div className="relative border-l-2 border-zinc-200 ml-4 space-y-8 pb-8">
            {events.map((event) => (
              <div key={event.id} className="relative pl-6">
                {/* タイムラインのドット */}
                <span className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-zinc-900 ring-4 ring-zinc-50" />
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {event.horse.name}
                        </span>
                        <CardTitle className="text-lg leading-tight">
                          <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                            {event.title}
                          </a>
                        </CardTitle>
                      </div>
                      <time className="text-xs font-medium text-zinc-500 shrink-0">
                        {new Date(event.date).toLocaleDateString('ja-JP')}
                      </time>
                    </div>
                  </CardHeader>
                  {event.summary && (
                    <CardContent>
                      <p className="text-zinc-600 text-sm leading-relaxed">{event.summary}</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
