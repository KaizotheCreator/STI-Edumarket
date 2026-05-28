import React from 'react'
import { AppShell } from './AppChrome'

export default function MessagesScreen({
  user,
  activeRoute,
  navigate,
  logout,
  conversations,
  selectedConversation,
  messages,
  draft,
  setDraft,
  onSelectConversation,
  onSend,
  loadingMessage,
  statusMessage,
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
      <main className="app-page app-page--messages">
        <section className="messages-shell">
          <div className="messages-shell__header">
            <div>
              <p className="eyebrow">Messages</p>
              <h2>{selectedConversation ? selectedConversation.otherName : 'Inbox'}</h2>
              <p className="lead">
                {selectedConversation
                  ? selectedConversation.listingTitle
                  : 'Pick a conversation to continue chatting.'}
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

          <div className="messages-layout">
            <aside className="messages-inbox">
              <div className="messages-inbox__header">
                <span className="pill pill--blue">Conversations</span>
                <span className="messages-card__status">{conversations.length} total</span>
              </div>

              <div className="messages-inbox__list">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.key}
                      type="button"
                      className={`conversation-item ${
                        selectedConversation?.key === conversation.key ? 'conversation-item--active' : ''
                      }`}
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <strong>{conversation.otherName}</strong>
                      <span>{conversation.listingTitle}</span>
                      <p>{conversation.preview}</p>
                    </button>
                  ))
                ) : (
                  <div className="empty-state empty-state--thread">
                    <h3>No conversations yet</h3>
                    <p>Messages will appear here after someone chats about your listing.</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="messages-card">
              {selectedConversation ? (
                <>
                  <div className="messages-card__feed">
                    <div className="messages-card__feed-head">
                      <span className="pill pill--blue">Private thread</span>
                      <span className="messages-card__status">
                        {loadingMessage ? 'Loading messages...' : `${messages.length} messages`}
                      </span>
                    </div>

                    <div className="message-thread__items">
                      {messages.length > 0 ? (
                        messages.map((message) => {
                          const isMine = message.sender_id === user?.profileId
                          return (
                            <article
                              key={message.id}
                              className={`message-bubble ${isMine ? 'message-bubble--mine' : ''}`}
                            >
                              <span className="message-bubble__meta">
                                {isMine ? 'You' : selectedConversation.otherName}
                              </span>
                              <p>{message.body}</p>
                            </article>
                          )
                        })
                      ) : (
                        <div className="empty-state empty-state--thread">
                          <h3>No messages yet</h3>
                          <p>Start the conversation below.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="messages-card__composer">
                    <textarea
                      className="textarea"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                    />
                    {statusMessage ? <p className="section__note">{statusMessage}</p> : null}
                    <button
                      className="button button--primary"
                      onClick={onSend}
                      type="button"
                      disabled={loadingMessage}
                    >
                      Send Message
                    </button>
                  </div>
                </>
              ) : (
                <div className="messages-card__empty">
                  <div className="empty-state empty-state--thread">
                    <h3>Select a conversation</h3>
                    <p>Choose a chat from the inbox to read and reply.</p>
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
