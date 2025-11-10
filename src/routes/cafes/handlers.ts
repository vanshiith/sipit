import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { cacheHelpers } from '../../lib/redis';
import { config } from '../../config';
import { googlePlacesService } from '../../services/google-places';
import { AuthenticatedRequest } from '../../middleware/auth';
import { NearbyCafesInput, SearchCafesInput } from './schemas';

export async function getNearbyCafesHandler(
  request: FastifyRequest<{ Querystring: NearbyCafesInput }>,
  reply: FastifyReply
) {
  try {
    const {
      latitude,
      longitude,
      radiusKm = 5,
      sortBy = 'FOOD',
      page = 1,
      limit = 20,
    } = request.query;

    const radiusMeters = radiusKm * 1000;
    const cacheKey = `cafes:nearby:${latitude}:${longitude}:${radiusKm}`;

    // Try to get from cache
    let cafes = await cacheHelpers.get<any[]>(cacheKey);

    if (!cafes) {
      // Fetch from Google Places API
      const places = await googlePlacesService.searchNearbyCafes(
        latitude,
        longitude,
        radiusMeters
      );

      // Sync cafes to our database
      cafes = await Promise.all(
        places.map(async (place) => {
          // Check if cafe exists in our DB
          let cafe = await prisma.cafe.findUnique({
            where: { googlePlaceId: place.place_id },
            include: { ratings: true },
          });

          // Create or update cafe
          if (!cafe) {
            const photos = place.photos
              ? place.photos.map((p) =>
                  googlePlacesService.getPhotoUrl(p.photo_reference)
                )
              : [];

            cafe = await prisma.cafe.create({
              data: {
                googlePlaceId: place.place_id,
                name: place.name,
                address: place.formatted_address || (place as any).vicinity || 'Address not available',
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                photos,
                ratings: {
                  create: {
                    avgFood: 0,
                    avgDrinks: 0,
                    avgAmbience: 0,
                    avgService: 0,
                    totalReviews: 0,
                  },
                },
              },
              include: { ratings: true },
            });
          } else {
            // Update cached_at timestamp
            cafe = await prisma.cafe.update({
              where: { id: cafe.id },
              data: { cachedAt: new Date() },
              include: { ratings: true },
            });
          }

          // Calculate distance
          const distance = googlePlacesService.calculateDistance(
            latitude,
            longitude,
            cafe.latitude,
            cafe.longitude
          );

          return {
            ...cafe,
            distance,
          };
        })
      );

      // Cache the results
      await cacheHelpers.set(
        cacheKey,
        cafes,
        config.cache.nearbyCafesTtl
      );
    }

    // Sort cafes by the selected metric
    const sortedCafes = cafes.sort((a, b) => {
      const metricMap: Record<string, keyof typeof a.ratings> = {
        FOOD: 'avgFood',
        DRINKS: 'avgDrinks',
        AMBIENCE: 'avgAmbience',
        SERVICE: 'avgService',
      };
      const metric = metricMap[sortBy];
      const ratingA = a.ratings?.[metric] ?? 0;
      const ratingB = b.ratings?.[metric] ?? 0;
      return ratingB - ratingA;
    });

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedCafes = sortedCafes.slice(skip, skip + limit);

    return reply.send({
      data: {
        cafes: paginatedCafes,
        pagination: {
          page,
          limit,
          total: sortedCafes.length,
          totalPages: Math.ceil(sortedCafes.length / limit),
        },
        sortedBy: sortBy,
      },
    });
  } catch (error: any) {
    request.log.error('Get nearby cafes error:', error);
    request.log.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch nearby cafes',
        statusCode: 500,
        details: error.message,
      },
    });
  }
}

export async function getCafeByIdHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const cafe = await prisma.cafe.findUnique({
      where: { id },
      include: {
        ratings: true,
      },
    });

    if (!cafe) {
      return reply.status(404).send({
        error: {
          message: 'Cafe not found',
          statusCode: 404,
        },
      });
    }

    // Get additional details from Google Places if needed
    const placeDetails = await googlePlacesService.getPlaceDetails(
      cafe.googlePlaceId
    );

    return reply.send({
      data: {
        cafe: {
          ...cafe,
          googleDetails: placeDetails
            ? {
                phoneNumber: placeDetails.formatted_phone_number,
                website: placeDetails.website,
                openingHours: placeDetails.opening_hours,
                googleRating: placeDetails.rating,
                googleRatingsTotal: placeDetails.user_ratings_total,
              }
            : null,
        },
      },
    });
  } catch (error) {
    request.log.error('Get cafe by ID error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch cafe',
        statusCode: 500,
      },
    });
  }
}

export async function searchCafesHandler(
  request: FastifyRequest<{ Querystring: SearchCafesInput }>,
  reply: FastifyReply
) {
  try {
    const { query, latitude, longitude } = request.query;

    // Search using Google Places Text Search
    const places = await googlePlacesService.searchCafesByText(
      query,
      latitude,
      longitude
    );

    // Map to our database structure
    const cafes = await Promise.all(
      places.slice(0, 20).map(async (place) => {
        let cafe = await prisma.cafe.findUnique({
          where: { googlePlaceId: place.place_id },
          include: { ratings: true },
        });

        if (!cafe) {
          const photos = place.photos
            ? place.photos.map((p) =>
                googlePlacesService.getPhotoUrl(p.photo_reference)
              )
            : [];

          cafe = await prisma.cafe.create({
            data: {
              googlePlaceId: place.place_id,
              name: place.name,
              address: place.formatted_address,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              photos,
              ratings: {
                create: {
                  avgFood: 0,
                  avgDrinks: 0,
                  avgAmbience: 0,
                  avgService: 0,
                  totalReviews: 0,
                },
              },
            },
            include: { ratings: true },
          });
        }

        return cafe;
      })
    );

    return reply.send({
      data: {
        cafes,
        query,
      },
    });
  } catch (error) {
    request.log.error('Search cafes error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to search cafes',
        statusCode: 500,
      },
    });
  }
}

export async function syncCafeHandler(
  request: FastifyRequest<{ Params: { googlePlaceId: string } }>,
  reply: FastifyReply
) {
  try {
    const { googlePlaceId } = request.params;

    // Get place details from Google
    const placeDetails = await googlePlacesService.getPlaceDetails(googlePlaceId);

    if (!placeDetails) {
      return reply.status(404).send({
        error: {
          message: 'Cafe not found in Google Places',
          statusCode: 404,
        },
      });
    }

    const photos = placeDetails.photos
      ? placeDetails.photos.map((p) =>
          googlePlacesService.getPhotoUrl(p.photo_reference)
        )
      : [];

    // Upsert cafe in our database
    const cafe = await prisma.cafe.upsert({
      where: { googlePlaceId },
      update: {
        name: placeDetails.name,
        address: placeDetails.formatted_address,
        latitude: placeDetails.geometry.location.lat,
        longitude: placeDetails.geometry.location.lng,
        photos,
        cachedAt: new Date(),
      },
      create: {
        googlePlaceId,
        name: placeDetails.name,
        address: placeDetails.formatted_address,
        latitude: placeDetails.geometry.location.lat,
        longitude: placeDetails.geometry.location.lng,
        photos,
        ratings: {
          create: {
            avgFood: 0,
            avgDrinks: 0,
            avgAmbience: 0,
            avgService: 0,
            totalReviews: 0,
          },
        },
      },
      include: { ratings: true },
    });

    return reply.send({
      data: {
        cafe,
      },
    });
  } catch (error) {
    request.log.error('Sync cafe error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to sync cafe',
        statusCode: 500,
      },
    });
  }
}

/**
 * Get cafe details by place ID including follower count and user's follow status
 */
export async function getCafeDetailsHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { placeId } = request.params;
    const userId = request.user?.id;

    // First sync/fetch cafe from database
    let cafe = await prisma.cafe.findUnique({
      where: { googlePlaceId: placeId },
      include: {
        ratings: true,
        _count: {
          select: {
            followers: true,
            reviews: true,
          },
        },
      },
    });

    // If not in database, fetch from Google Places and create
    if (!cafe) {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (!placeDetails) {
        return reply.status(404).send({
          error: { message: 'Cafe not found', statusCode: 404 },
        });
      }

      const photos = placeDetails.photos
        ? placeDetails.photos.map((p) =>
            googlePlacesService.getPhotoUrl(p.photo_reference)
          )
        : [];

      cafe = await prisma.cafe.create({
        data: {
          googlePlaceId: placeId,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
          photos,
          ratings: {
            create: {
              avgFood: 0,
              avgDrinks: 0,
              avgAmbience: 0,
              avgService: 0,
              totalReviews: 0,
            },
          },
        },
        include: {
          ratings: true,
          _count: {
            select: {
              followers: true,
              reviews: true,
            },
          },
        },
      });
    }

    // Get Google Place details
    const googleDetails = await googlePlacesService.getPlaceDetails(placeId);

    // Check if user follows this cafe
    let isFollowing = false;
    let isSaved = false;
    let isVisited = false;
    if (userId) {
      const [follow, saved, visited] = await Promise.all([
        prisma.cafeFollow.findUnique({
          where: {
            userId_cafeId: {
              userId,
              cafeId: cafe.id,
            },
          },
        }),
        prisma.savedCafe.findUnique({
          where: {
            userId_cafeId: {
              userId,
              cafeId: cafe.id,
            },
          },
        }),
        prisma.visitedCafe.findUnique({
          where: {
            userId_cafeId: {
              userId,
              cafeId: cafe.id,
            },
          },
        }),
      ]);
      isFollowing = !!follow;
      isSaved = !!saved;
      isVisited = !!visited;
    }

    // Get Most Popular Menu Items (aggregate from PersonalMenuItem)
    const menuItems = await prisma.personalMenuItem.findMany({
      where: { cafePlaceId: placeId },
    });

    // Aggregate by item name
    const menuItemCounts = menuItems.reduce((acc, item) => {
      const key = `${item.itemName}:${item.itemType}`;
      if (!acc[key]) {
        acc[key] = {
          itemName: item.itemName,
          itemType: item.itemType,
          count: 0,
          avgRating: 0,
          totalRating: 0,
        };
      }
      acc[key].count += 1;
      acc[key].totalRating += item.rating;
      acc[key].avgRating = acc[key].totalRating / acc[key].count;
      return acc;
    }, {} as Record<string, { itemName: string; itemType: string; count: number; avgRating: number; totalRating: number }>);

    const mostPopularItems = Object.values(menuItemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ itemName, itemType, count, avgRating }) => ({
        itemName,
        itemType,
        count,
        avgRating: Math.round(avgRating * 10) / 10,
      }));

    // Get Best For Tags (aggregate mood tags from reviews)
    const reviews = await prisma.review.findMany({
      where: { cafeId: cafe.id },
      select: { moodTags: true },
    });

    const tagCounts = reviews.reduce((acc, review) => {
      review.moodTags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const bestForTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate Sip It Rating (average of 4 metrics)
    const sipItRating = cafe.ratings
      ? Math.round(
          ((cafe.ratings.avgFood +
            cafe.ratings.avgDrinks +
            cafe.ratings.avgAmbience +
            cafe.ratings.avgService) /
            4) *
            10
        ) / 10
      : 0;

    return reply.send({
      data: {
        cafe: {
          ...cafe,
          followersCount: cafe._count.followers,
          reviewsCount: cafe._count.reviews,
          isFollowing,
          isSaved,
          isVisited,
          sipItRating,
          mostPopularItems,
          bestForTags,
          googleDetails: googleDetails
            ? {
                phoneNumber: googleDetails.formatted_phone_number,
                website: googleDetails.website,
                openingHours: googleDetails.opening_hours,
                googleRating: googleDetails.rating,
                googleRatingsTotal: googleDetails.user_ratings_total,
              }
            : null,
        },
      },
    });
  } catch (error) {
    request.log.error('Get cafe details error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to fetch cafe details', statusCode: 500 },
    });
  }
}

/**
 * Follow a cafe
 */
export async function followCafeHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { placeId } = request.params;
    const userId = request.user!.id;

    // Ensure cafe exists in database
    let cafe = await prisma.cafe.findUnique({
      where: { googlePlaceId: placeId },
    });

    if (!cafe) {
      // Fetch and create cafe
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (!placeDetails) {
        return reply.status(404).send({
          error: { message: 'Cafe not found', statusCode: 404 },
        });
      }

      const photos = placeDetails.photos
        ? placeDetails.photos.map((p) =>
            googlePlacesService.getPhotoUrl(p.photo_reference)
          )
        : [];

      cafe = await prisma.cafe.create({
        data: {
          googlePlaceId: placeId,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng,
          photos,
          ratings: {
            create: {
              avgFood: 0,
              avgDrinks: 0,
              avgAmbience: 0,
              avgService: 0,
              totalReviews: 0,
            },
          },
        },
      });
    }

    // Create follow relationship (upsert to avoid duplicates)
    await prisma.cafeFollow.upsert({
      where: {
        userId_cafeId: {
          userId,
          cafeId: cafe.id,
        },
      },
      create: {
        userId,
        cafeId: cafe.id,
      },
      update: {},
    });

    return reply.send({
      success: true,
      data: {
        message: 'Successfully followed cafe',
      },
    });
  } catch (error) {
    request.log.error('Follow cafe error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to follow cafe', statusCode: 500 },
    });
  }
}

/**
 * Unfollow a cafe
 */
export async function unfollowCafeHandler(
  request: AuthenticatedRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { placeId } = request.params;
    const userId = request.user!.id;

    const cafe = await prisma.cafe.findUnique({
      where: { googlePlaceId: placeId },
    });

    if (!cafe) {
      return reply.status(404).send({
        error: { message: 'Cafe not found', statusCode: 404 },
      });
    }

    await prisma.cafeFollow.deleteMany({
      where: {
        userId,
        cafeId: cafe.id,
      },
    });

    return reply.send({
      success: true,
      data: {
        message: 'Successfully unfollowed cafe',
      },
    });
  } catch (error) {
    request.log.error('Unfollow cafe error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to unfollow cafe', statusCode: 500 },
    });
  }
}

/**
 * Get user-submitted photos from cafe reviews
 */
export async function getCafePhotosHandler(
  request: FastifyRequest<{ Params: { placeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { placeId } = request.params;

    const cafe = await prisma.cafe.findUnique({
      where: { googlePlaceId: placeId },
      include: {
        reviews: {
          where: {
            photos: {
              isEmpty: false,
            },
          },
          select: {
            id: true,
            photos: true,
            user: {
              select: {
                id: true,
                name: true,
                profilePictureUrl: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cafe) {
      return reply.status(404).send({
        error: { message: 'Cafe not found', statusCode: 404 },
      });
    }

    // Flatten photos from all reviews
    const photos = cafe.reviews.flatMap((review) =>
      review.photos.map((photoUrl) => ({
        url: photoUrl,
        reviewId: review.id,
        user: review.user,
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
    request.log.error('Get cafe photos error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to fetch cafe photos', statusCode: 500 },
    });
  }
}
