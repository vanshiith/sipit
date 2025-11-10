import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { cacheHelpers } from '../../lib/redis';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CreateReviewInput, UpdateReviewInput } from './schemas';

async function recalculateCafeRatings(cafeId: string): Promise<void> {
  // Get all reviews for this cafe
  const reviews = await prisma.review.findMany({
    where: { cafeId },
  });

  if (reviews.length === 0) {
    await prisma.cafeRatings.update({
      where: { cafeId },
      data: {
        avgFood: 0,
        avgDrinks: 0,
        avgAmbience: 0,
        avgService: 0,
        totalReviews: 0,
      },
    });
    return;
  }

  // Calculate averages
  const avgFood =
    reviews.reduce((sum, r) => sum + r.foodRating, 0) / reviews.length;
  const avgDrinks =
    reviews.reduce((sum, r) => sum + r.drinksRating, 0) / reviews.length;
  const avgAmbience =
    reviews.reduce((sum, r) => sum + r.ambienceRating, 0) / reviews.length;
  const avgService =
    reviews.reduce((sum, r) => sum + r.serviceRating, 0) / reviews.length;

  // Update cafe ratings
  await prisma.cafeRatings.update({
    where: { cafeId },
    data: {
      avgFood: Math.round(avgFood * 10) / 10,
      avgDrinks: Math.round(avgDrinks * 10) / 10,
      avgAmbience: Math.round(avgAmbience * 10) / 10,
      avgService: Math.round(avgService * 10) / 10,
      totalReviews: reviews.length,
    },
  });

  // Invalidate cache for this cafe's location
  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (cafe) {
    await cacheHelpers.delPattern(`cafes:nearby:*`);
  }
}

export async function createReviewHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Body: CreateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const {
      cafeId,
      foodRating,
      drinksRating,
      ambienceRating,
      serviceRating,
      comment,
      photos = [],
      moodTags = [],
    } = request.body;

    // Check if cafe exists
    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) {
      return reply.status(404).send({
        error: {
          message: 'Cafe not found',
          statusCode: 404,
        },
      });
    }

    // Check if user already reviewed this cafe
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        cafeId,
      },
    });

    if (existingReview) {
      return reply.status(409).send({
        error: {
          message: 'You have already reviewed this cafe. Use update instead.',
          statusCode: 409,
        },
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        cafeId,
        foodRating,
        drinksRating,
        ambienceRating,
        serviceRating,
        comment,
        photos,
        moodTags,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
        cafe: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Recalculate cafe ratings
    await recalculateCafeRatings(cafeId);

    // Notify followers
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            preferences: {
              select: {
                notifyFriendActivity: true,
              },
            },
          },
        },
      },
    });

    const notifications = followers
      .filter((f) => f.follower.preferences?.notifyFriendActivity)
      .map((f) => ({
        userId: f.followerId,
        type: 'FRIEND_REVIEW' as const,
        title: 'New Review',
        body: `${request.user!.email} reviewed ${cafe.name}`,
        data: { reviewId: review.id, cafeId, userId },
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return reply.status(201).send({
      data: {
        review,
      },
    });
  } catch (error) {
    request.log.error('Create review error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to create review',
        statusCode: 500,
      },
    });
  }
}

export async function updateReviewHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{ Params: { id: string }; Body: UpdateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { id } = request.params;
    const updates = request.body;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return reply.status(404).send({
        error: {
          message: 'Review not found',
          statusCode: 404,
        },
      });
    }

    if (existingReview.userId !== userId) {
      return reply.status(403).send({
        error: {
          message: 'You can only update your own reviews',
          statusCode: 403,
        },
      });
    }

    // Update review
    const review = await prisma.review.update({
      where: { id },
      data: updates,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
        cafe: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Recalculate cafe ratings
    await recalculateCafeRatings(existingReview.cafeId);

    return reply.send({
      data: {
        review,
      },
    });
  } catch (error) {
    request.log.error('Update review error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to update review',
        statusCode: 500,
      },
    });
  }
}

export async function deleteReviewHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { id } = request.params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return reply.status(404).send({
        error: {
          message: 'Review not found',
          statusCode: 404,
        },
      });
    }

    if (existingReview.userId !== userId) {
      return reply.status(403).send({
        error: {
          message: 'You can only delete your own reviews',
          statusCode: 403,
        },
      });
    }

    const cafeId = existingReview.cafeId;

    // Delete review
    await prisma.review.delete({
      where: { id },
    });

    // Recalculate cafe ratings
    await recalculateCafeRatings(cafeId);

    return reply.send({
      data: {
        message: 'Review deleted successfully',
      },
    });
  } catch (error) {
    request.log.error('Delete review error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to delete review',
        statusCode: 500,
      },
    });
  }
}

export async function getCafeReviewsHandler(
  request: FastifyRequest<{
    Params: { cafeId: string };
    Querystring: { page?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { cafeId } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { cafeId },
        include: {
          user: {
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
      prisma.review.count({ where: { cafeId } }),
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
    request.log.error('Get cafe reviews error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch reviews',
        statusCode: 500,
      },
    });
  }
}
