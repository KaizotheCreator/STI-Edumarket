import React from 'react'
import { AppShell } from './AppChrome'

export default function TransactionsScreen({
  user,
  activeRoute,
  navigate,
  logout,
  transactions,
  selectedTransaction,
  onSelectTransaction,
  onBuyTransaction,
  onAcknowledgeTransaction,
  onFinalizeTransaction,
  onCancelTransaction,
  reviewForm,
  setReviewForm,
  onSubmitReview,
  onDeleteListing,
  statusMessage,
  sidebarCards,
}) {
  const activeRole = selectedTransaction
    ? selectedTransaction.buyerId === user?.profileId
      ? 'buyer'
      : 'seller'
    : null
  const buyerAcknowledged = Boolean(selectedTransaction?.buyerAcknowledged)
  const sellerAcknowledged = Boolean(selectedTransaction?.sellerAcknowledged)

  return (
    <AppShell
      user={user}
      activeRoute={activeRoute}
      navigate={navigate}
      logout={logout}
      sidebarCards={sidebarCards}
    >
      <main className="app-page app-page--messages">
        <section className="messages-shell transactions-shell">
          <div className="messages-shell__header">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>{selectedTransaction ? selectedTransaction.listing?.title || 'Item deal' : 'Transactions'}</h2>
              <p className="lead">
                Track a buyer's purchase, confirm both acknowledgements, and finalize the sale.
              </p>
            </div>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => navigate('/marketplace')}
            >
              Back to Marketplace
            </button>
          </div>

          <div className="messages-layout transactions-layout">
            <aside className="messages-inbox transactions-inbox">
              <div className="messages-inbox__header">
                <span className="pill pill--yellow">Transactions</span>
                <span className="messages-card__status">{transactions.length} total</span>
              </div>

              <div className="messages-inbox__list">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => {
                    const isBuyer = transaction.buyerId === user?.profileId
                    const roleLabel = isBuyer ? 'Buyer' : 'Seller'
                    const counterpart = isBuyer
                      ? transaction.seller?.full_name || 'Seller'
                      : transaction.buyer?.full_name || 'Buyer'

                    return (
                      <button
                        key={transaction.id}
                        type="button"
                        className={`conversation-item transaction-item ${
                          selectedTransaction?.id === transaction.id
                            ? 'conversation-item--active'
                            : ''
                        }`}
                        onClick={() => onSelectTransaction(transaction)}
                      >
                        <strong>{transaction.listing?.title || 'Listing'}</strong>
                        <span>{roleLabel}: {counterpart}</span>
                        <p>{statusLabel(transaction.status)}</p>
                      </button>
                    )
                  })
                ) : (
                  <div className="empty-state empty-state--thread">
                    <h3>No transactions yet</h3>
                    <p>Start one from a marketplace listing.</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="messages-card transactions-card">
              {selectedTransaction ? (
                <div className="transactions-card__body">
                  <div className="messages-card__feed-head">
                    <span className={`pill ${statusPillClass(selectedTransaction.status)}`}>
                      {statusLabel(selectedTransaction.status)}
                    </span>
                    <div className="messages-card__feed-actions">
                      <span className="messages-card__status">
                        {activeRole === 'buyer' ? 'Buyer view' : 'Seller view'}
                      </span>
                    </div>
                  </div>

                  <h2 className="transactions-card__title">
                    {selectedTransaction.listing?.title || 'Listing'}
                  </h2>
                  <p className="lead">
                    {selectedTransaction.listing?.description ||
                      'This transaction will track the final sale and listing cleanup.'}
                  </p>

                  {selectedTransaction.listing?.media?.length ? (
                    <div className="listing-media listing-media--compact">
                      {selectedTransaction.listing.media.map((media) => (
                        <div className="listing-media__item" key={media.id || media.publicUrl}>
                          {media.mediaType === 'video' ? (
                            <video src={media.publicUrl} controls />
                          ) : (
                            <img
                              src={media.publicUrl}
                              alt={media.originalName || selectedTransaction.listing?.title || 'Listing'}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="detail__grid">
                    <Detail
                      label="Buyer"
                      value={selectedTransaction.buyer?.full_name || 'Student'}
                    />
                    <Detail
                      label="Seller"
                      value={selectedTransaction.seller?.full_name || 'Student'}
                    />
                    <Detail
                      label="Agreed price"
                      value={`PHP ${Number(selectedTransaction.agreedPrice || 0)}`}
                    />
                    <Detail label="Status" value={statusLabel(selectedTransaction.status)} />
                    <Detail
                      label="Meet-up location"
                      value={selectedTransaction.listing?.location || 'TBD'}
                    />
                    <Detail
                      label="Condition"
                      value={selectedTransaction.listing?.condition || 'TBD'}
                    />
                    <Detail
                      label="Buyer ack"
                      value={buyerAcknowledged ? 'Acknowledged' : 'Waiting'}
                    />
                    <Detail
                      label="Seller ack"
                      value={sellerAcknowledged ? 'Acknowledged' : 'Waiting'}
                    />
                  </div>

                  {statusMessage ? <p className="section__note">{statusMessage}</p> : null}

                  <div className="transaction-actions">
                    {selectedTransaction.status === 'pending' && activeRole === 'buyer' ? (
                      <>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => onBuyTransaction(selectedTransaction)}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => onCancelTransaction(selectedTransaction)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {selectedTransaction.status === 'pending' && activeRole === 'seller' ? (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => onCancelTransaction(selectedTransaction)}
                      >
                        Cancel
                      </button>
                    ) : null}

                    {selectedTransaction.status === 'ongoing' && activeRole === 'buyer' ? (
                      buyerAcknowledged ? (
                        <span className="section__note">Acknowledged. Waiting for the seller.</span>
                      ) : (
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => onAcknowledgeTransaction(selectedTransaction)}
                        >
                          Acknowledge
                        </button>
                      )
                    ) : null}

                    {selectedTransaction.status === 'ongoing' && activeRole === 'seller' ? (
                      <>
                        {sellerAcknowledged ? (
                          <span className="section__note">Acknowledged. Waiting for the buyer.</span>
                        ) : (
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => onAcknowledgeTransaction(selectedTransaction)}
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => onCancelTransaction(selectedTransaction)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {selectedTransaction.status === 'finalizing' && activeRole === 'seller' ? (
                      <>
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => onFinalizeTransaction(selectedTransaction)}
                          disabled={!buyerAcknowledged || !sellerAcknowledged}
                        >
                          Finalize
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => onCancelTransaction(selectedTransaction)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {selectedTransaction.status === 'finalizing' && activeRole === 'buyer' ? (
                      <span className="section__note">
                        Both sides acknowledged. Waiting for the seller to finalize the sale.
                      </span>
                    ) : null}

                    {selectedTransaction.status === 'completed' && activeRole === 'seller' ? (
                      <button
                        type="button"
                        className="button button--yellow"
                        onClick={() => onDeleteListing(selectedTransaction.listing)}
                      >
                        Delete post
                      </button>
                    ) : null}

                    {selectedTransaction.status === 'completed' && activeRole === 'buyer' ? (
                      <div className="review-module">
                        {selectedTransaction.review ? (
                          <div className="empty-state empty-state--thread">
                            <h3>Review submitted</h3>
                            <p>
                              {selectedTransaction.review.rating}/5 stars
                              {selectedTransaction.review.body
                                ? ` - ${selectedTransaction.review.body}`
                                : ''}
                            </p>
                          </div>
                        ) : (
                          <div className="review-module__form">
                            <div className="review-module__header">
                              <h3>Leave a review</h3>
                              <p>Rate the transaction and share a quick note for the seller.</p>
                            </div>

                            <label className="input-group">
                              <span>Rating</span>
                              <select
                                className="input"
                                value={reviewForm?.rating ?? 5}
                                onChange={(event) =>
                                  setReviewForm((current) => ({
                                    ...current,
                                    rating: Number(event.target.value),
                                  }))
                                }
                              >
                                <option value="5">5 stars</option>
                                <option value="4">4 stars</option>
                                <option value="3">3 stars</option>
                                <option value="2">2 stars</option>
                                <option value="1">1 star</option>
                              </select>
                            </label>

                            <label className="input-group">
                              <span>Text review</span>
                              <textarea
                                className="textarea"
                                rows={4}
                                value={reviewForm?.body ?? ''}
                                onChange={(event) =>
                                  setReviewForm((current) => ({
                                    ...current,
                                    body: event.target.value,
                                  }))
                                }
                                placeholder="Tell the seller what went well or what could improve."
                              />
                            </label>

                            <button
                              type="button"
                              className="button button--primary"
                              onClick={() => onSubmitReview(selectedTransaction)}
                            >
                              Submit Review
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="messages-card__empty">
                  <div className="empty-state empty-state--thread">
                    <h3>Select a transaction</h3>
                    <p>Choose an item deal from the list to manage the sale.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
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

function statusLabel(status) {
  switch (status) {
    case 'ongoing':
      return 'Ongoing process'
    case 'finalizing':
      return 'Ready to finalize'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Awaiting buy'
  }
}

function statusPillClass(status) {
  switch (status) {
    case 'ongoing':
      return 'pill--yellow'
    case 'finalizing':
      return 'pill--blue'
    case 'completed':
      return 'pill--yellow'
    case 'cancelled':
      return 'pill--gray'
    default:
      return 'pill--yellow'
  }
}
