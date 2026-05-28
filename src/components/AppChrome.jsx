import React from 'react'
import BrandMark from './BrandMark'

export function AppShell({
  user,
  activeRoute,
  navigate,
  logout,
  sidebarCards,
  children,
}) {
  return (
    <div className="app-shell app-shell--protected">
      <AppSidebar
        user={user}
        activeRoute={activeRoute}
        navigate={navigate}
        logout={logout}
        sidebarCards={sidebarCards}
      />
      <div className="app-shell__content">
        {children}
      </div>
    </div>
  )
}

export function AppSidebar({
  user,
  activeRoute,
  navigate,
  logout,
  sidebarCards = [],
}) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <BrandMark className="brand-mark--compact" />
      </div>

      <div className="app-sidebar__profile">
        <span className="user-chip user-chip--compact">
          <strong>{user?.fullName || 'Student'}</strong>
          <span>{user?.section || 'Verified account'}</span>
        </span>
      </div>

      <nav className="app-sidebar__nav" aria-label="Primary navigation">
        <button
          type="button"
          className={`nav-pill ${activeRoute === '/marketplace' ? 'nav-pill--active' : ''}`}
          onClick={() => navigate('/marketplace')}
        >
          Marketplace
        </button>
        <button
          type="button"
          className={`nav-pill ${activeRoute === '/post-item' ? 'nav-pill--active' : ''}`}
          onClick={() => navigate('/post-item')}
        >
          Post Item
        </button>
        <button
          type="button"
          className={`nav-pill ${activeRoute === '/profile' ? 'nav-pill--active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          Profile
        </button>
        <button
          type="button"
          className={`nav-pill ${activeRoute === '/messages' ? 'nav-pill--active' : ''}`}
          onClick={() => navigate('/messages')}
        >
          Messages
        </button>
        <button
          type="button"
          className={`nav-pill ${activeRoute === '/transactions' ? 'nav-pill--active' : ''}`}
          onClick={() => navigate('/transactions')}
        >
          Transactions
        </button>
        <button type="button" className="nav-pill nav-pill--logout" onClick={logout}>
          Logout
        </button>
      </nav>

      {sidebarCards.length > 0 ? (
        <div className="app-sidebar__cards">
          {sidebarCards.map((card) => (
            <div key={card.label} className="stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  )
}
