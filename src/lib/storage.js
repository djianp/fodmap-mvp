import { supabase } from './supabase.js'

const BUCKET = 'food-photos'

export async function uploadFoodPhoto(foodId, file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${user.id}/${foodId}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function deleteFoodPhoto(photoUrl) {
  if (!photoUrl) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const match = photoUrl.match(/\/food-photos\/(.+?)(\?|$)/)
  if (!match) return
  const path = match[1]
  if (!path.startsWith(`${user.id}/`)) return
  await supabase.storage.from(BUCKET).remove([path])
}
