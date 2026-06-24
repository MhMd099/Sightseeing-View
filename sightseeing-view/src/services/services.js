import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://oyhhenmgtriqkpngyoro.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aGhlbm1ndHJpcWtwbmd5b3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODAyODksImV4cCI6MjA5NzI1NjI4OX0.ylRjfpfMksrEFNdb-L3b60n_CraV7AO-KiNARTpTTUY'
export const supabase = createClient(supabaseUrl, supabaseKey)

function getDisplayName(user) {
	return (
		user?.user_metadata?.full_name ||
		user?.user_metadata?.name ||
		user?.email ||
		'Benutzer'
	)
}

export async function registerUser({ email, password, fullName }) {
	return supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				full_name: fullName
			}
		}
	})
}

export async function loginUser({ email, password }) {
	return supabase.auth.signInWithPassword({
		email,
		password
	})
}

export async function logoutUser() {
	return supabase.auth.signOut()
}

export async function getCurrentUser() {
	const { data, error } = await supabase.auth.getUser()
	if (error) {
		return { user: null, error }
	}

	return {
		user: data?.user || null,
		displayName: getDisplayName(data?.user)
	}
}

export async function getUserProfile(userId) {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, username, avatar_url, bio')
		.eq('id', userId)
		.limit(1)

	if (error) {
		return { profile: null, error }
	}

	return {
		profile: Array.isArray(data) ? data[0] || null : null
	}
}

export async function updateUserProfile(userId, profile) {
	const payload = {
		username: profile.username || null,
		avatar_url: profile.avatarUrl || null,
		bio: profile.bio || null
	}

	const { data, error } = await supabase
		.from('profiles')
		.update(payload)
		.eq('id', userId)
		.select('id, username, avatar_url, bio')
		.limit(1)

	if (error) {
		return { profile: null, error }
	}

	return {
		profile: Array.isArray(data) ? data[0] || null : null
	}
}

export async function getUserFavorites(userId) {
	const { data, error } = await supabase
		.from('favorites')
		.select('id, user_id, cave_name, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })

	if (error) {
		return { favorites: [], error }
	}

	return {
		favorites: Array.isArray(data) ? data : []
	}
}

export async function getActivityFeed(limit = 15) {
	const { data, error } = await supabase
		.from('activity_feed')
		.select('id, user_id, user_name, cave_name, message, created_at, metadata')
		.order('created_at', { ascending: false })
		.limit(limit)

	if (error) {
		return { feed: [], error }
	}

	return {
		feed: Array.isArray(data) ? data : []
	}
}

export async function clearActivityFeed() {
	return supabase
		.from('activity_feed')
		.delete()
		.gte('id', 0)
}

export async function getFavoriteByCaveName(userId, caveName) {
	const { data, error } = await supabase
		.from('favorites')
		.select('id')
		.eq('user_id', userId)
		.eq('cave_name', caveName)
		.limit(1)

	if (error) {
		return { favorite: null, error }
	}

	return {
		favorite: Array.isArray(data) ? data[0] || null : null
	}
}

export async function addFavorite(userId, caveName) {
	return supabase
		.from('favorites')
		.insert({
			user_id: userId,
			cave_name: caveName
		})
		.select('id, user_id, cave_name, created_at')
		.single()
}

export async function removeFavorite(userId, caveName) {
	return supabase
		.from('favorites')
		.delete()
		.eq('user_id', userId)
		.eq('cave_name', caveName)
}

export async function toggleFavorite(userId, caveName) {
	const { favorite, error: readError } = await getFavoriteByCaveName(userId, caveName)
	if (readError) {
		return { favorite: null, error: readError }
	}

	if (favorite) {
		const { error } = await removeFavorite(userId, caveName)
		if (error) {
			return { favorite: null, error }
		}

		return { favorite: null, isFavorite: false }
	}

	const { data, error } = await addFavorite(userId, caveName)
	if (error) {
		return { favorite: null, error }
	}

	return {
		favorite: data,
		isFavorite: true
	}
}

export { getDisplayName }
