import React, { useEffect, useState } from 'react';
import type { User, UserStats, DailyActivity, WeeklyStats } from '../types';
import { apiUrl } from '../config/api';
import './Dashboard.css';

interface DashboardProps {
  user: User;
  onStartDailyPractice?: () => void;
  lessons?: any[];
  onStartLesson?: (lesson: any) => void;
  onCreateLesson?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onStartDailyPractice, lessons = [], onStartLesson, onCreateLesson }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchWeeklyStats();
  }, [user.id]);

  const fetchStats = async () => {
    try {
      const response = await fetch(apiUrl(`/api/users/${user.id}/stats`));
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch(apiUrl(`/api/users/${user.id}/weekly-stats`));
      const data = await response.json();
      setWeeklyStats(data);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(apiUrl(`/api/users/${user.id}/export`));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `glosetrenings-backup-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Feil ved eksport av data. Prøv igjen senere.');
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <div className="spinner-large"></div>
        <p>Laster statistikk...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard error">
        <p>Kunne ikke laste statistikk</p>
      </div>
    );
  }

  const currentStreak = calculateStreak(stats.recentActivity);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Hei, {user.displayName}! 👋</h1>
        <p className="welcome-text">Klar for å øve?</p>
      </div>

      {stats.totalWords > 0 && (
        <div className="practice-action-section">
          <div className="practice-cta">
            <div className="practice-info">
              <div className="practice-icon">📅</div>
              <div className="practice-text">
                <h2>Klar for øving?</h2>
                <p>
                  {stats.wordsReadyToday > 0
                    ? `${stats.wordsReadyToday} ${stats.wordsReadyToday === 1 ? 'ord er' : 'ord er'} klare for øving i dag!`
                    : 'Øv ordene dine når du vil!'}
                </p>
              </div>
            </div>
            <button className="practice-now-button-large" onClick={onStartDailyPractice}>
              Start øving nå →
            </button>
          </div>
        </div>
      )}

      {/* Newest lesson section */}
      {lessons.length > 0 && (
        <div className="newest-lesson-section">
          <div className="newest-lesson-card">
            <div className="newest-lesson-badge">NYESTE LEKSJON</div>
            <div className="newest-lesson-content">
              <div className="newest-lesson-info">
                <div className="newest-lesson-icon">📖</div>
                <div className="newest-lesson-text">
                  <h2>{lessons[0].title}</h2>
                  <p>Opprettet {new Date(lessons[0].date).toLocaleDateString('no-NO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                </div>
              </div>
              <button className="newest-lesson-start-button" onClick={() => onStartLesson?.(lessons[0])}>
                Øv denne leksjonen →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalWords}</div>
            <div className="stat-label">Ord øvd på</div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalTests}</div>
            <div className="stat-label">Tester fullført</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageScore.toFixed(1)}</div>
            <div className="stat-label">Gj.snitt poeng</div>
          </div>
        </div>

        <div className="stat-card fire">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{currentStreak}</div>
            <div className="stat-label">Dagers streak</div>
          </div>
        </div>
      </div>

      {stats.wordsNearMastery && stats.wordsNearMastery.length > 0 && (
        <div className="near-mastery-section">
          <h2>🎯 Ord nær mestring</h2>
          <p className="section-description">
            Disse ordene er nesten mestret! Øv litt til for å låse dem inn.
          </p>
          <div className="near-mastery-grid">
            {stats.wordsNearMastery.map((word, index) => (
              <div key={index} className="mastery-card">
                <div className="word-pair">
                  <span className="word-english">{word.english}</span>
                  <span className="word-arrow">→</span>
                  <span className="word-norwegian">{word.norwegian}</span>
                </div>
                <div className="mastery-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(word.timesCompleted / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{word.timesCompleted}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStreak > 0 && (
        <div className="streak-section">
          <h2>🔥 Din streak</h2>
          <div className="streak-calendar">
            {renderStreakCalendar(stats.recentActivity)}
          </div>
          <p className="streak-message">
            {currentStreak >= 7
              ? '🌟 Fantastisk! Fortsett slik!'
              : currentStreak >= 3
              ? '💪 Fortsett den gode vanen!'
              : '🎯 Øv hver dag for å bygge en streak!'}
          </p>
        </div>
      )}

      <div className="badges-section">
        <h2>🏆 Dine badges</h2>
        {stats.badges && stats.badges.length > 0 ? (
          <div className="badges-grid">
            {stats.badges.map((userBadge) => (
              <div key={userBadge.id} className="badge-card">
                <div className="badge-icon">{userBadge.badge?.icon}</div>
                <div className="badge-name">{userBadge.badge?.name}</div>
                <div className="badge-description">{userBadge.badge?.description}</div>
                <div className="badge-date">
                  Opptjent: {new Date(userBadge.earnedAt).toLocaleDateString('no-NO')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-badges">
            <p>Du har ingen badges ennå</p>
            <p>Start å øve for å låse opp achievements! 🎯</p>
          </div>
        )}
      </div>

      {weeklyStats && (
        <div className="weekly-stats-section">
          <h2>📈 Ukeoversikt</h2>
          <div className="weekly-comparison">
            <div className="week-column current-week">
              <div className="week-header">
                <h3>Denne uken</h3>
                <span className="week-label">Siste 7 dager</span>
              </div>
              <div className="week-stats">
                <div className="week-stat">
                  <span className="stat-icon-small">📚</span>
                  <span className="stat-number">{weeklyStats.thisWeek.wordsPracticed}</span>
                  <span className="stat-name">Ord øvd</span>
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">✅</span>
                  <span className="stat-number">{weeklyStats.thisWeek.testsCompleted}</span>
                  <span className="stat-name">Tester</span>
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">⭐</span>
                  <span className="stat-number">{weeklyStats.thisWeek.totalScore}</span>
                  <span className="stat-name">Poeng</span>
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">📅</span>
                  <span className="stat-number">{weeklyStats.thisWeek.activeDays}</span>
                  <span className="stat-name">Aktive dager</span>
                </div>
              </div>
            </div>

            <div className="week-divider">
              <div className="comparison-arrows">
                {weeklyStats.improvements.totalScore > 0 && <span className="arrow-up">↗️</span>}
                {weeklyStats.improvements.totalScore < 0 && <span className="arrow-down">↘️</span>}
                {weeklyStats.improvements.totalScore === 0 && <span className="arrow-neutral">→</span>}
              </div>
            </div>

            <div className="week-column previous-week">
              <div className="week-header">
                <h3>Forrige uke</h3>
                <span className="week-label">8-14 dager siden</span>
              </div>
              <div className="week-stats">
                <div className="week-stat">
                  <span className="stat-icon-small">📚</span>
                  <span className="stat-number">{weeklyStats.lastWeek.wordsPracticed}</span>
                  <span className="stat-name">Ord øvd</span>
                  {weeklyStats.improvements.wordsPracticed !== 0 && (
                    <span className={`improvement ${weeklyStats.improvements.wordsPracticed > 0 ? 'positive' : 'negative'}`}>
                      {weeklyStats.improvements.wordsPracticed > 0 ? '+' : ''}{weeklyStats.improvements.wordsPracticed}
                    </span>
                  )}
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">✅</span>
                  <span className="stat-number">{weeklyStats.lastWeek.testsCompleted}</span>
                  <span className="stat-name">Tester</span>
                  {weeklyStats.improvements.testsCompleted !== 0 && (
                    <span className={`improvement ${weeklyStats.improvements.testsCompleted > 0 ? 'positive' : 'negative'}`}>
                      {weeklyStats.improvements.testsCompleted > 0 ? '+' : ''}{weeklyStats.improvements.testsCompleted}
                    </span>
                  )}
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">⭐</span>
                  <span className="stat-number">{weeklyStats.lastWeek.totalScore}</span>
                  <span className="stat-name">Poeng</span>
                  {weeklyStats.improvements.totalScore !== 0 && (
                    <span className={`improvement ${weeklyStats.improvements.totalScore > 0 ? 'positive' : 'negative'}`}>
                      {weeklyStats.improvements.totalScore > 0 ? '+' : ''}{weeklyStats.improvements.totalScore}
                    </span>
                  )}
                </div>
                <div className="week-stat">
                  <span className="stat-icon-small">📅</span>
                  <span className="stat-number">{weeklyStats.lastWeek.activeDays}</span>
                  <span className="stat-name">Aktive dager</span>
                  {weeklyStats.improvements.activeDays !== 0 && (
                    <span className={`improvement ${weeklyStats.improvements.activeDays > 0 ? 'positive' : 'negative'}`}>
                      {weeklyStats.improvements.activeDays > 0 ? '+' : ''}{weeklyStats.improvements.activeDays}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {weeklyStats.improvements.totalScore > 0 && (
            <div className="weekly-message success">
              🎉 Flott jobbet! Du har forbedret deg med {weeklyStats.improvements.totalScore} poeng fra forrige uke!
            </div>
          )}
          {weeklyStats.improvements.totalScore < 0 && (
            <div className="weekly-message encourage">
              💪 Fortsett å øve! Du kommer til å forbedre deg.
            </div>
          )}
          {weeklyStats.improvements.totalScore === 0 && weeklyStats.thisWeek.totalScore > 0 && (
            <div className="weekly-message neutral">
              ⚖️ Du holder en jevn fremgang. Bra jobbet!
            </div>
          )}
        </div>
      )}

      <div className="activity-section">
        <h2>📊 Siste 7 dager</h2>
        <div className="activity-chart">
          {renderActivityChart(stats.recentActivity.slice(0, 7))}
        </div>
      </div>

      <div className="motivational-section">
        <div className="motivation-card">
          <h3>💡 Dagens tips</h3>
          <p>{getMotivationalTip(stats)}</p>
        </div>
      </div>

      <div className="data-management-section">
        <h2>💾 Datahåndtering</h2>
        <div className="data-actions">
          <button className="export-button" onClick={handleExportData}>
            📥 Last ned backup
          </button>
          <p className="export-description">
            Last ned all din data som en JSON-fil. Dette inkluderer leksjoner, ord, testresultater, badges og statistikk.
          </p>
        </div>
      </div>

      {/* Historical lessons section */}
      <div className="historical-lessons-section">
        <h2>📚 Historiske leksjoner</h2>
        {lessons.length > 0 ? (
          <div className="lessons-by-month">
            {groupLessonsByMonth(lessons).map(({ month, lessons: monthLessons }) => (
              <div key={month} className="month-group">
                <h3 className="month-header">{month}</h3>
                <div className="lessons-grid">
                  {monthLessons.map((lesson) => (
                    <div key={lesson.id} className="lesson-card" onClick={() => onStartLesson?.(lesson)}>
                      <div className="lesson-title">{lesson.title}</div>
                      <div className="lesson-date">{new Date(lesson.date).toLocaleDateString('no-NO')}</div>
                      <button className="lesson-start-button">Start øvelse →</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-lessons">
            <p>Du har ingen leksjoner ennå</p>
            <button className="create-lesson-button" onClick={onCreateLesson}>
              📸 Opprett din første leksjon
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to group lessons by month
function groupLessonsByMonth(lessons: any[]) {
  const grouped: { [key: string]: any[] } = {};

  lessons.forEach(lesson => {
    const date = new Date(lesson.date);
    const monthKey = date.toLocaleDateString('no-NO', { year: 'numeric', month: 'long' });

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(lesson);
  });

  // Convert to array and sort by date (newest first)
  return Object.entries(grouped)
    .sort((a, b) => {
      const dateA = new Date(b[1][0].date);
      const dateB = new Date(a[1][0].date);
      return dateA.getTime() - dateB.getTime();
    })
    .map(([month, lessons]) => ({ month, lessons }));
}

// Helper functions

function calculateStreak(activities: DailyActivity[]): number {
  if (!activities || activities.length === 0) return 0;

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedActivities.length; i++) {
    const activityDate = new Date(sortedActivities[i].activityDate);
    activityDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (activityDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function renderStreakCalendar(activities: DailyActivity[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return (
    <div className="calendar-grid">
      {last7Days.map((date, index) => {
        const hasActivity = activities.some((activity) => {
          const activityDate = new Date(activity.activityDate);
          activityDate.setHours(0, 0, 0, 0);
          return activityDate.getTime() === date.getTime();
        });

        const dayName = date.toLocaleDateString('no-NO', { weekday: 'short' });

        return (
          <div key={index} className={`calendar-day ${hasActivity ? 'active' : 'inactive'}`}>
            <div className="day-name">{dayName}</div>
            <div className="day-indicator">{hasActivity ? '🔥' : '⚪'}</div>
          </div>
        );
      })}
    </div>
  );
}

function renderActivityChart(activities: DailyActivity[]) {
  if (!activities || activities.length === 0) {
    return <p className="no-activity">Ingen aktivitet ennå. Start å øve!</p>;
  }

  const maxScore = Math.max(...activities.map((a) => a.totalScore), 10);

  return (
    <div className="chart-bars">
      {activities.slice().reverse().map((activity, index) => {
        const date = new Date(activity.activityDate);
        const dayName = date.toLocaleDateString('no-NO', { weekday: 'short' });
        const percentage = (activity.totalScore / maxScore) * 100;

        return (
          <div key={index} className="chart-bar-container">
            <div className="bar-wrapper">
              <div
                className="bar"
                style={{ height: `${percentage}%` }}
                title={`${activity.totalScore} poeng`}
              >
                <span className="bar-value">{activity.totalScore}</span>
              </div>
            </div>
            <div className="bar-label">{dayName}</div>
          </div>
        );
      })}
    </div>
  );
}

function getMotivationalTip(stats: UserStats): string {
  const tips = [
    'Øv litt hver dag for best resultat! 📚',
    'Prøv å lage kreative setninger med ordene! ✨',
    'Husk å øve uttale - det gjør deg tryggere! 🎤',
    'Jo mer du øver, jo flere badges låser du opp! 🏆',
    'Bruk bildene til å huske ordene bedre! 🖼️',
    'Les eksempelsetningene for å lære nye måter å bruke ordene! 💡',
  ];

  if (stats.averageScore >= 8) {
    return 'Du er på vei til å bli en mester! Fortsett slik! 🌟';
  }

  if (stats.totalTests < 5) {
    return 'Øv litt hver dag, så blir du bedre og bedre! 💪';
  }

  return tips[Math.floor(Math.random() * tips.length)];
}
