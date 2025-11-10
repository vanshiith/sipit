import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types';

// Get user's visited cafes
export async function getVisitedCafesHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const visitedCafes = await prisma.visitedCafe.findMany({
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

  const cafes = visitedCafes.map((visited) => ({
    ...visited.cafe,
    followersCount: visited.cafe._count.followers,
    reviewsCount: visited.cafe._count.reviews,
    visitedAt: visited.createdAt,
  }));

  return reply.send({
    success: true,
    data: {
      cafes,
      count: cafes.length,
    },
  });
}

// Mark a cafe as visited
export async function markCafeVisitedHandler(
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

  // Check if already marked as visited
  const existingVisit = await prisma.visitedCafe.findUnique({
    where: {
      userId_cafeId: {
        userId,
        cafeId: cafe.id,
      },
    },
  });

  if (existingVisit) {
    return reply.status(400).send({
      error: {
        message: 'Cafe already marked as visited',
        statusCode: 400,
      },
    });
  }

  // Create visited cafe
  await prisma.visitedCafe.create({
    data: {
      userId,
      cafeId: cafe.id,
    },
  });

  return reply.status(201).send({
    success: true,
    data: {
      message: 'Cafe marked as visited successfully',
    },
  });
}

// Unmark a cafe as visited
export async function unmarkCafeVisitedHandler(
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

  // Delete the visited cafe
  const deleted = await prisma.visitedCafe.deleteMany({
    where: {
      userId,
      cafeId: cafe.id,
    },
  });

  if (deleted.count === 0) {
    return reply.status(404).send({
      error: {
        message: 'Cafe not marked as visited',
        statusCode: 404,
      },
    });
  }

  return reply.send({
    success: true,
    data: {
      message: 'Cafe unmarked as visited successfully',
    },
  });
}

// Check if cafe is visited by user
export async function isCafeVisitedHandler(
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
        isVisited: false,
      },
    });
  }

  const visitedCafe = await prisma.visitedCafe.findUnique({
    where: {
      userId_cafeId: {
        userId,
        cafeId: cafe.id,
      },
    },
  });

  return reply.send({
    data: {
      isVisited: !!visitedCafe,
    },
  });
}
