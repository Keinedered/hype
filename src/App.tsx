import React, { useState } from 'react';
import { UserContext } from './context/UserContext';
import { ProgressContext } from './context/ProgressContext';
import { mockUser } from './mock/user';
import { courses } from './mock/courses';
import Layout from './components/Layout';
import Header from './components/Header';
import Hero from './components/Hero';
import TrackFilterBar from './components/TrackFilterBar';
import CourseCard from './components/CourseCard';

const initialProgress: Record<number, number> = {
  1: 80,
  2: 40,
  3: 100
};

const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<string>('Все курсы');
  const [user] = useState(mockUser);
  const [progress] = useState(initialProgress);

  const tracks = ['Все курсы', ...Array.from(new Set(courses.map(c => c.track)))];

  const filteredCourses = selectedTrack === 'Все курсы'
    ? courses
    : courses.filter(c => c.track === selectedTrack);

  return (
    <UserContext.Provider value={user}>
      <ProgressContext.Provider value={progress}>
        <Layout>
          <Header />
          <Hero />
          <TrackFilterBar
            tracks={tracks}
            selected={selectedTrack}
            onSelect={setSelectedTrack}
          />
          <div style={{
            maxWidth: '1024px',
            margin: '0 auto',
            padding: '0 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </Layout>
      </ProgressContext.Provider>
    </UserContext.Provider>
  );
};

export default App;