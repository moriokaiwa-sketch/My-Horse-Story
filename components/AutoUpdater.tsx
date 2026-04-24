'use client'

import { useEffect } from 'react'

export function AutoUpdater() {
  useEffect(() => {
    // 画面が開かれたタイミングで裏側で同期APIを叩く
    // 1時間以上更新されていない馬のデータのみ更新され、
    // 更新があった場合は revalidatePath によって次回の画面読み込み時に反映される
    fetch('/api/sync').catch((err) => {
      console.error('Auto sync failed:', err)
    })
  }, [])

  return null // 何も表示しない
}
