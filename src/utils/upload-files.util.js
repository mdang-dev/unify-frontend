import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../configs/supabase.config';

export const uploadFiles = async (files) => {
  const urls = [];

  for (const item of files) {
    const file = item.file;
    if (!file || !file.name) continue;

    const fileName = `${uuidv4()}-${file.name}`;
    const { error } = await supabase.storage
      .from('files')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload failed:', error);
      }
    } else {
      urls.push(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${fileName}`
      );
    }
  }

  return urls;
};
