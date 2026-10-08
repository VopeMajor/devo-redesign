import Image from 'next/image'

export function JavaliHost() {
  return (
    <div className="javali-dance relative z-10 mb-3 h-36 origin-bottom md:h-44" style={{ aspectRatio: '1000 / 444' }}>
      <Image
        src="/images/npc/javali.webp"
        alt="Javali, anfitrião da Sala de Jogos, debruçado sobre a mesa"
        width={1000}
        height={444}
        priority
        className="h-full w-full object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
      />
    </div>
  )
}
