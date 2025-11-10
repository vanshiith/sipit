import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import { CreateMenuItemInput, UpdateMenuItemInput } from './schema';

/**
 * Get user's personal menu
 */
export async function getUserMenuHandler(
  request: AuthenticatedRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    const menuItems = await prisma.personalMenuItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Group by cafe
    const menuByCafe = menuItems.reduce((acc, item) => {
      if (!acc[item.cafePlaceId]) {
        acc[item.cafePlaceId] = {
          cafePlaceId: item.cafePlaceId,
          cafeName: item.cafeName,
          items: [],
        };
      }
      acc[item.cafePlaceId].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    return reply.send({
      data: {
        menu: Object.values(menuByCafe),
        totalItems: menuItems.length,
      },
    });
  } catch (error) {
    request.log.error('Get user menu error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to fetch user menu', statusCode: 500 },
    });
  }
}

/**
 * Create a new menu item
 */
export async function createMenuItemHandler(
  request: AuthenticatedRequest<{ Body: CreateMenuItemInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { cafePlaceId, cafeName, itemName, itemType, rating, photos, notes } =
      request.body;

    const menuItem = await prisma.personalMenuItem.create({
      data: {
        userId,
        cafePlaceId,
        cafeName,
        itemName,
        itemType,
        rating,
        photos: photos || [],
        notes,
      },
    });

    return reply.status(201).send({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    request.log.error('Create menu item error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to create menu item', statusCode: 500 },
    });
  }
}

/**
 * Update a menu item
 */
export async function updateMenuItemHandler(
  request: AuthenticatedRequest<{
    Params: { itemId: string };
    Body: UpdateMenuItemInput;
  }>,
  reply: FastifyReply
) {
  try {
    const { itemId } = request.params;
    const userId = request.user!.id;
    const updateData = request.body;

    // Verify ownership
    const existingItem = await prisma.personalMenuItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return reply.status(404).send({
        error: { message: 'Menu item not found', statusCode: 404 },
      });
    }

    if (existingItem.userId !== userId) {
      return reply.status(403).send({
        error: { message: 'Not authorized to update this item', statusCode: 403 },
      });
    }

    const updatedItem = await prisma.personalMenuItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return reply.send({
      success: true,
      data: { menuItem: updatedItem },
    });
  } catch (error) {
    request.log.error('Update menu item error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to update menu item', statusCode: 500 },
    });
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItemHandler(
  request: AuthenticatedRequest<{ Params: { itemId: string } }>,
  reply: FastifyReply
) {
  try {
    const { itemId } = request.params;
    const userId = request.user!.id;

    // Verify ownership
    const existingItem = await prisma.personalMenuItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return reply.status(404).send({
        error: { message: 'Menu item not found', statusCode: 404 },
      });
    }

    if (existingItem.userId !== userId) {
      return reply.status(403).send({
        error: { message: 'Not authorized to delete this item', statusCode: 403 },
      });
    }

    await prisma.personalMenuItem.delete({
      where: { id: itemId },
    });

    return reply.send({
      success: true,
      data: { message: 'Menu item deleted successfully' },
    });
  } catch (error) {
    request.log.error('Delete menu item error:', error);
    return reply.status(500).send({
      error: { message: 'Failed to delete menu item', statusCode: 500 },
    });
  }
}
