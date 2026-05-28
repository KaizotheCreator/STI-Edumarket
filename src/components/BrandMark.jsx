import React from 'react'
import stiLogo from '../../sti_logo.png'

export default function BrandMark({ compact = false, showLabel = true, className = '' }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''} ${className}`.trim()}>
      <img className="brand-mark__logo" src={stiLogo} alt="STI College logo" />
      {showLabel ? (
        <div className="brand-mark__copy">
          <strong>EduMarket</strong>
          <span>STI SJDM Student Marketplace</span>
        </div>
      ) : null}
    </div>
  )
}
