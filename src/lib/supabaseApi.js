const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ''
).replace(/\/$/, '')
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  ''
const LISTING_MEDIA_BUCKET = 'listing-media'

function ensureConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables.')
  }
}

function buildEmail(studentNumber) {
  return `${studentNumber}@edumarket.app`
}

function normalizeSessionShape(session) {
  if (!session || typeof session !== 'object') return null

  return {
    ...session,
    access_token: session.access_token || session.accessToken || '',
    accessToken: session.accessToken || session.access_token || '',
    refresh_token: session.refresh_token || session.refreshToken || '',
    refreshToken: session.refreshToken || session.refresh_token || '',
  }
}

function normalizeSession(data) {
  if (!data || typeof data !== 'object') return null

  if (data.session) return normalizeSessionShape(data.session)

  if (data.access_token && data.refresh_token) {
    return normalizeSessionShape({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      token_type: data.token_type,
      user: data.user,
    })
  }

  return null
}

async function request(path, { method = 'GET', token, body } = {}) {
  ensureConfigured()

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message =
      (typeof data === 'string' ? data : data?.error_description) ||
      data?.msg ||
      data?.message ||
      data?.hint ||
      response.statusText ||
      'Supabase request failed'
    throw new Error(`${message} (HTTP ${response.status})`)
  }

  return data
}

function sanitizeFileName(name) {
  const fallback = 'media-file'
  const safeName = (name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return safeName || fallback
}

function encodeStoragePath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildPublicStorageUrl(bucket, path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`
}

async function uploadStorageObject(token, bucket, path, file) {
  ensureConfigured()

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    },
  )

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message =
      (typeof data === 'string' ? data : data?.error_description) ||
      data?.msg ||
      data?.message ||
      response.statusText ||
      'Storage upload failed'
    throw new Error(message)
  }

  return data
}

export function createSavedSession(session, profile) {
  return {
    access_token: session.access_token,
    accessToken: session.access_token,
    refresh_token: session.refresh_token,
    refreshToken: session.refresh_token,
    user: session.user,
    profile,
  }
}

export function getSessionFromStorage() {
  try {
    const saved = window.localStorage.getItem('edumarket-session')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  window.localStorage.setItem('edumarket-session', JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem('edumarket-session')
}

export function savePendingProfile(profile) {
  window.localStorage.setItem('edumarket-pending-profile', JSON.stringify(profile))
}

export function getPendingProfile() {
  try {
    const saved = window.localStorage.getItem('edumarket-pending-profile')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function clearPendingProfile() {
  window.localStorage.removeItem('edumarket-pending-profile')
}

export function saveConversation(conversation) {
  window.localStorage.setItem('edumarket-conversation', JSON.stringify(conversation))
}

export function getConversation() {
  try {
    const saved = window.localStorage.getItem('edumarket-conversation')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function clearConversation() {
  window.localStorage.removeItem('edumarket-conversation')
}

export async function signUpStudent({
  studentNumber,
  password,
  fullName,
  section,
  birthday,
  preferredItems,
}) {
  ensureConfigured()

  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/signup`)
  authUrl.searchParams.set('apikey', SUPABASE_ANON_KEY)

  const response = await fetch(authUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: buildEmail(studentNumber),
      password,
      data: {
        student_number: studentNumber,
        full_name: fullName,
        section,
        birthday,
        preferred_items: preferredItems,
      },
    }),
  })

  const responseText = await response.text()
  let data = {}
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    data = { message: responseText }
  }

  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.message || 'Signup failed')
  }

  return normalizeSession(data)
}

export async function signInStudent({ studentNumber, password }) {
  ensureConfigured()

  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/token`)
  authUrl.searchParams.set('grant_type', 'password')
  authUrl.searchParams.set('apikey', SUPABASE_ANON_KEY)

  const response = await fetch(authUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: buildEmail(studentNumber),
      password,
    }),
  })

  const responseText = await response.text()
  let data = {}
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    data = { message: responseText }
  }

  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.message || 'Login failed')
  }

  return normalizeSession(data)
}

export async function fetchProfileByAuthUserId(token, authUserId) {
  const data = await request(`/rest/v1/profiles?select=*&auth_user_id=eq.${authUserId}&limit=1`, {
    token,
  })

  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

export async function createProfile(token, profile) {
  const data = await request('/rest/v1/profiles', {
    method: 'POST',
    token,
    body: profile,
  })

  return Array.isArray(data) ? data[0] : data
}

export async function fetchListings(token) {
  const data = await request('/rest/v1/listings?select=*,listing_media(*)&order=created_at.desc', {
    token,
  })
  return Array.isArray(data) ? data : []
}

export async function fetchFavorites(token, profileId) {
  const data = await request(
    `/rest/v1/favorites?select=listing_id&profile_id=eq.${profileId}&order=created_at.desc`,
    { token },
  )

  return Array.isArray(data) ? data.map((row) => row.listing_id) : []
}

export async function insertFavorite(token, profileId, listingId) {
  await request('/rest/v1/favorites', {
    method: 'POST',
    token,
    body: { profile_id: profileId, listing_id: listingId },
  })
}

export async function deleteFavorite(token, profileId, listingId) {
  await request(
    `/rest/v1/favorites?profile_id=eq.${profileId}&listing_id=eq.${listingId}`,
    { method: 'DELETE', token },
  )
}

export async function insertListing(token, listing) {
  const data = await request('/rest/v1/listings', {
    method: 'POST',
    token,
    body: listing,
  })

  return Array.isArray(data) ? data[0] : data
}

export async function insertListingMedia(token, mediaRows) {
  if (!Array.isArray(mediaRows) || mediaRows.length === 0) return []

  const data = await request('/rest/v1/listing_media', {
    method: 'POST',
    token,
    body: mediaRows,
  })

  return Array.isArray(data) ? data : [data]
}

export async function uploadListingMediaFiles(token, listingId, files) {
  const mediaFiles = Array.isArray(files) ? files.filter(Boolean) : []
  if (mediaFiles.length === 0) return []
  const uploadSeed = Date.now()

  const preparedRows = await Promise.all(
    mediaFiles.map(async (file, index) => {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      const fileName = sanitizeFileName(file.name)
      const storagePath = `${listingId}/${uploadSeed}-${index + 1}-${fileName}`

      await uploadStorageObject(token, LISTING_MEDIA_BUCKET, storagePath, file)

      return {
        listing_id: listingId,
        media_type: mediaType,
        storage_path: storagePath,
        public_url: buildPublicStorageUrl(LISTING_MEDIA_BUCKET, storagePath),
        original_name: file.name || fileName,
        mime_type: file.type || 'application/octet-stream',
        sort_order: index,
      }
    }),
  )

  return preparedRows
}

export async function insertMessage(token, message) {
  await request('/rest/v1/messages', {
    method: 'POST',
    token,
    body: message,
  })
}

export async function fetchUserMessages(token, authUserId) {
  const data = await request(
    `/rest/v1/messages?select=*&or=(sender_id.eq.${authUserId},receiver_id.eq.${authUserId})&order=created_at.desc`,
    { token },
  )

  return Array.isArray(data) ? data : []
}

export async function fetchConversationMessages(token, listingId, participantA, participantB) {
  const data = await request(
    `/rest/v1/messages?select=*&listing_id=eq.${listingId}&or=(and(sender_id.eq.${participantA},receiver_id.eq.${participantB}),and(sender_id.eq.${participantB},receiver_id.eq.${participantA}))&order=created_at.asc`,
    { token },
  )

  return Array.isArray(data) ? data : []
}

export async function deleteConversationMessages(token, listingId, participantA, participantB) {
  await request(
    `/rest/v1/messages?listing_id=eq.${listingId}&or=(and(sender_id.eq.${participantA},receiver_id.eq.${participantB}),and(sender_id.eq.${participantB},receiver_id.eq.${participantA}))`,
    { method: 'DELETE', token },
  )
}

export async function fetchProfilesByIds(token, ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)))
  if (uniqueIds.length === 0) return []

  const data = await request(`/rest/v1/profiles?select=*&id=in.(${uniqueIds.join(',')})`, { token })
  return Array.isArray(data) ? data : []
}

export async function maybeSeedListings(token, profileId, sellerName) {
  void token
  void profileId
  void sellerName
}

export function mapListingRow(row) {
  const mediaRows = Array.isArray(row.listing_media)
    ? [...row.listing_media].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    : []

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price || 0),
    condition: row.condition,
    type: row.type,
    seller: row.seller_name || 'STI Student',
    location: row.location,
    description: row.description,
    free: Boolean(row.is_free || Number(row.price || 0) === 0),
    owner_id: row.owner_id,
    created_at: row.created_at,
    media: mediaRows.map((item) => ({
      id: item.id,
      listingId: item.listing_id,
      mediaType: item.media_type,
      storagePath: item.storage_path,
      publicUrl: item.public_url,
      originalName: item.original_name,
      mimeType: item.mime_type,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
    })),
  }
}
