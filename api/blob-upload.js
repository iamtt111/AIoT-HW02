import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const json = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('custom-csv/')) throw new Error('Invalid upload destination');
        return { allowedContentTypes: ['text/csv', 'application/vnd.ms-excel'], addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return response.status(200).json(json);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}
