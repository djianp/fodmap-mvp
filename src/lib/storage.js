import { supabase } from './supabase.js'

const FOOD_BUCKET = 'food-photos'
const SUGGESTION_BUCKET = 'suggestion-photos'

async function uploadPhoto(bucket, ownerId, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${ownerId.userId}/${ownerId.entityId}.${ext}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

async function deletePhoto(bucket, photoUrl) {
  if (!photoUrl) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const re = new RegExp(`/${bucket}/(.+?)(\\?|$)`)
  const match = photoUrl.match(re)
  if (!match) return
  const path = match[1]
  if (!path.startsWith(`${user.id}/`)) return
  await supabase.storage.from(bucket).remove([path])
}

export async function uploadFoodPhoto(foodId, file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return uploadPhoto(FOOD_BUCKET, { userId: user.id, entityId: foodId }, file)
}

export async function deleteFoodPhoto(photoUrl) {
  return deletePhoto(FOOD_BUCKET, photoUrl)
}

export async function uploadSuggestionPhoto(suggestionId, file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return uploadPhoto(SUGGESTION_BUCKET, { userId: user.id, entityId: suggestionId }, file)
}

export async function deleteSuggestionPhoto(photoUrl) {
  return deletePhoto(SUGGESTION_BUCKET, photoUrl)
}
