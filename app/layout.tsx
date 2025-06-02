import type { Metadata } from 'next'
import { TilesetProvider } from './components/TilesetProvider'
import { GameAssetsProvider } from './components/GameAssetsProvider'

export const metadata: Metadata = {
  title: 'Dungeon Game',
  description: 'An interactive dungeon exploration game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TilesetProvider imageUrl="/assets/images/tileset.png">
          <GameAssetsProvider mapUrl="/assets/maps/town.json">
            {children}
          </GameAssetsProvider>
        </TilesetProvider>
      </body>
    </html>
  )
}