import React from 'react'

export function Field({ label, children, error }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

export function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
  error,
  placeholder,
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="password-row">
        <input
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button type="button" className="password-toggle" onClick={onToggle}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}
