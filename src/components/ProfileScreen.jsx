import React from 'react'
import { preferredItemOptions } from '../data'
import { AppShell } from './AppChrome'

export default function ProfileScreen({
  user,
  activeRoute,
  navigate,
  logout,
  ownedListings,
  sidebarCards,
}) {
  return (
    <AppShell
      user={user}
      activeRoute={activeRoute}
      navigate={navigate}
      logout={logout}
      sidebarCards={sidebarCards}
    >
      <main className="app-page">
        <header className="hero hero--compact hero--split">
          <div className="hero__copy">
            <p className="eyebrow">Profile</p>
            <h1>Your EduMarket account</h1>
            <p className="lead">
              See the interests you saved and the items you have posted to the marketplace.
            </p>
          </div>

          <div className="hero__panel">
            <div className="panel-card panel-card--profile">
              <span className="pill pill--blue">Verified student profile</span>
              <h2>{user?.fullName}</h2>
              <ul>
                <li>Student No: {user?.studentNumber}</li>
                <li>Section: {user?.section}</li>
                <li>Birthday: {user?.birthday}</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="content">
          <section className="section">
            <div className="section__header">
              <div>
                <p className="eyebrow">Preferred Items</p>
                <h2>Your saved interests</h2>
              </div>
            </div>
            <div className="preferred-grid preferred-grid--profile">
              {preferredItemOptions.map((item) => (
                <div
                  key={item}
                  className={`preferred-option preferred-option--readonly ${
                    user?.preferredItems?.includes(item) ? 'preferred-option--selected' : ''
                  }`}
                >
                  <span>{item}</span>
                  <strong>{user?.preferredItems?.includes(item) ? 'Selected' : 'Not selected'}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section__header">
              <div>
                <p className="eyebrow">My Posts</p>
                <h2>Your listings</h2>
              </div>
            </div>

            {ownedListings.length > 0 ? (
              <div className="grid">
                {ownedListings.map((listing) => (
                  <article className="card card--profile-post" key={listing.id}>
                    {listing.media?.[0] ? (
                      <div className="card__media">
                        {listing.media[0].mediaType === 'video' ? (
                          <video src={listing.media[0].publicUrl} muted />
                        ) : (
                          <img src={listing.media[0].publicUrl} alt={listing.title} />
                        )}
                      </div>
                    ) : null}

                    <div className="card__top">
                      <span className={`pill ${listing.free ? 'pill--yellow' : 'pill--blue'}`}>
                        {listing.free ? 'Free' : `PHP ${listing.price}`}
                      </span>
                    </div>

                    <h3>{listing.title}</h3>
                    <p>{listing.description}</p>

                    <div className="meta">
                      <span>Category: {listing.category}</span>
                      <span>Meet-up: {listing.location}</span>
                      <span>Condition: {listing.condition}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No posts yet</h3>
                <p>Your listings will appear here once you publish them.</p>
                <button type="button" className="button button--primary" onClick={() => navigate('/post-item')}>
                  Create a Listing
                </button>
              </div>
            )}
          </section>
        </section>
      </main>
    </AppShell>
  )
}
