import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, Plus, Edit, Trash2 } from 'lucide-react';
import { Course } from '../types/course';
import { courseApi } from '../api/courses';
import { useAuthStore } from '../store/authStore';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        setCourses(data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await courseApi.deleteCourse(courseId);
      setCourses(courses.filter(course => course.id !== courseId));
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  if (loading) return <div className="p-8">Loading courses...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agricultural Learning Courses</h1>
        {user?.role === 'admin' && (
          <Link 
            to="/add-course"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Course
          </Link>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BookOpen className="text-green-600 mr-2" size={24} />
                <span className={`px-2 py-1 rounded text-xs ${
                  course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                  course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.level}
                </span>
              </div>
              
              {user?.role === 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/courses/${course.id}/edit`}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Edit course"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete course"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4">{course.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={16} className="mr-1" />
                {course.duration} mins
              </div>
              
              <Link 
                to={`/courses/${course.id}`}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Start Course
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
