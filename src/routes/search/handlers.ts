import { FastifyRequest, FastifyReply } from 'fastify';
import { SearchCafesInput, SearchUsersInput } from './schema';
import { googlePlacesService } from '../../services/google-places';
import { prisma } from '../../lib/prisma';

/**
 * Search for cafes globally by name using Google Places API
 */
export async function searchCafesHandler(
  request: FastifyRequest<{ Querystring: SearchCafesInput }>,
  reply: FastifyReply
) {
  const { query, limit } = request.query;

  try {
    // Use Google Places Text Search to find cafes globally
    const cafes = await googlePlacesService.searchCafesByName(query, limit);

    return reply.status(200).send({
      success: true,
      data: {
        cafes,
        count: cafes.length,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: {
        message: 'Failed to search cafes',
        statusCode: 500,
      },
    });
  }
}

/**
 * Search for users by name or email
 */
export async function searchUsersHandler(
  request: FastifyRequest<{ Querystring: SearchUsersInput }>,
  reply: FastifyReply
) {
  const { query, limit } = request.query;

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePictureUrl: true,
        personalityType: true,
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.status(200).send({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl,
          personalityType: user.personalityType,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          reviewsCount: user._count.reviews,
        })),
        count: users.length,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: {
        message: 'Failed to search users',
        statusCode: 500,
      },
    });
  }
}
