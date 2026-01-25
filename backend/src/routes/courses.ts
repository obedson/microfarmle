import { Router } from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse, updateProgress, getUserProgress } from '../controllers/courseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authenticateToken, createCourse);
router.put('/:id', authenticateToken, updateCourse);
router.delete('/:id', authenticateToken, deleteCourse);
router.post('/:courseId/progress', authenticateToken, updateProgress);
router.get('/user/progress', authenticateToken, getUserProgress);

export default router;
