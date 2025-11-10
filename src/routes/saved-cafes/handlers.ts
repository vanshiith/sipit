import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types';

// Get user's saved cafes
export async function getSavedCafesHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const savedCafes = await prisma.savedCafe.findMany({
    where: { userId },
    include: {
      cafe: {
        include: {
          ratings: true,
          _count: {
            select: {
              followers: true,
              reviews: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const cafes = savedCafes.map((saved) => ({
    ...saved.cafe,
    followersCount: saved.cafe._count.followers,
    reviewsCount: saved.cafe._count.reviews,
    savedAt: saved.createdAt,
  }));

  return reply.send({
    success: true,
    data: {
      cafes,
      count: cafes.length,
    },
  });
}

// Save a cafe
export async function saveCafeHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { placeId } = request.params;

  // Find or create the cafe
  let cafe = await prisma.cafe.findUnique({
    where: { googlePlaceId: placeId },
  });

  if (!cafe) {
    return reply.status(404).send({
      error: {
        message: 'Cafe not found. Please visit the cafe profile first to load it into the system.',
        statusCode: 404,
      },
    });
  }

  // Check if already saved
  const existingSave = await prisma.savedCafe.findUnique({
    where: {
      userId_cafeId: {
        userId,
        cafeId: cafe.id,
      },
    },
  });

  if (existingSave) {
    return reply.status(400).send({
      error: {
        message: 'Cafe already saved',
        statusCode: 400,
      },
    });
  }

  // Create saved cafe
  await prisma.savedCafe.create({
    data: {
      userId,
      cafeId: cafe.id,
    },
  });

  return reply.status(201).send({
    success: true,
    data: {
      message: 'Cafe saved successfully',
    },
  });
}

// Unsave a cafe
export async function unsaveCafeHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { placeId } = request.params;

  // Find the cafe
  const cafe = await prisma.cafe.findUnique({
    where: { googlePlaceId: placeId },
  });

  if (!cafe) {
    return reply.status(404).send({
      error: {
        message: 'Cafe not found',
        statusCode: 404,
      },
    });
  }

  // Delete the saved cafe
  const deleted = await prisma.savedCafe.deleteMany({
    where: {
      userId,
      cafeId: cafe.id,
    },
  });

  if (deleted.count === 0) {
    return reply.status(404).send({
      error: {
        message: 'Cafe not saved',
        statusCode: 404,
      },
    });
  }

  return reply.send({
    success: true,
    data: {
      message: 'Cafe unsaved successfully',
    },
  });
}

// Check if cafe is saved by user
export async function isCafeSavedHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { placeId } = request.params;

  const cafe = await prisma.cafe.findUnique({
    where: { googlePlaceId: placeId },
  });

  if (!cafe) {
    return reply.send({
      data: {
        isSaved: false,
      },
    });
  }

  const savedCafe = await prisma.savedCafe.findUnique({
    where: {
      userId_cafeId: {
        userId,
        cafeId: cafe.id,
      },
    },
  });

  return reply.send({
    data: {
      isSaved: !!savedCafe,
    },
  });
}
