import React from 'react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="confirm-modal" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Confirmation</p>
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message" className="lead">
          {message}
        </p>
        <div className="confirm-modal__actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="button button--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
