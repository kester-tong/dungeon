import type { Metadata } from 'next';
import { TilesetProvider } from './components/TilesetProvider';
import { ReduxProvider } from './store/Provider';

export const metadata: Metadata = {
  title: 'Dungeon Game',
  description: 'An interactive dungeon exploration game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <TilesetProvider>{children}</TilesetProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
