'use client';

import { Suspense } from 'react';
import MainContent from './components/MainContent';
import styles from './components/MainContent.module.css';

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className={styles.container}>
          <div className={styles.gameWindow}>
            <div>Loading...</div>
          </div>
        </main>
      }
    >
      <MainContent />
    </Suspense>
  );
}

