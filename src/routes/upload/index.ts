import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { generateUploadUrlHandler, uploadFileHandler } from './handlers';

export async function uploadRoutes(app: FastifyInstance) {
  // Generate presigned URL for direct S3 upload
  app.post('/presigned-url', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['fileName', 'fileType', 'folder'],
        properties: {
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          folder: { type: 'string', enum: ['profiles', 'reviews'] },
        },
      },
    },
    handler: generateUploadUrlHandler,
  });

  // Direct file upload (alternative to presigned URL)
  app.post('/', {
    preHandler: authenticate,
    handler: uploadFileHandler,
  });
}
