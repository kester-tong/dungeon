'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { setAccessKey } from './store/authSlice'
import { useAppSelector, useAppDispatch } from './store/hooks'
import Game from './components/Game'

function MainContent() {
  const searchParams = useSearchParams()
  const urlAccessKey = searchParams.get('access_key')
  const dispatch = useAppDispatch()
  const accessKey = useAppSelector(state => state.auth.accessKey)

  // Set access key from URL params into state
  useEffect(() => {
    if (urlAccessKey && urlAccessKey !== accessKey) {
      dispatch(setAccessKey(urlAccessKey))
    }
  }, [urlAccessKey, accessKey, dispatch])

  // Check password protection
  if (!accessKey) {
    return (
      <main style={{ padding: '1rem' }}>
        <div style={{ 
          border: '2px solid #333', 
          width: '800px', 
          height: '480px', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'monospace',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>Access Key Required</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Add ?access_key=YOUR_KEY to the URL
          </div>
        </div>
      </main>
    )
  }

  // Render the game once authenticated
  return <Game />
}

export default function Home() {
  return (
    <Suspense fallback={
      <main style={{ padding: '1rem' }}>
        <div style={{ 
          border: '2px solid #333', 
          width: '800px', 
          height: '480px', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'monospace'
        }}>
          <div>Loading...</div>
        </div>
      </main>
    }>
      <MainContent />
    </Suspense>
  )
}