'use client'

import { useEffect } from 'react'

interface InputControllerProps {
  onKeyDown: (key: string) => void
}

export default function InputController({ onKeyDown }: InputControllerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKeyDown])

  // This component doesn't render anything visible
  return null
}