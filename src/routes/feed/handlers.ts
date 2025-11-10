import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getFeedHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    // Get list of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get reviews from followed users
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          userId: {
            in: followingIds,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              personalityType: true,
              profilePictureUrl: true,
            },
          },
          cafe: {
            select: {
              id: true,
              name: true,
              address: true,
              photos: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({
        where: {
          userId: {
            in: followingIds,
          },
        },
      }),
    ]);

    return reply.send({
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    request.log.error('Get feed error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch feed',
        statusCode: 500,
      },
    });
  }
}

export async function getDiscoverFeedHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{
      Querystring: {
        latitude?: string;
        longitude?: string;
        radiusKm?: string;
        page?: string;
        limit?: string;
      };
    }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    let reviews;
    let total;

    if (request.query.latitude && request.query.longitude) {
      // Get reviews for cafes near user's location
      const latitude = parseFloat(request.query.latitude);
      const longitude = parseFloat(request.query.longitude);
      const radiusKm = parseFloat(request.query.radiusKm || '10');

      // Find cafes within radius (simplified - in production use PostGIS)
      const cafes = await prisma.cafe.findMany({
        where: {
          latitude: {
            gte: latitude - radiusKm / 111, // rough conversion
            lte: latitude + radiusKm / 111,
          },
          longitude: {
            gte: longitude - radiusKm / 111,
            lte: longitude + radiusKm / 111,
          },
        },
        select: { id: true },
      });

      const cafeIds = cafes.map((c) => c.id);

      [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: {
            cafeId: {
              in: cafeIds,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                personalityType: true,
                profilePictureUrl: true,
              },
            },
            cafe: {
              select: {
                id: true,
                name: true,
                address: true,
                photos: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.review.count({
          where: {
            cafeId: {
              in: cafeIds,
            },
          },
        }),
      ]);
    } else {
      // Get popular reviews globally
      [reviews, total] = await Promise.all([
        prisma.review.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                personalityType: true,
                profilePictureUrl: true,
              },
            },
            cafe: {
              select: {
                id: true,
                name: true,
                address: true,
                photos: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.review.count(),
      ]);
    }

    return reply.send({
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    request.log.error('Get discover feed error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch discover feed',
        statusCode: 500,
      },
    });
  }
}
