/**
 * Interior do DEVO (estética do Record). Tudo aqui lê os tokens --in-* e precisa de um ancestral
 * com `.dv-interior` (use `PaperSheet`) — dentro de `RecordPanel`/`BottomNav` os tokens invertem.
 * Guia: docs/redesign/IDENTIDADE.md › Interior.
 */
export { BottomNav, type BottomNavItem } from './bottom-nav'
export { CobaltTabs } from './cobalt-tabs'
export { DuotoneArt, type DuotoneTone } from './duotone'
export { GradeBar } from './grade'
export { Barcode, HudCode, HudCross, HudRule, hudCode } from './hud'
export * from './icons'
export { FUTURE_SYSTEMS, LockedFeature, LockedNode, type FutureSystemId } from './locked'
export { PanelLink, PaperSheet, RecordPanel, RecordTitle, type PanelAction, type RecordPanelVariant } from './panel'
export { TimelineList, type TimelineItem, type TimelineTone } from './timeline'
