import { supabase } from './supabaseClient';

// File upload function using Supabase Storage
export const UploadFile = async ({ file }) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('trade-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('trade-files')
      .getPublicUrl(filePath);

    return { file_url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload private file function
export const UploadPrivateFile = async ({ file }) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `private/${fileName}`;

    const { data, error } = await supabase.storage
      .from('trade-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return { file_url: data.path };
  } catch (error) {
    console.error('Error uploading private file:', error);
    throw error;
  }
};

// Create signed URL for private files
export const CreateFileSignedUrl = async ({ path, expiresIn = 3600 }) => {
  try {
    const { data, error } = await supabase.storage
      .from('trade-files')
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return { signed_url: data.signedUrl };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
};

// Placeholder for LLM integration (you can integrate with OpenAI or other services)
export const InvokeLLM = async ({ prompt, model = 'gpt-3.5-turbo' }) => {
  console.warn('InvokeLLM: This function needs to be implemented with your preferred LLM service');
  throw new Error('LLM integration not configured. Please add your API keys and implementation.');
};

// Placeholder for email integration (you can use Supabase Edge Functions or third-party service)
export const SendEmail = async ({ to, subject, body }) => {
  console.warn('SendEmail: This function needs to be implemented with your email service');
  throw new Error('Email integration not configured. Please add your email service implementation.');
};

// Placeholder for image generation
export const GenerateImage = async ({ prompt }) => {
  console.warn('GenerateImage: This function needs to be implemented with your image generation service');
  throw new Error('Image generation not configured. Please add your implementation.');
};

// Placeholder for file data extraction
export const ExtractDataFromUploadedFile = async ({ file_url }) => {
  console.warn('ExtractDataFromUploadedFile: This function needs to be implemented');
  throw new Error('File extraction not configured. Please add your implementation.');
};

// Export Core object for backward compatibility
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile
};
