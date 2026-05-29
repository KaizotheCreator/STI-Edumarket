import React from 'react'

export default function RatingStars({ rating = 0, max = 5 }) {
  const value = Number(rating) || 0

  return (
    <span className="rating-stars" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < value
        return (
          <svg
            key={index}
            className={`rating-star ${filled ? 'rating-star--filled' : ''}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2.25l2.906 5.892 6.504.945-4.705 4.586 1.111 6.476L12 17.99l-5.816 3.159 1.111-6.476L2.59 9.087l6.504-.945L12 2.25z" />
          </svg>
        )
      })}
    </span>
  )
}
