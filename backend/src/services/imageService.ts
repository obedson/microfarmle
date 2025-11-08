import { supabase } from '../utils/supabase';
import { createError } from '../middleware/errorHandler';

export class ImageService {
  private static readonly BUCKET_NAME = 'property-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  static validateFile(file: Express.Multer.File): void {
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      throw createError('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw createError('File too large. Maximum size is 5MB.', 400);
    }
  }

  static async uploadImage(file: Express.Multer.File, folder: string = 'properties'): Promise<string> {
    this.validateFile(file);

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.originalname.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw createError('Failed to upload image', 500);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  static async uploadMultipleImages(files: Express.Multer.File[], folder: string = 'properties'): Promise<string[]> {
    if (files.length > 5) {
      throw createError('Maximum 5 images allowed', 400);
    }

    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('Failed to delete image:', error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
