import React from 'react'
import { categories } from '../data'
import { AppShell } from './AppChrome'

export default function MarketplaceScreen({
  user,
  activeRoute,
  search,
  setSearch,
  category,
  setCategory,
  showFreeOnly,
  setShowFreeOnly,
  visibleListings,
  paginatedVisibleListings,
  selectedListing,
  setSelectedListing,
  currentPage,
  totalPages,
  onPageChange,
  favorites,
  toggleFavorite,
  messageDraft,
  setMessageDraft,
  sendMessage,
  onStartTransaction,
  onOpenTransactions,
  navigate,
  logout,
  sidebarCards,
}) {
  const preferredItems = user?.preferredItems || []

  return (
    <AppShell
      user={user}
      activeRoute={activeRoute}
      navigate={navigate}
      logout={logout}
      sidebarCards={sidebarCards}
    >
      <main className="app-page">
        <header className="hero hero--marketplace hero--split">
          <div className="hero__copy">
            <p className="eyebrow">Marketplace</p>
            <h1>Buy, sell, and give away school essentials.</h1>
            <p className="lead">
              Browse secondhand books, uniforms, and supplies from verified STI students in one
              organized space.
            </p>
          </div>

          <div className="hero__panel">
            <div className="panel-card panel-card--profile">
              <span className="pill pill--yellow">Verified accounts</span>
              <h2>Built for campus trust and convenience</h2>
              <ul>
                <li>School-only marketplace</li>
                <li>Private messaging</li>
                <li>Campus meet-up suggestions</li>
                <li>Free listings stay in their regular category</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="content">
          <section className="section" id="marketplace">
            <div className="section__header">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2>Find the right item fast</h2>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showFreeOnly}
                  onChange={(event) => setShowFreeOnly(event.target.checked)}
                />
                <span>Free listings only</span>
              </label>
            </div>

            <div className="controls">
              <input
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search books, uniforms, supplies..."
              />

              <div className="chips">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={`chip ${category === item ? 'chip--active' : ''} ${
                      preferredItems.includes(item) ? 'chip--preferred' : ''
                    }`}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {visibleListings.length > 0 ? (
              <>
                <div className="grid grid--stacked">
                  {paginatedVisibleListings.map((listing) => {
                    const isOwnListing = listing.owner_id === user?.profileId
                    const isLockedListing = ['pending', 'ongoing', 'finalizing'].includes(
                      listing.transactionStatus,
                    )
                    const isParticipant =
                      listing.activeBuyerId === user?.profileId ||
                      listing.activeSellerId === user?.profileId

                    return (
                      <article
                        className={`card card--horizontal ${
                          selectedListing?.id === listing.id ? 'card--selected' : ''
                        } ${preferredItems.includes(listing.category) ? 'card--preferred' : ''} ${
                          isOwnListing ? 'card--owned' : ''
                        }`}
                        key={listing.id}
                        onClick={() => setSelectedListing(listing)}
                      >
                        <div className="card__body">
                          <div className="card__top">
                            <span className={`pill ${listing.free ? 'pill--yellow' : 'pill--blue'}`}>
                              {listing.free ? 'Free' : `PHP ${listing.price}`}
                            </span>
                            {preferredItems.includes(listing.category) ? (
                              <span className="pill pill--yellow card__badge">Recommended</span>
                            ) : null}
                            {isLockedListing && isParticipant ? (
                              <span className="pill pill--yellow card__badge">Ongoing process</span>
                            ) : null}
                            {isOwnListing ? (
                              <span className="pill pill--blue card__badge">Your post</span>
                            ) : null}
                          </div>

                          <h3>{listing.title}</h3>
                          <p>{listing.description}</p>

                          <div className="meta">
                            <span>Category: {listing.category}</span>
                            <span>{listing.condition}</span>
                            <span>Meet-up location: {listing.location}</span>
                          </div>
                        </div>

                        <div className="card__side">
                          {!isOwnListing ? (
                            <button
                              className="icon-button"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleFavorite(listing.id)
                              }}
                              type="button"
                              aria-label="Toggle favorite"
                            >
                              {favorites.includes(listing.id) ? 'Saved' : 'Save'}
                            </button>
                          ) : null}

                          {isLockedListing && isParticipant ? (
                            <span className="pill pill--yellow card__badge card__badge--owned">
                              Ongoing
                            </span>
                          ) : null}

                          {listing.media?.[0] ? (
                            <div className="card__media">
                              {listing.media[0].mediaType === 'video' ? (
                                <video src={listing.media[0].publicUrl} muted />
                              ) : (
                                <img src={listing.media[0].publicUrl} alt="" />
                              )}
                            </div>
                          ) : (
                            <div className="card__media card__media--empty" />
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="pagination" aria-label="Marketplace pagination">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </button>
                  <span className="pagination__label">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No listings yet</h3>
                <p>Be the first student to post a marketplace listing.</p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => navigate('/post-item')}
                >
                  Post a Listing
                </button>
              </div>
            )}
          </section>

          <section className="detail section">
            <div className="detail__box">
              <p className="eyebrow">Item Details</p>
              {selectedListing ? (
                <>
                  <h2>{selectedListing.title}</h2>
                  <p className="lead">{selectedListing.description}</p>

                  {selectedListing.media?.length ? (
                    <div className="listing-media">
                      {selectedListing.media.map((media) => (
                        <div className="listing-media__item" key={media.id || media.publicUrl}>
                          {media.mediaType === 'video' ? (
                            <video src={media.publicUrl} controls />
                          ) : (
                            <img
                              src={media.publicUrl}
                              alt={media.originalName || selectedListing.title}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="detail__grid">
                    <Detail label="Seller" value={selectedListing.seller} />
                    <Detail label="Category" value={selectedListing.category} />
                    <Detail label="Condition" value={selectedListing.condition} />
                    <Detail label="Meet-up location" value={selectedListing.location} />
                    <Detail
                      label="Price"
                      value={selectedListing.free ? 'Free' : `PHP ${selectedListing.price}`}
                    />
                    <Detail label="Type" value={selectedListing.type} />
                  </div>

                  {selectedListing.owner_id === user?.profileId ? (
                    <div className="empty-state empty-state--detail">
                      <h3>Read-only listing</h3>
                      <p>You can view it, but you cannot save, message, or buy your own post.</p>
                    </div>
                  ) : selectedListing.transactionStatus === 'available' ? (
                    <div className="message-box">
                      <textarea
                        className="textarea"
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        placeholder="Write a message to the seller..."
                        rows={4}
                      />
                      <div className="transaction-actions">
                        <button className="button button--primary" onClick={sendMessage} type="button">
                          Send Message
                        </button>
                        <button
                          className="button button--ghost"
                          onClick={() => onStartTransaction(selectedListing)}
                          type="button"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state empty-state--detail">
                      <h3>Ongoing process</h3>
                      <p>
                        This listing is locked by an active transaction. Open your transactions
                        module to continue the deal.
                      </p>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={onOpenTransactions}
                      >
                        Open Transactions
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state empty-state--detail">
                  <h3>Select a listing</h3>
                  <p>Pick a card on the left to view more details.</p>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  )
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
