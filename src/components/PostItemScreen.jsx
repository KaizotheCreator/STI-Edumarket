import React, { useEffect, useRef } from 'react'
import { categories, meetupLocations } from '../data'
import { Field } from './Field'
import { AppShell } from './AppChrome'

export default function PostItemScreen({
  user,
  activeRoute,
  navigate,
  logout,
  form,
  setForm,
  mediaFiles,
  setMediaFiles,
  handleSubmitListing,
  statusMessage,
  sidebarCards,
}) {
  const titleWordCount = countWords(form.title)
  const descriptionWordCount = countWords(form.description)
  const isGiveaway = form.type === 'Giveaway'
  const mediaInputRef = useRef(null)

  useEffect(() => {
    if (mediaFiles.length === 0 && mediaInputRef.current) {
      mediaInputRef.current.value = ''
    }
  }, [mediaFiles.length])

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
            <p className="eyebrow">Post Item</p>
            <h1>Publish a new listing</h1>
            <p className="lead">
              Add item details, set the price, and publish it directly to the marketplace.
            </p>
          </div>

          <div className="hero__panel">
            <div className="panel-card panel-card--profile">
              <span className="pill pill--yellow">Ready to post</span>
              <h2>Your listing will appear in the marketplace feed.</h2>
              <ul>
                <li>Use clear titles</li>
                <li>Set accurate pricing</li>
                <li>Write a helpful description</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="content">
          <section className="section">
            <div className="section__header">
              <div>
                <p className="eyebrow">Sell or Give Away</p>
                <h2>Post a new listing</h2>
              </div>
              <p className="section__note">{statusMessage}</p>
            </div>

            <form className="form form--single" onSubmit={handleSubmitListing}>
              <Field label="Title">
                <input
                  className="input"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: limitWords(event.target.value, 30) })
                  }
                  placeholder="Keep it under 30 words"
                />
                <span className="field__hint">{titleWordCount}/30 words</span>
              </Field>
              <Field label="Category">
                <select
                  className="input"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categories
                    .filter((item) => item !== 'All')
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Type">
                <select
                  className="input"
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value,
                      price: event.target.value === 'Giveaway' ? '0' : form.price,
                    })
                  }
                >
                  <option>Sell</option>
                  <option>Giveaway</option>
                </select>
              </Field>
              <Field label="Price">
                <div className="price-input">
                  <span className="price-input__prefix">PHP</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="999"
                    inputMode="numeric"
                    value={form.price}
                    disabled={isGiveaway}
                    onChange={(event) => {
                      const nextValue = event.target.value.replace(/\D/g, '')
                      if (nextValue === '') {
                        setForm({ ...form, price: '' })
                        return
                      }

                      setForm({ ...form, price: String(Math.min(999, Number(nextValue))) })
                    }}
                    placeholder="0 to 999"
                  />
                </div>
              </Field>
              <Field label="Meet-up Location">
                <select
                  className="input"
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                >
                  <option value="">Select a meet-up location</option>
                  {meetupLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Condition">
                <select
                  className="input"
                  value={form.condition}
                  onChange={(event) => setForm({ ...form, condition: event.target.value })}
                >
                  <option>New</option>
                  <option>Like new</option>
                  <option>Good</option>
                  <option>Used</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  className="input textarea"
                  rows={4}
                  value={form.description}
                  onChange={(event) => {
                    const nextWords = event.target.value.trim().split(/\s+/).filter(Boolean)
                    const limitedText =
                      nextWords.length <= 100
                        ? event.target.value
                        : nextWords.slice(0, 100).join(' ')

                    setForm({ ...form, description: limitedText })
                  }}
                  placeholder="Up to 100 words"
                />
                <span className="field__hint">{descriptionWordCount}/100 words</span>
              </Field>
              <Field label="Images or Videos">
                <input
                  ref={mediaInputRef}
                  className="input"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => setMediaFiles(Array.from(event.target.files || []))}
                />
                {mediaFiles.length > 0 ? (
                  <div className="selected-files">
                    <span className="field__hint">{mediaFiles.length} file(s) selected</span>
                    <ul>
                      {mediaFiles.map((file) => (
                        <li key={`${file.name}-${file.lastModified}`}>
                          {file.name}{' '}
                          <span>{file.type.startsWith('video/') ? 'Video' : 'Image'}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => setMediaFiles([])}
                    >
                      Clear media
                    </button>
                  </div>
                ) : (
                  <span className="field__hint">Optional. You can attach images or videos.</span>
                )}
              </Field>

              <button className="button button--yellow" type="submit">
                Publish Listing
              </button>
            </form>
          </section>
        </section>
      </main>
    </AppShell>
  )
}

function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0

  return trimmed.split(/\s+/).filter(Boolean).length
}

function limitWords(text, maxWords) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ')
}
