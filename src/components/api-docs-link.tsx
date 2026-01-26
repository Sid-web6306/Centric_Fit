'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export function ApiDocsLink() {
  return (
    <Link href="/api/docs" target="_blank">
      <Button variant="outline" size="sm" className="gap-2">
        <BookOpen className="h-4 w-4" />
        API Docs
      </Button>
    </Link>
  )
}
