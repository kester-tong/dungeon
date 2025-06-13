import type { Metadata } from 'next';
import { TilesetProvider } from './components/TilesetProvider';
import { ReduxProvider } from './store/Provider';

export const metadata: Metadata = {
  title: 'Pages of Thought',
  description: 'An open world RPG with LLM powered characters',
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
