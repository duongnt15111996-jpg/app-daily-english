import { Topic } from '../constants/types';
import { COLORS } from '../constants/theme';
import sampleData from './sampleData/sampleData.json';

export const TOPICS: Topic[] = [
  {
    id: 'daily-conversations',
    title: 'Daily Conversations',
    lessonCount: 24,
    completedLessons: 8,
    iconColor: COLORS.gradient.blue,
    iconName: 'chatbubble-ellipses',
    sections: [
      {
        id: 'greetings',
        title: 'Greetings',
        description: 'Learn how to greet people in various situations',
        lessonCount: 5,
        completedLessons: 5,
        lessons: [
          { id: 'g1', title: 'Lesson 1 - Nice to Meet You', duration: '5 min', isCompleted: true, parts: [{ id: 'g1p1', audioUrl: '', transcript: 'Nice to meet you. My name is John.' }, { id: 'g1p2', audioUrl: '', transcript: 'It is a pleasure to meet you.' }] },
          { id: 'g2', title: 'Lesson 2 - Introducing Yourself', duration: '7 min', isCompleted: true, parts: [{ id: 'g2p1', audioUrl: '', transcript: 'Hi, I am Sarah and I work as a teacher.' }] },
          { id: 'g3', title: 'Lesson 3 - Greetings at Work', duration: '6 min', isCompleted: true, parts: [{ id: 'g3p1', audioUrl: '', transcript: 'Good morning! How was your weekend?' }] },
          { id: 'g4', title: 'Lesson 4 - Formal Greetings', duration: '8 min', isCompleted: true, parts: [{ id: 'g4p1', audioUrl: '', transcript: 'Good afternoon, it is a pleasure to meet you.' }] },
          { id: 'g5', title: 'Lesson 5 - Casual Hellos', duration: '5 min', isCompleted: true, parts: [{ id: 'g5p1', audioUrl: '', transcript: 'Hey! What is up? Long time no see!' }] },
        ],
      },
      {
        id: 'daily-life',
        title: 'Daily Life',
        description: 'Common expressions about everyday life',
        lessonCount: 8,
        completedLessons: 3,
        lessons: [
          { id: 'd1', title: 'Lesson 1 - Morning Routine', duration: '6 min', isCompleted: true, parts: [{ id: 'd1p1', audioUrl: '', transcript: 'I wake up at seven o\'clock every morning.' }, { id: 'd1p2', audioUrl: '', transcript: 'Then I brush my teeth and take a shower.' }] },
          { id: 'd2', title: 'Lesson 2 - At the Supermarket', duration: '8 min', isCompleted: true, parts: [{ id: 'd2p1', audioUrl: '', transcript: 'Excuse me, where can I find the dairy products?' }] },
          { id: 'd3', title: 'Lesson 3 - Talking About Weather', duration: '5 min', isCompleted: true, parts: [{ id: 'd3p1', audioUrl: '', transcript: 'It looks like it is going to rain today.' }] },
          { id: 'd4', title: 'Lesson 4 - Shopping for Clothes', duration: '9 min', isCompleted: false, parts: [{ id: 'd4p1', audioUrl: '', transcript: 'Do you have this shirt in a medium size?' }] },
          { id: 'd5', title: 'Lesson 5 - Eating Out', duration: '7 min', isCompleted: false, parts: [{ id: 'd5p1', audioUrl: '', transcript: 'I would like to order the grilled salmon please.' }] },
        ],
      },
      {
        id: 'work-career',
        title: 'Work & Career',
        description: 'Professional English for the workplace',
        lessonCount: 6,
        completedLessons: 0,
        lessons: [
          { id: 'w1', title: 'Lesson 1 - Job Interviews', duration: '10 min', isCompleted: false, parts: [{ id: 'w1p1', audioUrl: '', transcript: 'Could you tell me about your previous work experience?' }] },
          { id: 'w2', title: 'Lesson 2 - Office Communication', duration: '8 min', isCompleted: false, parts: [{ id: 'w2p1', audioUrl: '', transcript: 'I wanted to follow up on the report you sent yesterday.' }] },
        ],
      },
      {
        id: 'social-situations',
        title: 'Social Situations',
        description: 'Conversations for social events and gatherings',
        lessonCount: 5,
        completedLessons: 0,
        lessons: [
          { id: 's1', title: 'Lesson 1 - Making Small Talk', duration: '6 min', isCompleted: false, parts: [{ id: 's1p1', audioUrl: '', transcript: 'So, how do you know the host of this party?' }] },
        ],
      },
    ],
  },
  {
    id: 'travel-english',
    title: 'Travel English',
    lessonCount: 18,
    completedLessons: 3,
    iconColor: COLORS.gradient.purple,
    iconName: 'airplane',
    sections: [
      {
        id: 'airport',
        title: 'At the Airport',
        description: 'Navigate airports with confidence',
        lessonCount: 6,
        completedLessons: 3,
        lessons: [
          { id: 'a1', title: 'Lesson 1 - Check-in Process', duration: '8 min', isCompleted: true, parts: [{ id: 'a1p1', audioUrl: '', transcript: 'I would like to check in for my flight to New York.' }, { id: 'a1p2', audioUrl: '', transcript: 'Here is my passport and booking confirmation.' }] },
          { id: 'a2', title: 'Lesson 2 - Security Check', duration: '5 min', isCompleted: true, parts: [{ id: 'a2p1', audioUrl: '', transcript: 'Please remove your shoes and place them in the tray.' }] },
          { id: 'a3', title: 'Lesson 3 - Boarding', duration: '6 min', isCompleted: true, parts: [{ id: 'a3p1', audioUrl: '', transcript: 'We are now boarding rows fifteen through twenty.' }] },
        ],
      },
      {
        id: 'hotel',
        title: 'Hotel Stays',
        description: 'Book and navigate hotels',
        lessonCount: 5,
        completedLessons: 0,
        lessons: [
          { id: 'h1', title: 'Lesson 1 - Making a Reservation', duration: '7 min', isCompleted: false, parts: [{ id: 'h1p1', audioUrl: '', transcript: 'I would like to book a double room for three nights.' }] },
        ],
      },
    ],
  },
  {
    id: 'business-english',
    title: 'Business English',
    lessonCount: 30,
    completedLessons: 0,
    iconColor: COLORS.gradient.green,
    iconName: 'briefcase',
    sections: [
      {
        id: 'meetings',
        title: 'Meetings & Presentations',
        description: 'Lead and participate in business meetings',
        lessonCount: 8,
        completedLessons: 0,
        lessons: [
          { id: 'm1', title: 'Lesson 1 - Opening a Meeting', duration: '9 min', isCompleted: false, parts: [{ id: 'm1p1', audioUrl: '', transcript: 'Shall we get started? Thank you all for joining today.' }] },
        ],
      },
    ],
  },
  {
    id: 'ielts-listening',
    title: 'IELTS Listening',
    lessonCount: 20,
    completedLessons: 0,
    iconColor: COLORS.gradient.orange,
    iconName: 'headset',
    sections: [
      {
        id: 'section1',
        title: 'Section 1 - Conversations',
        description: 'Social conversations between two people',
        lessonCount: 5,
        completedLessons: 0,
        lessons: [
          { id: 'i1', title: 'Practice Test 1', duration: '12 min', isCompleted: false, parts: [{ id: 'i1p1', audioUrl: '', transcript: 'Good morning, I am calling to enquire about renting a flat.' }, { id: 'i1p2', audioUrl: '', transcript: 'Yes, we have a two bedroom flat available from the first of next month.' }] },
        ],
      },
    ],
  },
];

const SAMPLE_TOPIC_COLORS: Record<string, readonly string[]> = {
  'short-stories': COLORS.gradient.pink,
  'it-technology': COLORS.gradient.purple,
};

const mappedTopics: Topic[] = sampleData.map(t => ({
  id: t.id,
  title: t.title,
  iconName: t.iconName,
  iconColor: SAMPLE_TOPIC_COLORS[t.id] ?? COLORS.gradient.blue,
  lessonCount: t.sections.reduce((sum, s) => sum + s.lessons.length, 0),
  completedLessons: 0,
  sections: t.sections.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    lessonCount: s.lessons.length,
    completedLessons: 0,
    lessons: s.lessons.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      parts: l.parts,
    })),
  })),
}));

TOPICS.push(...mappedTopics);

export const getTopicById = (id: string) => TOPICS.find(t => t.id === id);

export const getLessonById = (topicId: string, lessonId: string) => {
  const topic = getTopicById(topicId);
  if (!topic) return null;
  for (const section of topic.sections) {
    const lesson = section.lessons.find(l => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
};
