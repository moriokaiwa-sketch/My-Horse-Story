'use client'

import { useState } from 'react'
import { addHorse } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AddHorseForm() {
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const result = await addHorse(formData)
    setLoading(false)
    
    // Clear the input value on success
    const inputElement = document.querySelector('input[name="netkeibaId"]') as HTMLInputElement;

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('推し馬を登録しました！')
      if (inputElement) inputElement.value = '';
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>推し馬を登録</CardTitle>
        <CardDescription>netkeibaのURLまたは馬のIDを入力してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <Input 
            name="netkeibaId" 
            placeholder="例: https://db.netkeiba.com/horse/2019105216/" 
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登録中...' : '登録する'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
