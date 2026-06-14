export interface User {
  id: number;
  username: string;
  displayName: string;
  birthYear: number;
  schoolStartYear?: number;  // Året barnet startet 1. klasse (beregner grade dynamisk)
  grade: number;  // Beregnes automatisk ved innlogging basert på schoolStartYear
  createdAt: string;
  lastLogin?: string;
}

export interface Lesson {
  id: number;
  userId: number;
  title: string;
  description?: string;
  date: string;
  schoolYear: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Word {
  id: number;
  lessonId: number;
  english: string;
  norwegian: string;
  wordClass?: string;
  pluralForm?: string;
  verbThirdPerson?: string;
  verbPast?: string;
  verbPastParticiple?: string;
  verbPresentParticiple?: string;
  synonyms?: string[];
  antonyms?: string[];
  imageUrl?: string;
  exampleSentences?: string[];
  createdAt: string;
}

export type TestType = 'flashcard' | 'sentence' | 'pronunciation' | 'grammar';

export interface TestResult {
  id: number;
  userId: number;
  wordId: number;
  testType: TestType;
  score: number;
  attempts: number;
  hintsUsed: number;
  timeSpent?: number;
  completedAt: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirementType: string;
  requirementValue: number;
  createdAt: string;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  earnedAt: string;
  badge?: Badge;
}

export interface DailyActivity {
  id: number;
  userId: number;
  activityDate: string;
  wordsPracticed: number;
  totalScore: number;
  testsCompleted: number;
}

export interface HangmanState {
  word: Word;
  guessedLetters: string[];
  attempts: number;
  hintsUsed: number;
  score: number;
  isCompleted: boolean;
  isCorrect: boolean;
}

export interface PronunciationResult {
  transcript: string;
  confidence: number;
  isCorrect: boolean;
  feedback: string;
}

export interface SentenceValidation {
  isValid: boolean;
  feedback: string;
  suggestions?: string[];
  score: number;
}

export interface WordNearMastery {
  english: string;
  norwegian: string;
  timesCompleted: number;
}

export interface UserStats {
  totalWords: number;
  masteredWords?: number;
  totalTests: number;
  averageScore: number;
  wordsReadyToday?: number;
  wordsNearMastery?: WordNearMastery[];
  currentStreak: number;
  longestStreak: number;
  badges: UserBadge[];
  recentActivity: DailyActivity[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: string[];
}

export interface WeeklyActivityStats {
  wordsPracticed: number;
  totalScore: number;
  testsCompleted: number;
  activeDays: number;
}

export interface WeeklyStats {
  thisWeek: WeeklyActivityStats;
  lastWeek: WeeklyActivityStats;
  improvements: {
    wordsPracticed: number;
    totalScore: number;
    testsCompleted: number;
    activeDays: number;
  };
}
