export interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  courses?: Course;
}
