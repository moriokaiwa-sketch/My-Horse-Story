'use client'

import { useState } from 'react'
import { deleteHorse } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function DeleteHorseButton({ id, name }: { id: string, name: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`本当に「${name}」をタイムラインから削除しますか？\n（関連するイベントデータもすべて削除されます）`)) return;
    
    setLoading(true)
    const result = await deleteHorse(id)
    setLoading(false)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${name}を削除しました。`)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete} 
      disabled={loading}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
    >
      <Trash2 className="w-4 h-4 mr-1" />
      削除
    </Button>
  )
}
