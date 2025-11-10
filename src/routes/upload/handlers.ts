import { FastifyRequest, FastifyReply } from 'fastify';
import { s3Service } from '../../services/s3';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function generateUploadUrlHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{ Body: { fileName: string; fileType: string; folder: 'profiles' | 'reviews' } }>,
  reply: FastifyReply
) {
  try {
    const { fileName, fileType, folder } = request.body;

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return reply.status(400).send({
        error: {
          message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          statusCode: 400,
        },
      });
    }

    const { uploadUrl, fileUrl, key } = await s3Service.generatePresignedUploadUrl(
      fileName,
      fileType,
      folder
    );

    return reply.send({
      data: {
        uploadUrl,
        fileUrl,
        key,
      },
    });
  } catch (error) {
    request.log.error('Generate upload URL error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to generate upload URL',
        statusCode: 500,
      },
    });
  }
}

export async function uploadFileHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        error: {
          message: 'No file provided',
          statusCode: 400,
        },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        error: {
          message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          statusCode: 400,
        },
      });
    }

    // Validate file size (max 10MB)
    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({
        error: {
          message: 'File too large. Maximum size is 10MB.',
          statusCode: 400,
        },
      });
    }

    // Determine folder from field name
    const folder = data.fieldname === 'profile' ? 'profiles' : 'reviews';

    const fileUrl = await s3Service.uploadBuffer(
      buffer,
      data.filename,
      data.mimetype,
      folder
    );

    return reply.send({
      data: {
        fileUrl,
      },
    });
  } catch (error) {
    request.log.error('Upload file error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to upload file',
        statusCode: 500,
      },
    });
  }
}
