const SUCCESS_PATTERNS = [
  'created',
  'successful',
  'signed out',
  'sent',
  'posted',
  'purchase started',
  'purchase confirmed',
  'acknowledged',
  'finalized',
  'deleted',
  'submitted',
  'saved',
  'review submitted',
  'message sent',
  'conversation deleted',
  'listing deleted',
  'transaction cancelled',
]

const ERROR_PATTERNS = ['failed', 'could not', 'unable', 'error', 'invalid']
const INFO_PATTERNS = ['loading', 'signing', 'creating', 'restoring', 'updating', 'deleting']

export function getMessageTone(message) {
  const text = String(message || '').toLowerCase()

  if (ERROR_PATTERNS.some((pattern) => text.includes(pattern))) return 'error'
  if (SUCCESS_PATTERNS.some((pattern) => text.includes(pattern))) return 'success'
  if (INFO_PATTERNS.some((pattern) => text.includes(pattern))) return 'info'
  return 'neutral'
}
