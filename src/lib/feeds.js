import { supabase, isSupabaseConfigured } from './supabase'

export function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const diff = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}hr`
  if (days < 7) return `${days}day${days === 1 ? '' : 's'}`
  return date.toLocaleDateString()
}

function normalizeFeed(feed) {
  return {
    ...feed,
    id: String(feed.id),
    userId: feed.profile_id || feed.user_id,
    userName: feed.user_name || feed.author_name || 'Nexus member',
    userAvatar: feed.user_avatar || feed.author_avatar || null,
    createdAt: feed.created_at,
    isAdminPost: Boolean(feed.is_admin_post),
    likes: Number(feed.likes || 0),
    likedBy: [],
    comments: Array.isArray(feed.comments) ? feed.comments : [],
  }
}

export async function getFeeds() {
  if (!supabase || !isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id, profile_id, user_name, user_avatar, author_name, author_avatar, content, type, status, is_admin_post, likes, comments, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeFeed)
}

export function subscribeToFeeds(onChange) {
  if (!supabase || !isSupabaseConfigured()) return null
  return supabase
    .channel('feed-posts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, onChange)
    .subscribe()
}

export function unsubscribeFromFeeds(channel) {
  if (channel && supabase) supabase.removeChannel(channel)
}
