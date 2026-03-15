import { Router } from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse, updateProgress, getUserProgress, getRecommendations, generateCertificate } from '../controllers/courseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', getCourses);
router.get('/recommendations', authenticateToken, getRecommendations);
router.get('/:id', getCourse);
router.post('/', authenticateToken, createCourse);
router.put('/:id', authenticateToken, updateCourse);
router.delete('/:id', authenticateToken, deleteCourse);
router.post('/:courseId/progress', authenticateToken, updateProgress);
router.get('/user/progress', authenticateToken, getUserProgress);
router.post('/:courseId/certificate', authenticateToken, generateCertificate);

export default router;
