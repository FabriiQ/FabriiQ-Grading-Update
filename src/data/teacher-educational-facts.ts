/**
 * Educational facts specifically for teachers
 * These facts are displayed during loading states in the teacher portal
 */

export interface EducationalFact {
  id: string;
  fact: string;
  category: 'pedagogy' | 'classroom-management' | 'assessment' | 'technology' | 'psychology' | 'research';
  source?: string;
}

export const teacherEducationalFacts: EducationalFact[] = [
  // Pedagogy
  {
    id: 'pedagogy-1',
    fact: 'Students retain 90% of what they teach to others, compared to only 10% of what they read.',
    category: 'pedagogy',
    source: 'Learning Pyramid Research'
  },
  {
    id: 'pedagogy-2',
    fact: 'The optimal class size for learning is 15-18 students, where individual attention and group dynamics balance perfectly.',
    category: 'pedagogy',
    source: 'Educational Research'
  },
  {
    id: 'pedagogy-3',
    fact: 'Students learn best when they can connect new information to their existing knowledge and experiences.',
    category: 'pedagogy',
    source: 'Constructivist Learning Theory'
  },
  {
    id: 'pedagogy-4',
    fact: 'Active learning techniques can improve student performance by up to 6% compared to traditional lectures.',
    category: 'pedagogy',
    source: 'Meta-analysis of Active Learning'
  },
  {
    id: 'pedagogy-5',
    fact: 'The "10-minute rule" suggests that student attention spans peak every 10 minutes during lectures.',
    category: 'pedagogy',
    source: 'Cognitive Load Theory'
  },

  // Classroom Management
  {
    id: 'management-1',
    fact: 'Positive reinforcement is 3x more effective than punishment in shaping student behavior.',
    category: 'classroom-management',
    source: 'Behavioral Psychology Research'
  },
  {
    id: 'management-2',
    fact: 'Students respond better to specific praise ("Great job explaining your reasoning") than general praise ("Good job").',
    category: 'classroom-management',
    source: 'Educational Psychology'
  },
  {
    id: 'management-3',
    fact: 'Wait time of 3-5 seconds after asking a question increases student participation by 400%.',
    category: 'classroom-management',
    source: 'Classroom Research Studies'
  },
  {
    id: 'management-4',
    fact: 'Establishing routines in the first two weeks of school reduces behavioral issues by up to 50%.',
    category: 'classroom-management',
    source: 'Classroom Management Research'
  },
  {
    id: 'management-5',
    fact: 'Students perform better in classrooms with natural light and plants, improving focus by up to 15%.',
    category: 'classroom-management',
    source: 'Environmental Psychology'
  },

  // Assessment
  {
    id: 'assessment-1',
    fact: 'Formative assessment can improve student learning outcomes by up to 40% when used effectively.',
    category: 'assessment',
    source: 'Black & Wiliam Research'
  },
  {
    id: 'assessment-2',
    fact: 'Students who self-assess their work show 25% greater improvement than those who don\'t.',
    category: 'assessment',
    source: 'Metacognitive Research'
  },
  {
    id: 'assessment-3',
    fact: 'Rubrics increase grading consistency by 60% and help students understand expectations better.',
    category: 'assessment',
    source: 'Assessment Research'
  },
  {
    id: 'assessment-4',
    fact: 'Peer assessment activities improve both the assessor\'s and the assessed student\'s learning.',
    category: 'assessment',
    source: 'Collaborative Learning Studies'
  },
  {
    id: 'assessment-5',
    fact: 'Immediate feedback is 5x more effective than delayed feedback in improving student performance.',
    category: 'assessment',
    source: 'Feedback Research'
  },

  // Technology
  {
    id: 'technology-1',
    fact: 'Students using educational technology show 12% higher achievement gains than those in traditional classrooms.',
    category: 'technology',
    source: 'EdTech Research Meta-analysis'
  },
  {
    id: 'technology-2',
    fact: 'Interactive whiteboards increase student engagement by 16% when used with collaborative activities.',
    category: 'technology',
    source: 'Educational Technology Studies'
  },
  {
    id: 'technology-3',
    fact: 'Gamification in education can increase student motivation by up to 90% when implemented thoughtfully.',
    category: 'technology',
    source: 'Game-based Learning Research'
  },
  {
    id: 'technology-4',
    fact: 'Students retain information 65% better when learning includes visual elements alongside text.',
    category: 'technology',
    source: 'Multimedia Learning Theory'
  },
  {
    id: 'technology-5',
    fact: 'AI-powered adaptive learning systems can reduce learning time by 30-50% while maintaining comprehension.',
    category: 'technology',
    source: 'Adaptive Learning Research'
  },

  // Psychology
  {
    id: 'psychology-1',
    fact: 'Growth mindset interventions can improve student grades by an average of 0.3 GPA points.',
    category: 'psychology',
    source: 'Carol Dweck Research'
  },
  {
    id: 'psychology-2',
    fact: 'Students learn better when they feel psychologically safe to make mistakes and ask questions.',
    category: 'psychology',
    source: 'Educational Psychology'
  },
  {
    id: 'psychology-3',
    fact: 'Emotional intelligence accounts for 58% of job performance across all industries and professions.',
    category: 'psychology',
    source: 'EQ Research'
  },
  {
    id: 'psychology-4',
    fact: 'Students who practice mindfulness show 23% improvement in attention and 30% reduction in stress.',
    category: 'psychology',
    source: 'Mindfulness in Education Research'
  },
  {
    id: 'psychology-5',
    fact: 'Teacher enthusiasm is contagious and can increase student motivation by up to 25%.',
    category: 'psychology',
    source: 'Educational Psychology Studies'
  },

  // Research
  {
    id: 'research-1',
    fact: 'Teachers who engage in action research improve their instructional practices 3x faster than those who don\'t.',
    category: 'research',
    source: 'Professional Development Research'
  },
  {
    id: 'research-2',
    fact: 'Collaborative professional learning communities increase teacher effectiveness by 21%.',
    category: 'research',
    source: 'Teacher Development Studies'
  },
  {
    id: 'research-3',
    fact: 'Teachers who reflect on their practice weekly show 40% greater improvement in student outcomes.',
    category: 'research',
    source: 'Reflective Practice Research'
  },
  {
    id: 'research-4',
    fact: 'Evidence-based teaching practices can improve student achievement by 1.5 standard deviations.',
    category: 'research',
    source: 'John Hattie Meta-analysis'
  },
  {
    id: 'research-5',
    fact: 'Teachers who use data to inform instruction see 35% greater student progress than those who don\'t.',
    category: 'research',
    source: 'Data-Driven Instruction Research'
  }
];

/**
 * Get random educational facts for teachers
 */
export function getRandomTeacherFacts(count: number = 1, category?: EducationalFact['category']): EducationalFact[] {
  let facts = teacherEducationalFacts;
  
  if (category) {
    facts = facts.filter(fact => fact.category === category);
  }
  
  const shuffled = [...facts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get facts by category
 */
export function getTeacherFactsByCategory(category: EducationalFact['category']): EducationalFact[] {
  return teacherEducationalFacts.filter(fact => fact.category === category);
}
