import { supabaseStorage, STORAGE_BUCKET } from '../configs/supabase.config'

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - Folder path (default: 'uploads')
 * @returns {Promise<{data, error}>}
 */
export async function uploadFile(file, folder = 'uploads') {
    try {
        // Generate unique filename to avoid conflicts
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        console.log(`📋 Starting upload for file: ${file.name} -> ${filePath}`)

        const { data, error } = await supabaseStorage.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error(`❌ Upload error for ${file.name}:`, error)
            throw error
        }

        // Get the public URL
        const { data: urlData } = supabaseStorage.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        console.log(`✅ Successfully uploaded ${file.name} to ${urlData.publicUrl}`)

        return {
            data: {
                url: urlData.publicUrl,
                file_type: fileExt,
                size: file.size,
                media_type: file.type.startsWith('image/') ? 'IMAGE' :
                    file.type.startsWith('video/') ? 'VIDEO' : 'FILE',
                original_name: file.name,
                path: filePath,
            },
            error: null
        }
    } catch (error) {
        console.error(`❌ Error uploading file ${file.name}:`, error)
        return {
            data: null,
            error: error.message || 'Upload failed'
        }
    }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} path - File path to delete
 * @returns {Promise<{data, error}>}
 */
export async function deleteFile(path) {
    try {
        const { data, error } = await supabaseStorage.storage
            .from(STORAGE_BUCKET)
            .remove([path])

        if (error) throw error

        return { data, error: null }
    } catch (error) {
        return { data: null, error: error.message }
    }
}

/**
 * Get public URL for a file
 * @param {string} path - File path in storage
 * @returns {string} Public URL
 */
export function getPublicUrl(path) {
    const { data } = supabaseStorage.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path)

    return data.publicUrl
}