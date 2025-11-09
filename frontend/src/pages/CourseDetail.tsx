import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Award, CheckCircle } from 'lucide-react';
import { Course } from '../types/course';
import { courseApi } from '../api/courses';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const getEmbedUrl = (url: string): string => {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    
    // YouTube Shorts
    if (url.includes('youtube.com/shorts/')) {
      return url.replace('shorts/', 'embed/');
    }
    
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // If already an embed URL or other format, return as is
    return url;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const data = await courseApi.getCourse(id);
        setCourse(data);
      } catch (error) {
        console.error('Failed to fetch course:', error);
      }
    };

    fetchCourse();
  }, [id]);

  const handleComplete = async () => {
    if (!id) return;
    try {
      await courseApi.updateProgress(id, 100, true);
      setProgress(100);
      setCompleted(true);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (!course) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <span className={`px-3 py-1 rounded ${
            course.level === 'beginner' ? 'bg-green-100 text-green-800' :
            course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {course.level}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6 text-gray-600">
          <div className="flex items-center">
            <Clock size={20} className="mr-2" />
            {course.duration} minutes
          </div>
          <div className="flex items-center">
            <Award size={20} className="mr-2" />
            {course.category}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="prose max-w-none mb-8">
          <h2>Course Description</h2>
          <p>{course.description}</p>
          
          {course.video_url && (
            <>
              <h2>Course Video</h2>
              <div className="aspect-video mb-6">
                <iframe
                  src={getEmbedUrl(course.video_url)}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={course.title}
                />
              </div>
            </>
          )}
          
          <h2>Course Content</h2>
          <div className="whitespace-pre-wrap">{course.content}</div>
        </div>

        <div className="flex justify-center">
          {!completed ? (
            <button
              onClick={handleComplete}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
            >
              <CheckCircle size={20} className="mr-2" />
              Mark as Complete
            </button>
          ) : (
            <div className="flex items-center text-green-600">
              <CheckCircle size={20} className="mr-2" />
              Course Completed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
