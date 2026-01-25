import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseApi } from '../api/courses';

const EditCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    duration: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await courseApi.getCourse(id!);
        setFormData({
          title: course.title,
          description: course.description,
          content: course.content,
          video_url: course.video_url || '',
          duration: course.duration,
          level: course.level,
          category: course.category
        });
      } catch (error) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await courseApi.updateCourse(id!, formData);
      navigate('/courses');
    } catch (error: any) {
      setError(error.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Course</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            required
            rows={3}
            className="w-full p-3 border rounded-lg"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            required
            rows={6}
            className="w-full p-3 border rounded-lg"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Video URL (Optional)</label>
          <input
            type="url"
            className="w-full p-3 border rounded-lg"
            value={formData.video_url}
            onChange={(e) => setFormData({...formData, video_url: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-3 border rounded-lg"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Level</label>
            <select
              className="w-full p-3 border rounded-lg"
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: e.target.value as any})}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <input
            type="text"
            required
            className="w-full p-3 border rounded-lg"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
