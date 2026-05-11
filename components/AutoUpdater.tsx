'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoUpdater() {
  const router = useRouter()

  useEffect(() => {
    // 画面が開かれたタイミングで裏側で同期APIを叩く（フォールバック用）
    // Cronジョブが主要な同期手段だが、万が一漏れがあった場合のバックアップ
    fetch('/api/sync')
      .then(res => res.json())
      .then(data => {
        // 更新があった場合は画面をリフレッシュして最新データを表示
        if (data.updatedCount && data.updatedCount > 0) {
          router.refresh()
        }
      })
      .catch((err) => {
        console.error('Auto sync failed:', err)
      })
  }, [router])

  return null // 何も表示しない
}
