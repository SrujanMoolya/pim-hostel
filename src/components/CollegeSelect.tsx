import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface Props {
  value?: string
  onChange?: (v: string) => void
}

export default function CollegeSelect({ value, onChange }: Props) {
  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colleges').select('*').order('name')
      if (error) throw error
      return data || []
    }
  })

  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder="Select college" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Select college</SelectItem>
        {colleges.map((c: any) => (
          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
