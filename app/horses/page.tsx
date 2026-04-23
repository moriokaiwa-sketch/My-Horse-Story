import prisma from '@/lib/db'
import AddHorseForm from '@/components/horse/AddHorseForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { DeleteHorseButton } from '@/components/horse/DeleteHorseButton'

export default async function HorsesPage() {
  const horses = await prisma.horse.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8 py-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">登録済みの推し馬</h1>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← タイムラインへ戻る
        </Link>
      </div>

      <AddHorseForm />

      <div className="grid gap-4 md:grid-cols-2 pt-4">
        {horses.map(horse => (
          <Card key={horse.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle>{horse.name}</CardTitle>
                  <CardDescription>ID: {horse.netkeibaId}</CardDescription>
                </div>
                <DeleteHorseButton id={horse.id} name={horse.name} />
              </div>
            </CardHeader>
            <CardContent>
              <a 
                href={horse.profileUrl || `https://db.netkeiba.com/horse/${horse.netkeibaId}/`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                netkeibaでプロフィールを見る ↗
              </a>
            </CardContent>
          </Card>
        ))}
        {horses.length === 0 && (
          <p className="text-zinc-500 col-span-2 text-center py-8">まだ登録されていません。</p>
        )}
      </div>
    </div>
  )
}
