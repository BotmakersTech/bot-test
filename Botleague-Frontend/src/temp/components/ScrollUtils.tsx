'use client'

import React, { useState, useEffect } from 'react'

/* ---------- Scroll Progress ---------- */

export const ScrollProgress: React.FC = () => {
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight

      // prevent divide-by-zero
      if (scrollHeight <= 0) {
        setWidth(0)
        return
      }

      const progress = (window.scrollY / scrollHeight) * 100
      setWidth(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 4,
        width: `${width}%`,
        background: 'linear-gradient(90deg, #FF4C4C, #ff7676)',
        zIndex: 10001,
        transition: 'width 0.1s ease',
      }}
    />
  )
}

/* ---------- Back To Top ---------- */

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        width: 50,
        height: 50,
        background: '#FF4C4C',
        color: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        boxShadow: '0 5px 20px rgba(255,76,76,0.4)',
      }}
    >
      ↑
    </div>
  )
}