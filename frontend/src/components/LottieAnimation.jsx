/**
 * LottieAnimation.jsx
 * A safe wrapper that fetches a Lottie JSON from a URL and renders it.
 * Falls back to a simple CSS spinner if the fetch fails.
 */
import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function LottieAnimation({ src, loop = true, style = {}, fallback = null }) {
  const [animData, setAnimData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(data => { if (!cancelled) setAnimData(data) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [src])

  if (failed) return fallback || <div style={{ width: 80, height: 80, ...style }} />
  if (!animData) return <div style={{ width: 80, height: 80, ...style }} />
  return <Lottie animationData={animData} loop={loop} style={style} />
}
