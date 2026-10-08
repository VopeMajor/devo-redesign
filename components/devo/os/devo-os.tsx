'use client'

import { useMemo, useState } from 'react'
import type { AppId } from '@/lib/devo/types'
import { useMediaQuery } from '../hooks'
import { DesktopShell, DesktopWindowsContext, useDesktopWindows } from './desktop-shell'
import { OsNavContext, type OsNav } from './os-nav'
import { PhoneShell } from './phone-shell'
import { useDevoEngine } from './use-devo-engine'

/** Mesmo sistema, duas apresentações: área de trabalho (≥1024px) ou smartphone. */
export function DevoOS({ onExit, onRestart }: { onExit: () => void; onRestart: () => void }) {
  useDevoEngine()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const windows = useDesktopWindows()
  const [phoneApp, setPhoneApp] = useState<AppId | null>(null)

  const nav = useMemo<OsNav>(
    () => ({
      layout: isDesktop ? 'desktop' : 'phone',
      open: (id) => (isDesktop ? windows.open(id) : setPhoneApp(id)),
      exitToLanding: onExit,
      restart: onRestart,
    }),
    [isDesktop, windows.open, onExit, onRestart], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <OsNavContext.Provider value={nav}>
      <DesktopWindowsContext.Provider value={windows}>
        {isDesktop ? <DesktopShell /> : <PhoneShell current={phoneApp} onOpen={setPhoneApp} onHome={() => setPhoneApp(null)} />}
      </DesktopWindowsContext.Provider>
    </OsNavContext.Provider>
  )
}
