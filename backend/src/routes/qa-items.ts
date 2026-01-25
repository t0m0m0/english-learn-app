import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// PUT /api/qa-items/:id - Update a QA item
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { question, answer, order } = req.body;
    const prisma = req.app.locals.prisma;

    const qaItem = await prisma.qAItem.update({
      where: { id },
      data: { question, answer, order },
    });

    res.json({ qaItem });
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'QA item not found' });
    }
    next(error);
  }
});

// DELETE /api/qa-items/:id - Delete a QA item
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const prisma = req.app.locals.prisma;

    await prisma.qAItem.delete({
      where: { id },
    });

    res.json({ message: 'QA item deleted successfully' });
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'QA item not found' });
    }
    next(error);
  }
});

export default router;
