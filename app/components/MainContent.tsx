'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAccessKey } from '../store/authSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useTileset } from './TilesetProvider';
import Game from './Game';
import styles from './MainContent.module.css';

export default function MainContent() {
  const searchParams = useSearchParams();
  const urlAccessKey = searchParams.get('access_key');
  const dispatch = useAppDispatch();
  const accessKey = useAppSelector((state) => state.auth.accessKey);
  const { tileset, loaded } = useTileset();

  useEffect(() => {
    if (urlAccessKey && urlAccessKey !== accessKey) {
      dispatch(setAccessKey(urlAccessKey));
    }
  }, [urlAccessKey, accessKey, dispatch]);

  if (!accessKey) {
    return (
      <main className={styles.container}>
        <div className={styles.gameWindow}>
          <div>Access Key Required</div>
          <div className={styles.instructions}>
            Add ?access_key=YOUR_KEY to the URL
          </div>
        </div>
      </main>
    );
  }

  if (!loaded || !tileset) {
    return (
      <main className={styles.container}>
        <div className={styles.gameWindow}>
          <div>Loading...</div>
        </div>
        <div className={styles.credits}>
          Tiles (32x32 graphics) by David Gervais, used under{' '}
          <a
            href="https://creativecommons.org/licenses/by/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            CC BY 3.0
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <Game />
      <div className={styles.credits}>
        Tiles (32x32 graphics) by David Gervais, used under{' '}
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          CC BY 3.0
        </a>
      </div>
    </>
  );
}
