import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '../api/courses';

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    duration: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await courseApi.createCourse(formData);
      navigate('/courses');
    } catch (error: any) {
      console.error('Failed to create course:', error);
      setError(error.message || 'Failed to create course. Please check if you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add New Course</h1>
      
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
          <label className="block text-sm font-medium mb-2">Content (Text)</label>
          <textarea
            required
            rows={6}
            className="w-full p-3 border rounded-lg"
            placeholder="Written course content, instructions, key points..."
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Video URL (Optional)</label>
          <input
            type="url"
            className="w-full p-3 border rounded-lg"
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
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
            {loading ? 'Creating...' : 'Create Course'}
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

export default AddCourse;
