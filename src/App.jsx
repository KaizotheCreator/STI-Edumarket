import React, { useEffect, useMemo, useState } from 'react'
import ConfirmModal from './components/ConfirmModal'
import AuthScreen from './components/AuthScreen'
import MarketplaceScreen from './components/MarketplaceScreen'
import MessagesScreen from './components/MessagesScreen'
import PostItemScreen from './components/PostItemScreen'
import ProfileScreen from './components/ProfileScreen'
import TransactionsScreen from './components/TransactionsScreen'
import { emptyListingForm, emptyLoginForm, emptySignupForm, meetupLocations } from './data'
import { useBrowserRoute } from './hooks/useBrowserRoute'
import {
  clearSession,
  clearPendingProfile,
  createSavedSession,
  deleteFavorite,
  deleteListing,
  deleteTransaction,
  fetchFavorites,
  fetchListings,
  fetchConversationMessages,
  deleteConversationMessages,
  fetchUserMessages,
  fetchTransactions,
  fetchProfilesByIds,
  fetchProfileByAuthUserId,
  createProfile,
  getSessionFromStorage,
  insertFavorite,
  insertListing,
  insertTransaction,
  insertMessage,
  insertListingMedia,
  mapListingRow,
  mapTransactionRow,
  getPendingProfile,
  saveSession,
  savePendingProfile,
  signInStudent,
  signUpStudent,
  updateListing,
  updateTransaction,
  uploadListingMediaFiles,
} from './lib/supabaseApi'

const authRoutes = new Set(['/login', '/signup'])
const protectedRoutes = new Set(['/marketplace', '/profile', '/post-item', '/messages', '/transactions'])

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0

  return trimmed.split(/\s+/).filter(Boolean).length
}

function limitWords(text, maxWords) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length <= maxWords ? text.trim() : words.slice(0, maxWords).join(' ')
}

function buildActiveUser(session, profile) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    authUserId: session.user.id,
    email: session.user.email,
    profileId: profile.id,
    studentNumber: profile.student_number,
    fullName: profile.full_name,
    section: profile.section,
    birthday: profile.birthday,
    preferredItems: profile.preferred_items || [],
    profile,
  }
}

function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [listings, setListings] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [marketplacePage, setMarketplacePage] = useState(1)
  const [selectedListing, setSelectedListing] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [messageDraft, setMessageDraft] = useState('')
  const [threadDraft, setThreadDraft] = useState('')
  const [threadMessages, setThreadMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)
  const [form, setForm] = useState(emptyListingForm)
  const [loginForm, setLoginForm] = useState(emptyLoginForm)
  const [signupForm, setSignupForm] = useState(emptySignupForm)
  const [loginErrors, setLoginErrors] = useState({})
  const [signupErrors, setSignupErrors] = useState({})
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [listingMediaFiles, setListingMediaFiles] = useState([])

  const { navigate, visibleRoute } = useBrowserRoute(Boolean(authenticatedUser))

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const savedSession = getSessionFromStorage()

      if (!savedSession?.accessToken || !savedSession?.user?.id) {
        if (!cancelled) setAuthReady(true)
        return
      }

      try {
        await hydrateSession(savedSession)
      } catch (error) {
        clearSession()
        if (!cancelled) {
          setAuthenticatedUser(null)
          setAuthMessage(error.message || 'Could not restore your session.')
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!authReady) return

    if (!authenticatedUser && protectedRoutes.has(visibleRoute)) {
      navigate('/login')
    }

    if (authenticatedUser && authRoutes.has(visibleRoute)) {
      navigate('/marketplace')
    }
  }, [authReady, authenticatedUser, navigate, visibleRoute])

  useEffect(() => {
    if (!authenticatedUser || visibleRoute !== '/messages' || !selectedConversation) return

    let cancelled = false

    async function loadThread() {
      try {
        setConversationLoading(true)
        const rows = await fetchConversationMessages(
          authenticatedUser.accessToken,
          selectedConversation.listingId,
          authenticatedUser.profileId,
          selectedConversation.otherProfileId,
        )

        if (!cancelled) {
          setThreadMessages(rows)
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message || 'Could not load the conversation.')
        }
      } finally {
        if (!cancelled) {
          setConversationLoading(false)
        }
      }
    }

    loadThread()

    return () => {
      cancelled = true
    }
  }, [authenticatedUser, selectedConversation, visibleRoute])

  async function hydrateSession(session, fallbackProfileData = null) {
    setLoadingAction(true)

    try {
      let profile = await fetchProfileByAuthUserId(session.accessToken, session.user.id)

      if (!profile) {
        await delay(300)
        profile = await fetchProfileByAuthUserId(session.accessToken, session.user.id)
      }

      if (!profile) {
        const fallbackUserMetadata = session.user?.user_metadata || {}
        const profileSource =
          fallbackProfileData ||
          getPendingProfile() ||
          {
            studentNumber:
              fallbackUserMetadata.student_number || session.user?.email?.split('@')[0] || '',
            fullName: fallbackUserMetadata.full_name || '',
            section: fallbackUserMetadata.section || '',
            birthday: fallbackUserMetadata.birthday || '',
            preferredItems: fallbackUserMetadata.preferred_items || [],
          }

        if (profileSource.studentNumber && profileSource.fullName && profileSource.section && profileSource.birthday) {
          try {
            await createProfile(session.accessToken, {
              auth_user_id: session.user.id,
              student_number: profileSource.studentNumber,
              full_name: profileSource.fullName,
              section: profileSource.section,
              birthday: profileSource.birthday,
              preferred_items: profileSource.preferredItems || [],
            })
          } catch (error) {
            if (!String(error.message || '').includes('duplicate')) {
              throw error
            }
          }

          profile = await fetchProfileByAuthUserId(session.accessToken, session.user.id)
        }

        if (!profile) {
          throw new Error(
            'Your profile is not ready yet. Please make sure the schema and RLS policies were run.',
          )
        }
      }

      clearPendingProfile()

      const [listingRows, favoriteIds, transactionRows] = await Promise.all([
        fetchListings(session.accessToken),
        fetchFavorites(session.accessToken, profile.id),
        fetchTransactions(session.accessToken, profile.id),
      ])

      const mappedListings = listingRows.map(mapListingRow)
      const mappedTransactions = await enrichTransactions(session.accessToken, transactionRows, mappedListings)
      const activeSession = createSavedSession(session, profile)
      const activeUser = buildActiveUser(session, profile)
      saveSession(activeSession)
      setAuthenticatedUser(activeUser)
      setListings(mappedListings)
      setSelectedListing(mappedListings[0] || null)
      setFavorites(favoriteIds)
      setTransactions(mappedTransactions)
      setSelectedTransaction(mappedTransactions[0] || null)
      setAuthMessage('')
      setStatusMessage('')
    } finally {
      setLoadingAction(false)
    }
  }

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return listings.filter((listing) => {
      const isLockedListing = ['pending', 'ongoing', 'finalizing'].includes(listing.transactionStatus)
      const isParticipant =
        authenticatedUser &&
        (listing.activeBuyerId === authenticatedUser.profileId ||
          listing.activeSellerId === authenticatedUser.profileId)
      const canSeeListing = listing.transactionStatus !== 'sold' && (!isLockedListing || isParticipant)
      const matchesSearch =
        !query ||
        [listing.title, listing.category, listing.seller, listing.description]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesCategory = category === 'All' || listing.category === category

      const matchesFree = !showFreeOnly || listing.free

      return canSeeListing && matchesSearch && matchesCategory && matchesFree
    })
  }, [category, listings, search, showFreeOnly])

  const marketplacePageSize = 6
  const marketplacePageCount = Math.max(1, Math.ceil(visibleListings.length / marketplacePageSize))
  const paginatedVisibleListings = useMemo(() => {
    const startIndex = (marketplacePage - 1) * marketplacePageSize
    return visibleListings.slice(startIndex, startIndex + marketplacePageSize)
  }, [marketplacePage, visibleListings])

  useEffect(() => {
    setMarketplacePage((current) => Math.min(current, marketplacePageCount))
  }, [marketplacePageCount])

  useEffect(() => {
    setMarketplacePage(1)
  }, [search, category, showFreeOnly])

  useEffect(() => {
    if (!authenticatedUser || visibleRoute !== '/marketplace') return

    const selectedVisible = selectedListing
      ? visibleListings.some((listing) => listing.id === selectedListing.id)
      : false

    if (visibleListings.length === 0 && selectedListing !== null) {
      setSelectedListing(null)
      return
    }

    if (!selectedVisible && visibleListings.length > 0) {
      setSelectedListing(visibleListings[0])
    }
  }, [authenticatedUser, selectedListing, setSelectedListing, visibleListings, visibleRoute])

  const sidebarCards = useMemo(() => {
    const ownedListingsCount = authenticatedUser
      ? listings.filter((listing) => listing.owner_id === authenticatedUser.profileId).length
      : 0

    return [
      { label: 'Marketplace', value: visibleListings.length },
      { label: 'My Posts', value: ownedListingsCount },
      { label: 'Transactions', value: transactions.length },
      { label: 'Favorites', value: favorites.length },
    ]
  }, [authenticatedUser, favorites.length, listings, transactions.length, visibleListings.length])

  const ownedListings = useMemo(() => {
    if (!authenticatedUser) return []

    return listings.filter((listing) => listing.owner_id === authenticatedUser.profileId)
  }, [authenticatedUser, listings])

  useEffect(() => {
    if (!authenticatedUser || visibleRoute !== '/messages') return

    let cancelled = false

    async function loadInbox() {
      try {
        setConversationLoading(true)
        const messageRows = await fetchUserMessages(
          authenticatedUser.accessToken,
          authenticatedUser.profileId,
        )

        const otherProfileIds = messageRows.map((message) =>
          message.sender_id === authenticatedUser.profileId
            ? message.receiver_id
            : message.sender_id,
        )
        const profileRows = await fetchProfilesByIds(
          authenticatedUser.accessToken,
          otherProfileIds,
        )

        const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]))
        const listingMap = new Map(listings.map((listing) => [listing.id, listing]))
        const groupedConversations = new Map()

        messageRows.forEach((message) => {
          const otherProfileId =
            message.sender_id === authenticatedUser.profileId
              ? message.receiver_id
              : message.sender_id
          const key = `${message.listing_id}:${otherProfileId}`

          if (groupedConversations.has(key)) return

          groupedConversations.set(key, {
            key,
            listingId: message.listing_id,
            listingTitle: listingMap.get(message.listing_id)?.title || 'Conversation',
            otherProfileId,
            otherName: profileMap.get(otherProfileId)?.full_name || 'Student',
            preview: message.body,
            updatedAt: message.created_at,
          })
        })

        const inboxConversations = Array.from(groupedConversations.values()).sort(
          (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
        )

        if (!cancelled) {
          setConversations(inboxConversations)

          const selectedKey = selectedConversation?.key
          const matchedConversation = selectedKey
            ? inboxConversations.find((conversation) => conversation.key === selectedKey)
            : inboxConversations[0] || null

          setSelectedConversation(matchedConversation || null)
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(error.message || 'Could not load your inbox.')
        }
      } finally {
        if (!cancelled) {
          setConversationLoading(false)
        }
      }
    }

    loadInbox()

    return () => {
      cancelled = true
    }
  }, [authenticatedUser, listings, selectedConversation?.key, visibleRoute])

  useEffect(() => {
    if (!authenticatedUser || visibleRoute !== '/transactions') return

    if (!selectedTransaction && transactions.length > 0) {
      setSelectedTransaction(transactions[0])
      return
    }

    if (
      selectedTransaction &&
      !transactions.some((transaction) => transaction.id === selectedTransaction.id)
    ) {
      setSelectedTransaction(transactions[0] || null)
    }
  }, [authenticatedUser, selectedTransaction, transactions, visibleRoute])

  function openConversationFromListing(listing, initialDraft = '') {
    if (!authenticatedUser || !listing) return

    const nextConversation = {
      key: `${listing.id}:${listing.owner_id}`,
      listingId: listing.id,
      listingTitle: listing.title,
      otherProfileId: listing.owner_id,
      otherName: listing.seller,
    }

    setSelectedConversation(nextConversation)
    setConversations((current) => [
      nextConversation,
      ...current.filter((conversation) => conversation.key !== nextConversation.key),
    ])
    setThreadDraft(initialDraft)
    navigate('/messages')
  }

  async function handleSignup(event) {
    event.preventDefault()
    const errors = {}

    if (!/^\d{11}$/.test(signupForm.studentNumber)) {
      errors.studentNumber = 'Student number must be exactly 11 digits.'
    }
    if (!signupForm.fullName.trim()) {
      errors.fullName = 'Full name is required.'
    }
    if (!signupForm.section.trim()) {
      errors.section = 'Section is required.'
    }
    if (!signupForm.birthday) {
      errors.birthday = 'Birthday is required.'
    }
    if (signupForm.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setSignupErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoadingAction(true)
    setAuthMessage('Creating your account...')

    try {
      const session = await signUpStudent({
        studentNumber: signupForm.studentNumber,
        password: signupForm.password,
        fullName: signupForm.fullName.trim(),
        section: signupForm.section.trim(),
        birthday: signupForm.birthday,
        preferredItems: signupForm.preferredItems,
      })

      if (!session) {
        savePendingProfile({
          studentNumber: signupForm.studentNumber,
          fullName: signupForm.fullName.trim(),
          section: signupForm.section.trim(),
          birthday: signupForm.birthday,
          preferredItems: signupForm.preferredItems,
        })
        setSignupForm(emptySignupForm)
        setSignupErrors({})
        setShowSignupPassword(false)
        setShowSignupConfirmPassword(false)
        setAuthMessage(
          'Account created. Check your email to confirm, or disable Confirm Email in Supabase for instant login.',
        )
        navigate('/login')
        return
      }

      await hydrateSession(session, signupForm)
      navigate('/marketplace')
      clearPendingProfile()

      setSignupForm(emptySignupForm)
      setSignupErrors({})
      setShowSignupPassword(false)
      setShowSignupConfirmPassword(false)
      setAuthMessage('Account created successfully.')
    } catch (error) {
      setAuthMessage(error.message || 'Signup failed.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    const errors = {}

    if (!/^\d{11}$/.test(loginForm.studentNumber)) {
      errors.studentNumber = 'Student number must be exactly 11 digits.'
    }
    if (loginForm.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
    }

    setLoginErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoadingAction(true)
    setAuthMessage('Signing you in...')

    try {
      const session = await signInStudent({
        studentNumber: loginForm.studentNumber,
        password: loginForm.password,
      })

      await hydrateSession(session)
      navigate('/marketplace')

      setLoginForm(emptyLoginForm)
      setLoginErrors({})
      setShowLoginPassword(false)
      setAuthMessage('Login successful.')
    } catch (error) {
      setAuthMessage(error.message || 'Login failed.')
      setLoginErrors({
        password: error.message ? error.message : 'Login failed.',
      })
    } finally {
      setLoadingAction(false)
    }
  }

  function handleSignupChange(patch) {
    setSignupForm((current) => ({ ...current, ...patch }))
  }

  function handleLoginChange(patch) {
    setLoginForm((current) => ({ ...current, ...patch }))
  }

  function togglePreferredItem(item) {
    setSignupForm((current) => {
      const hasItem = current.preferredItems.includes(item)
      return {
        ...current,
        preferredItems: hasItem
          ? current.preferredItems.filter((preferred) => preferred !== item)
          : [...current.preferredItems, item],
      }
    })
  }

  function requestConfirmation(action, payload, copy) {
    if (loadingAction) return
    setConfirmation({
      action,
      payload,
      ...copy,
    })
  }

  function clearConfirmation() {
    setConfirmation(null)
  }

  async function submitListingNow(nextListing) {
    if (!authenticatedUser) return

    const { mediaFiles = [], ...listingData } = nextListing

    if (!listingData.title || !listingData.location) {
      setStatusMessage('Please fill in the title and location fields.')
      return
    }

    try {
      setLoadingAction(true)
      const inserted = await insertListing(authenticatedUser.accessToken, listingData)

      let mediaRows = []
      let mediaWarning = ''
      if (mediaFiles.length > 0) {
        try {
          const preparedRows = await uploadListingMediaFiles(
            authenticatedUser.accessToken,
            inserted.id,
            mediaFiles,
          )
          mediaRows = await insertListingMedia(authenticatedUser.accessToken, preparedRows)
        } catch (mediaError) {
          mediaWarning = mediaError.message || 'Media could not be attached.'
        }
      }

      const mapped = mapListingRow({
        ...inserted,
        listing_media: mediaRows,
      })
      setListings((current) => [mapped, ...current])
      setSelectedListing(mapped)
      setForm(emptyListingForm)
      setListingMediaFiles([])
      setStatusMessage(
        mediaWarning
          ? `${mapped.title} has been posted, but the media upload failed: ${mediaWarning}`
          : `${mapped.title} has been posted successfully.`,
      )
      navigate('/marketplace')
    } catch (error) {
      setStatusMessage(error.message || 'Could not post the listing.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function enrichTransactions(token, rows, sourceListings = listings) {
    const transactionRows = Array.isArray(rows) ? rows : []
    const participantIds = Array.from(
      new Set(transactionRows.flatMap((row) => [row.buyer_id, row.seller_id]).filter(Boolean)),
    )
    const profileRows = participantIds.length > 0 ? await fetchProfilesByIds(token, participantIds) : []

    const listingMap = new Map(sourceListings.map((listing) => [listing.id, listing]))
    const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]))

    return transactionRows.map((row) => ({
      ...mapTransactionRow(row),
      listing: listingMap.get(row.listing_id) || null,
      buyer: profileMap.get(row.buyer_id) || null,
      seller: profileMap.get(row.seller_id) || null,
    }))
  }

  function updateListingLocal(listingId, patch) {
    setListings((current) =>
      current.map((listing) => (listing.id === listingId ? { ...listing, ...patch } : listing)),
    )
    setSelectedListing((current) =>
      current && current.id === listingId ? { ...current, ...patch } : current,
    )
  }

  async function refreshTransactions() {
    if (!authenticatedUser) return []

    const rows = await fetchTransactions(authenticatedUser.accessToken, authenticatedUser.profileId)
    const mapped = await enrichTransactions(authenticatedUser.accessToken, rows)

    setTransactions(mapped)
    setSelectedTransaction((current) => {
      if (current) {
        return mapped.find((transaction) => transaction.id === current.id) || mapped[0] || null
      }

      return mapped[0] || null
    })

    return mapped
  }

  async function startTransactionNow(listing) {
    if (!authenticatedUser || !listing || listing.owner_id === authenticatedUser.profileId) return

    const existingTransaction = transactions.find(
      (transaction) =>
        transaction.listingId === listing.id && transaction.status !== 'cancelled',
    )

    if (existingTransaction) {
      setSelectedTransaction(existingTransaction)
      navigate('/transactions')
      setStatusMessage('That transaction is already open.')
      return
    }

    try {
      setLoadingAction(true)
      const created = await insertTransaction(authenticatedUser.accessToken, {
        listing_id: listing.id,
        buyer_id: authenticatedUser.profileId,
        seller_id: listing.owner_id,
        agreed_price: listing.free ? 0 : Number(listing.price || 0),
        status: 'pending',
        buyer_acknowledged: false,
        seller_acknowledged: false,
        updated_at: new Date().toISOString(),
      })

      await updateListing(authenticatedUser.accessToken, listing.id, {
        transaction_status: 'pending',
        active_buyer_id: authenticatedUser.profileId,
        active_seller_id: listing.owner_id,
      })
      updateListingLocal(listing.id, {
        transactionStatus: 'pending',
        activeBuyerId: authenticatedUser.profileId,
        activeSellerId: listing.owner_id,
      })

      const refreshed = await refreshTransactions()
      const nextTransaction =
        refreshed.find(
          (transaction) =>
            transaction.listingId === listing.id &&
            transaction.buyerId === authenticatedUser.profileId,
        ) || mapTransactionRow(created)

      setSelectedTransaction(nextTransaction)
      navigate('/transactions')
      setStatusMessage('Purchase started. Open the transaction to confirm the buy.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not start the transaction.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function commitPurchaseNow(transaction) {
    if (!authenticatedUser || !transaction) return

    try {
      setLoadingAction(true)
      const nextTransaction = await updateTransaction(authenticatedUser.accessToken, transaction.id, {
        status: 'ongoing',
        buyer_acknowledged: false,
        seller_acknowledged: false,
        updated_at: new Date().toISOString(),
      })

      await updateListing(authenticatedUser.accessToken, transaction.listingId, {
        transaction_status: 'ongoing',
      })
      updateListingLocal(transaction.listingId, { transactionStatus: 'ongoing' })

      await refreshTransactions()
      setSelectedTransaction(mapTransactionRow(nextTransaction))
      setStatusMessage('Purchase confirmed. Both sides can acknowledge the transaction now.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not update the transaction.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function acknowledgeTransactionNow(transaction) {
    if (!authenticatedUser || !transaction) return

    try {
      setLoadingAction(true)
      const isBuyer = transaction.buyerId === authenticatedUser.profileId
      const isSeller = transaction.sellerId === authenticatedUser.profileId
      const nextBuyerAck = isBuyer ? true : transaction.buyerAcknowledged
      const nextSellerAck = isSeller ? true : transaction.sellerAcknowledged
      const nextStatus = nextBuyerAck && nextSellerAck ? 'finalizing' : 'ongoing'
      const nextTransaction = await updateTransaction(authenticatedUser.accessToken, transaction.id, {
        buyer_acknowledged: nextBuyerAck,
        seller_acknowledged: nextSellerAck,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })

      await updateListing(authenticatedUser.accessToken, transaction.listingId, {
        transaction_status: nextStatus,
      })
      updateListingLocal(transaction.listingId, { transactionStatus: nextStatus })

      await refreshTransactions()
      setSelectedTransaction(mapTransactionRow(nextTransaction))
      setStatusMessage(
        nextStatus === 'finalizing'
          ? 'Both sides acknowledged. Seller can now finalize the sale.'
          : 'Acknowledgement saved.',
      )
    } catch (error) {
      setStatusMessage(error.message || 'Could not acknowledge the transaction.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function finalizeTransactionNow(transaction) {
    if (!authenticatedUser || !transaction) return

    try {
      setLoadingAction(true)
      const nextTransaction = await updateTransaction(authenticatedUser.accessToken, transaction.id, {
        status: 'completed',
        updated_at: new Date().toISOString(),
      })

      await updateListing(authenticatedUser.accessToken, transaction.listingId, {
        transaction_status: 'sold',
      })
      updateListingLocal(transaction.listingId, { transactionStatus: 'sold' })

      await refreshTransactions()
      setSelectedTransaction(mapTransactionRow(nextTransaction))
      setStatusMessage('Transaction finalized. The item is marked as sold.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not finalize the transaction.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function cancelTransactionNow(transaction) {
    if (!authenticatedUser || !transaction) return

    try {
      setLoadingAction(true)
      await updateListing(authenticatedUser.accessToken, transaction.listingId, {
        transaction_status: 'available',
        active_buyer_id: null,
        active_seller_id: null,
      })
      updateListingLocal(transaction.listingId, {
        transactionStatus: 'available',
        activeBuyerId: null,
        activeSellerId: null,
      })
      const nextTransaction = transactions.find((item) => item.id !== transaction.id) || null
      await deleteTransaction(authenticatedUser.accessToken, transaction.id)
      setTransactions((current) => current.filter((item) => item.id !== transaction.id))
      setSelectedTransaction((current) => (current?.id === transaction.id ? nextTransaction : current))
      setStatusMessage('Transaction cancelled.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not cancel the transaction.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function deleteListingNow(listing) {
    if (!authenticatedUser || !listing) return

    try {
      setLoadingAction(true)
      await deleteListing(authenticatedUser.accessToken, listing.id)
      setListings((current) => current.filter((item) => item.id !== listing.id))
      setTransactions((current) => current.filter((transaction) => transaction.listingId !== listing.id))
      if (selectedListing?.id === listing.id) {
        setSelectedListing(null)
      }
      if (selectedTransaction?.listingId === listing.id) {
        setSelectedTransaction(null)
      }
      setStatusMessage('Listing deleted.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not delete the listing.')
    } finally {
      setLoadingAction(false)
    }
  }

  function handleSubmitListing(event) {
    event.preventDefault()
    if (!authenticatedUser) return

    const title = form.title.trim()
    const description = form.description.trim()
    const limitedTitle = limitWords(title, 30)
    const priceValue = Number(form.price || 0)
    const descriptionWordCount = countWords(description)
    const nextListing = {
      owner_id: authenticatedUser.profileId,
      seller_name: authenticatedUser.fullName,
      title: limitedTitle,
      category: form.category,
      price: form.type === 'Giveaway' ? 0 : priceValue,
      condition: form.condition,
      type: form.type,
      location: form.location.trim(),
      description,
      is_free: form.type === 'Giveaway' || priceValue === 0,
      mediaFiles: listingMediaFiles,
    }

    if (!title || !nextListing.location) {
      setStatusMessage('Please fill in the title and location fields.')
      return
    }

    if (countWords(title) > 30) {
      setStatusMessage('Title must be 30 words or fewer.')
      return
    }

    if (priceValue > 999) {
      setStatusMessage('Price must be 999 PHP or less.')
      return
    }

    if (!meetupLocations.includes(nextListing.location)) {
      setStatusMessage('Please choose a valid meet-up location.')
      return
    }

    if (descriptionWordCount > 100) {
      setStatusMessage('Description must be 100 words or fewer.')
      return
    }

    requestConfirmation(
      'submitListing',
      nextListing,
      {
        title: 'Publish this listing?',
        message: 'This will post the item to the marketplace for other students to see.',
        confirmLabel: 'Publish',
      },
    )
  }

  async function toggleFavorite(id) {
    if (!authenticatedUser) return

    try {
      setLoadingAction(true)
      if (favorites.includes(id)) {
        await deleteFavorite(authenticatedUser.accessToken, authenticatedUser.profileId, id)
        setFavorites((current) => current.filter((favoriteId) => favoriteId !== id))
      } else {
        await insertFavorite(authenticatedUser.accessToken, authenticatedUser.profileId, id)
        setFavorites((current) => [...current, id])
      }
    } catch (error) {
      setStatusMessage(error.message || 'Could not update favorites.')
    } finally {
      setLoadingAction(false)
    }
  }

  async function sendMessageNow(message) {
    if (!authenticatedUser) return
    if (selectedListing?.owner_id === authenticatedUser.profileId) {
      setStatusMessage('You cannot message your own listing.')
      return false
    }

    try {
      setLoadingAction(true)
      await insertMessage(authenticatedUser.accessToken, message)
      setStatusMessage(`Message sent to ${selectedListing.seller}.`)
      setMessageDraft('')
      return true
    } catch (error) {
      setStatusMessage(error.message || 'Could not send the message.')
      return false
    } finally {
      setLoadingAction(false)
    }
  }

  async function sendThreadMessageNow(message) {
    if (!authenticatedUser || !selectedConversation) return

    try {
      setLoadingAction(true)
      await insertMessage(authenticatedUser.accessToken, message)
      const rows = await fetchConversationMessages(
        authenticatedUser.accessToken,
        selectedConversation.listingId,
        authenticatedUser.profileId,
        selectedConversation.otherProfileId,
      )
      setThreadMessages(rows)
      setThreadDraft('')
      setStatusMessage(`Message sent to ${selectedConversation.otherName}.`)
      return true
    } catch (error) {
      setStatusMessage(error.message || 'Could not send the reply.')
      return false
    } finally {
      setLoadingAction(false)
    }
  }

  async function deleteConversationNow(conversation) {
    if (!authenticatedUser || !conversation) return

    try {
      setLoadingAction(true)
      await deleteConversationMessages(
        authenticatedUser.accessToken,
        conversation.listingId,
        authenticatedUser.profileId,
        conversation.otherProfileId,
      )

      setConversations((current) => current.filter((item) => item.key !== conversation.key))
      setThreadMessages([])
      setSelectedConversation(null)
      setThreadDraft('')
      setStatusMessage('Conversation deleted.')
    } catch (error) {
      setStatusMessage(error.message || 'Could not delete the conversation.')
    } finally {
      setLoadingAction(false)
    }
  }

  function sendMessage() {
    if (!authenticatedUser || !messageDraft.trim() || !selectedListing) return
    if (selectedListing.owner_id === authenticatedUser.profileId) {
      setStatusMessage('You cannot message your own listing.')
      return
    }

    requestConfirmation(
      'sendMessage',
      {
        message: {
          sender_id: authenticatedUser.profileId,
          receiver_id: selectedListing.owner_id || authenticatedUser.profileId,
          listing_id: selectedListing.id,
          body: messageDraft.trim(),
        },
        conversation: {
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          otherProfileId: selectedListing.owner_id,
          otherName: selectedListing.seller,
        },
      },
      {
        title: 'Send this message?',
        message: `This will send your message to ${selectedListing.seller}.`,
        confirmLabel: 'Send',
      },
    )
  }

  function startTransaction(listing) {
    if (!authenticatedUser || !listing || listing.owner_id === authenticatedUser.profileId) return

    startTransactionNow(listing)
  }

  function performLogout() {
    clearSession()
    clearPendingProfile()
    setAuthenticatedUser(null)
    setFavorites([])
    setListings([])
    setSelectedListing(null)
    setTransactions([])
    setSelectedTransaction(null)
    setForm(emptyListingForm)
    setLoginForm(emptyLoginForm)
    setSignupForm(emptySignupForm)
    setLoginErrors({})
    setSignupErrors({})
    setConversations([])
    setSelectedConversation(null)
    setThreadMessages([])
    setThreadDraft('')
    setListingMediaFiles([])
    setAuthMessage('You have been signed out.')
    navigate('/login')
  }

  function logout() {
    requestConfirmation(
      'logout',
      null,
      {
        title: 'Log out of EduMarket?',
        message: 'You will need to sign in again to continue using the app.',
        confirmLabel: 'Log out',
      },
    )
  }

  async function handleConfirmedAction() {
    const currentConfirmation = confirmation
    if (!currentConfirmation) return

    clearConfirmation()

    if (currentConfirmation.action === 'logout') {
      performLogout()
      return
    }

    if (currentConfirmation.action === 'submitListing') {
      await submitListingNow(currentConfirmation.payload)
      return
    }

    if (currentConfirmation.action === 'sendMessage') {
      const saved = await sendMessageNow(currentConfirmation.payload.message)
      if (saved) {
        openConversationFromListing(
          {
            id: currentConfirmation.payload.conversation.listingId,
            title: currentConfirmation.payload.conversation.listingTitle,
            owner_id: currentConfirmation.payload.conversation.otherProfileId,
            seller: currentConfirmation.payload.conversation.otherName,
          },
          '',
        )
      }
      return
    }

    if (currentConfirmation.action === 'deleteConversation') {
      await deleteConversationNow(currentConfirmation.payload.conversation)
      return
    }

    if (currentConfirmation.action === 'deleteListing') {
      await deleteListingNow(currentConfirmation.payload.listing)
      return
    }
  }

  if (!authReady) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <p className="eyebrow">EduMarket</p>
            <h1>Loading your workspace...</h1>
            <p className="lead">Connecting and restoring your session.</p>
          </div>
        </section>
      </div>
    )
  }

  if (visibleRoute === '/login' || visibleRoute === '/signup') {
    return (
      <>
        <AuthScreen
          route={visibleRoute}
          authMessage={authMessage}
          loadingAction={loadingAction}
          loginForm={loginForm}
          signupForm={signupForm}
          loginErrors={loginErrors}
          signupErrors={signupErrors}
          showLoginPassword={showLoginPassword}
          showSignupPassword={showSignupPassword}
          showSignupConfirmPassword={showSignupConfirmPassword}
          onNavigate={navigate}
          onLoginChange={handleLoginChange}
          onSignupChange={handleSignupChange}
          onSubmitLogin={handleLogin}
          onSubmitSignup={handleSignup}
          onTogglePreferredItem={togglePreferredItem}
          onToggleLoginPassword={() => setShowLoginPassword((current) => !current)}
          onToggleSignupPassword={() => setShowSignupPassword((current) => !current)}
          onToggleSignupConfirmPassword={() =>
            setShowSignupConfirmPassword((current) => !current)
          }
        />
        <ConfirmModal
          open={Boolean(confirmation)}
          title={confirmation?.title || ''}
          message={confirmation?.message || ''}
          confirmLabel={confirmation?.confirmLabel || 'Confirm'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmedAction}
          onCancel={clearConfirmation}
        />
      </>
    )
  }

  if (visibleRoute === '/profile') {
    return (
      <>
        <ProfileScreen
          user={authenticatedUser}
          activeRoute={visibleRoute}
          navigate={navigate}
          logout={logout}
          ownedListings={ownedListings}
          sidebarCards={sidebarCards}
        />
        <ConfirmModal
          open={Boolean(confirmation)}
          title={confirmation?.title || ''}
          message={confirmation?.message || ''}
          confirmLabel={confirmation?.confirmLabel || 'Confirm'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmedAction}
          onCancel={clearConfirmation}
        />
      </>
    )
  }

  if (visibleRoute === '/messages') {
    return (
      <>
        <MessagesScreen
          user={authenticatedUser}
          activeRoute={visibleRoute}
          navigate={navigate}
          logout={logout}
          conversations={conversations}
          selectedConversation={selectedConversation}
          messages={threadMessages}
          draft={threadDraft}
          setDraft={setThreadDraft}
          onSelectConversation={(conversation) => {
            setSelectedConversation(conversation)
            setThreadMessages([])
          }}
          onSend={() => {
            if (!selectedConversation || !threadDraft.trim()) return

            sendThreadMessageNow({
              sender_id: authenticatedUser.profileId,
              receiver_id: selectedConversation.otherProfileId,
              listing_id: selectedConversation.listingId,
              body: threadDraft.trim(),
            })
          }}
          onDeleteConversation={() => {
            if (!selectedConversation) return

            requestConfirmation(
              'deleteConversation',
              { conversation: selectedConversation },
              {
                title: 'Delete this conversation?',
                message:
                  'This will permanently delete the whole message thread for both people.',
                confirmLabel: 'Delete',
              },
            )
          }}
          loadingMessage={conversationLoading}
          statusMessage={statusMessage}
          sidebarCards={sidebarCards}
        />
        <ConfirmModal
          open={Boolean(confirmation)}
          title={confirmation?.title || ''}
          message={confirmation?.message || ''}
          confirmLabel={confirmation?.confirmLabel || 'Confirm'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmedAction}
          onCancel={clearConfirmation}
        />
      </>
    )
  }

  if (visibleRoute === '/transactions') {
    return (
      <>
        <TransactionsScreen
          user={authenticatedUser}
          activeRoute={visibleRoute}
          navigate={navigate}
          logout={logout}
          transactions={transactions}
          selectedTransaction={selectedTransaction}
          onSelectTransaction={setSelectedTransaction}
          onBuyTransaction={commitPurchaseNow}
          onAcknowledgeTransaction={acknowledgeTransactionNow}
          onFinalizeTransaction={finalizeTransactionNow}
          onCancelTransaction={cancelTransactionNow}
          onDeleteListing={(listing) => {
            if (!listing) return

            requestConfirmation(
              'deleteListing',
              { listing },
              {
                title: 'Delete this post?',
                message:
                  'This will permanently remove the listing and any linked transaction records.',
                confirmLabel: 'Delete',
              },
            )
          }}
          statusMessage={statusMessage}
          sidebarCards={sidebarCards}
        />
        <ConfirmModal
          open={Boolean(confirmation)}
          title={confirmation?.title || ''}
          message={confirmation?.message || ''}
          confirmLabel={confirmation?.confirmLabel || 'Confirm'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmedAction}
          onCancel={clearConfirmation}
        />
      </>
    )
  }

  if (visibleRoute === '/post-item') {
    return (
      <>
        <PostItemScreen
          user={authenticatedUser}
          activeRoute={visibleRoute}
          navigate={navigate}
          logout={logout}
          form={form}
          setForm={setForm}
          mediaFiles={listingMediaFiles}
          setMediaFiles={setListingMediaFiles}
          handleSubmitListing={handleSubmitListing}
          statusMessage={statusMessage}
          sidebarCards={sidebarCards}
        />
        <ConfirmModal
          open={Boolean(confirmation)}
          title={confirmation?.title || ''}
          message={confirmation?.message || ''}
          confirmLabel={confirmation?.confirmLabel || 'Confirm'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmedAction}
          onCancel={clearConfirmation}
        />
      </>
    )
  }

  return (
    <>
        <MarketplaceScreen
          user={authenticatedUser}
          activeRoute={visibleRoute}
          sidebarCards={sidebarCards}
          search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        showFreeOnly={showFreeOnly}
        setShowFreeOnly={setShowFreeOnly}
          visibleListings={visibleListings}
          paginatedVisibleListings={paginatedVisibleListings}
          selectedListing={selectedListing}
          setSelectedListing={setSelectedListing}
          currentPage={marketplacePage}
          totalPages={marketplacePageCount}
          onPageChange={setMarketplacePage}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          messageDraft={messageDraft}
        setMessageDraft={setMessageDraft}
        sendMessage={sendMessage}
        onStartTransaction={startTransaction}
        onOpenTransactions={() => navigate('/transactions')}
        navigate={navigate}
        logout={logout}
      />
      <ConfirmModal
        open={Boolean(confirmation)}
        title={confirmation?.title || ''}
        message={confirmation?.message || ''}
        confirmLabel={confirmation?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmedAction}
        onCancel={clearConfirmation}
      />
    </>
  )
}

export default App
