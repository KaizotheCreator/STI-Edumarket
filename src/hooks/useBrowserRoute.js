import { useEffect, useState } from 'react'

const authRoutes = new Set(['/login', '/signup'])
const protectedRoutes = new Set(['/marketplace', '/profile', '/post-item', '/messages'])

export function normalizeRoute(pathname) {
  if (!pathname || pathname === '/') return '/login'
  if (authRoutes.has(pathname) || protectedRoutes.has(pathname)) return pathname
  return '/login'
}

export function useBrowserRoute(initialAuthenticated = false) {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setRoute(normalizeRoute(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextRoute) {
    const normalized = normalizeRoute(nextRoute)
    window.history.pushState({}, '', normalized)
    setRoute(normalized)
  }

  const visibleRoute = initialAuthenticated && authRoutes.has(route) ? '/marketplace' : route

  return {
    navigate,
    route,
    visibleRoute,
  }
}
