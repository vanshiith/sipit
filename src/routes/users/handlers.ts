import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { cacheHelpers } from '../../lib/redis';
import { AuthenticatedRequest } from '../../middleware/auth';
import { UpdateProfileInput } from './schemas';

export async function getMeHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          birthday: user.birthday,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          preferences: user.preferences,
        },
      },
    });
  } catch (error) {
    request.log.error('Get me error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch user profile',
        statusCode: 500,
      },
    });
  }
}

export async function getUserByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        birthday: true,
        personalityType: true,
        profilePictureUrl: true,
        createdAt: true,
        reviews: {
          select: {
            foodRating: true,
            drinksRating: true,
            ambienceRating: true,
            serviceRating: true,
            cafeId: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Calculate Expertise Badge (highest average metric)
    let expertise = null;
    if (user.reviews.length > 0) {
      const avgFood =
        user.reviews.reduce((sum, r) => sum + r.foodRating, 0) /
        user.reviews.length;
      const avgDrinks =
        user.reviews.reduce((sum, r) => sum + r.drinksRating, 0) /
        user.reviews.length;
      const avgAmbience =
        user.reviews.reduce((sum, r) => sum + r.ambienceRating, 0) /
        user.reviews.length;
      const avgService =
        user.reviews.reduce((sum, r) => sum + r.serviceRating, 0) /
        user.reviews.length;

      const metrics = [
        { name: 'FOOD', avg: avgFood },
        { name: 'DRINKS', avg: avgDrinks },
        { name: 'AMBIENCE', avg: avgAmbience },
        { name: 'SERVICE', avg: avgService },
      ];

      expertise = metrics.reduce((highest, current) =>
        current.avg > highest.avg ? current : highest
      ).name;
    }

    // Count unique cafes visited (cafes they've reviewed)
    const uniqueCafeIds = new Set(user.reviews.map((r) => r.cafeId));
    const cafesVisitedCount = uniqueCafeIds.size;

    return reply.send({
      data: {
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          birthday: user.birthday,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          createdAt: user.createdAt,
          expertise,
          reviewsCount: user._count.reviews,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          cafesVisitedCount,
        },
      },
    });
  } catch (error) {
    request.log.error('Get user by ID error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch user',
        statusCode: 500,
      },
    });
  }
}

export async function updateMeHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const updates = request.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      include: {
        preferences: true,
      },
    });

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          birthday: user.birthday,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          updatedAt: user.updatedAt,
          preferences: user.preferences,
        },
      },
    });
  } catch (error) {
    request.log.error('Update me error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to update user profile',
        statusCode: 500,
      },
    });
  }
}

export async function followUserHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const followerId = request.user!.id;
    const followingId = request.params.id;

    if (followerId === followingId) {
      return reply.status(400).send({
        error: {
          message: 'Cannot follow yourself',
          statusCode: 400,
        },
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return reply.status(404).send({
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'NEW_FOLLOWER',
        title: 'New Follower',
        body: `${request.user!.email} started following you`,
        data: { followerId },
      },
    });

    return reply.status(201).send({
      data: {
        follow: {
          id: follow.id,
          createdAt: follow.createdAt,
        },
      },
    });
  } catch (error: any) {
    request.log.error('Follow user error:', error);

    // Handle unique constraint violation (already following)
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: {
          message: 'Already following this user',
          statusCode: 409,
        },
      });
    }

    return reply.status(500).send({
      error: {
        message: 'Failed to follow user',
        statusCode: 500,
      },
    });
  }
}

export async function unfollowUserHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const followerId = request.user!.id;
    const followingId = request.params.id;

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return reply.send({
      data: {
        message: 'Unfollowed successfully',
      },
    });
  } catch (error: any) {
    request.log.error('Unfollow user error:', error);

    if (error.code === 'P2025') {
      return reply.status(404).send({
        error: {
          message: 'Follow relationship not found',
          statusCode: 404,
        },
      });
    }

    return reply.status(500).send({
      error: {
        message: 'Failed to unfollow user',
        statusCode: 500,
      },
    });
  }
}

export async function getFollowersHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: id },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              personalityType: true,
              profilePictureUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: id } }),
    ]);

    return reply.send({
      data: {
        followers: followers.map((f) => ({
          ...f.follower,
          followedAt: f.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    request.log.error('Get followers error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch followers',
        statusCode: 500,
      },
    });
  }
}

export async function getFollowingHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: id },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              personalityType: true,
              profilePictureUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    return reply.send({
      data: {
        following: following.map((f) => ({
          ...f.following,
          followedAt: f.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    request.log.error('Get following error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch following',
        statusCode: 500,
      },
    });
  }
}

export async function getUserReviewsHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId: id },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              address: true,
              photos: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { userId: id } }),
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
    request.log.error('Get user reviews error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch user reviews',
        statusCode: 500,
      },
    });
  }
}

/**
 * Get photos posted by user in their reviews
 */
export async function getUserPhotosHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const reviews = await prisma.review.findMany({
      where: {
        userId: id,
        photos: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        photos: true,
        createdAt: true,
        cafe: {
          select: {
            id: true,
            googlePlaceId: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten photos from all reviews
    const photos = reviews.flatMap((review) =>
      review.photos.map((photoUrl) => ({
        url: photoUrl,
        reviewId: review.id,
        cafe: review.cafe,
        createdAt: review.createdAt,
      }))
    );

    return reply.send({
      data: {
        photos,
        count: photos.length,
      },
    });
  } catch (error) {
    request.log.error('Get user photos error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch user photos',
        statusCode: 500,
      },
    });
  }
}
