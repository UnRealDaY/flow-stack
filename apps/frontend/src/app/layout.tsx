import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: { default: 'FlowStack', template: '%s | FlowStack' },
  description: 'The all-in-one workspace platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
