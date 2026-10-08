'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export const CORUJA_EXPRESSIONS = ['majime', 'warai', 'warai2', 'komaru', 'odoroki', 'fuman'] as const
export type CorujaExpression = (typeof CORUJA_EXPRESSIONS)[number]

const IDLE: Partial<Record<CorujaExpression, CorujaExpression>> = {
  majime: 'warai',
  warai: 'warai2',
  warai2: 'warai',
  komaru: 'majime',
  fuman: 'majime',
}

export function CorujaSprite({ expression, className }: { expression: CorujaExpression; className?: string }) {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    setIdle(false)
    if (!IDLE[expression] || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIdle((v) => !v), 2600)
    return () => window.clearInterval(id)
  }, [expression])

  const active = idle ? (IDLE[expression] ?? expression) : expression

  return (
    <div className={cn('relative', className)}>
      {CORUJA_EXPRESSIONS.map((name, i) => (
        <Image
          key={name}
          src={`/images/npc/coruja/${name}.webp`}
          alt=""
          width={361}
          height={543}
          priority={i < 2}
          className={cn(
            'absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300',
            name === active ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
    </div>
  )
}
