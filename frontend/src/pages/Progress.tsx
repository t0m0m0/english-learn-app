import { useState, useEffect } from "react";
import { progressApi, callanProgressApi } from "../services/api";
import ProgressBar from "../components/ProgressBar";
import { Container, Card } from "../components/ui";
import { CallanProgressSection } from "../components/CallanProgressSection";
import type { CallanProgressSummary } from "../types";

interface Statistics {
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  averageLevel?: number;
}

interface LevelDistributionItem {
  level: number;
  _count: number;
}

interface DailyStats {
  todayReviews: number;
  averageLevel: number;
  levelDistribution: LevelDistributionItem[];
}

interface WordProgressContentProps {
  statistics: Statistics | null;
  dailyStats: DailyStats | null;
  getLevelLabel: (level: number) => string;
  getLevelColor: (level: number) => string;
}

function WordProgressContent({
  statistics,
  dailyStats,
  getLevelLabel,
  getLevelColor,
}: WordProgressContentProps) {
  return (
    <>
      {/* Overview Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { value: dailyStats?.todayReviews || 0, label: "Words Today" },
          { value: statistics?.learnedWords || 0, label: "Words Learned" },
          { value: statistics?.masteredWords || 0, label: "Words Mastered" },
          {
            value: dailyStats?.averageLevel?.toFixed(1) || "0.0",
            label: "Average Level",
          },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <span className="block text-3xl md:text-4xl font-bold text-primary mb-1">
              {stat.value}
            </span>
            <span className="text-sm text-text-muted">{stat.label}</span>
          </Card>
        ))}
      </section>

      {/* Milestones */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-6">Milestones</h2>
        <Card>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-text-primary">
                  First 1,000 Words
                </span>
                <span className="text-sm text-text-muted">
                  Covers 85% of daily conversation
                </span>
              </div>
              <ProgressBar
                current={Math.min(statistics?.learnedWords || 0, 1000)}
                total={1000}
                color="blue"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-text-primary">
                  Full 3,000 Words
                </span>
                <span className="text-sm text-text-muted">
                  Covers 98% of daily conversation
                </span>
              </div>
              <ProgressBar
                current={statistics?.learnedWords || 0}
                total={statistics?.totalWords || 3000}
                color="purple"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-text-primary">Mastery</span>
                <span className="text-sm text-text-muted">
                  Words at level 4 or higher
                </span>
              </div>
              <ProgressBar
                current={statistics?.masteredWords || 0}
                total={statistics?.totalWords || 3000}
                color="green"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Level Distribution */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-6">
          Learning Distribution
        </h2>
        <Card>
          {dailyStats?.levelDistribution &&
          dailyStats.levelDistribution.length > 0 ? (
            <div className="space-y-3">
              {dailyStats.levelDistribution.map((item) => {
                const maxCount = Math.max(
                  ...dailyStats.levelDistribution.map((d) => d._count),
                );
                const width = (item._count / maxCount) * 100;

                return (
                  <div key={item.level} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-text-secondary">
                      {getLevelLabel(item.level)}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getLevelColor(item.level)} transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-text-primary">
                      {item._count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted text-center py-4">
              Start learning to see your distribution!
            </p>
          )}
        </Card>
      </section>

      {/* Tips */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-6">
          Tips for Success
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "🎯",
              title: "Focus on Core Words",
              desc: "Master the top 1,000 words first. They cover 85% of conversations.",
            },
            {
              icon: "🔁",
              title: "Review Regularly",
              desc: "Spaced repetition helps move words to long-term memory.",
            },
            {
              icon: "🖼️",
              title: "Think in Images",
              desc: "Connect words directly to images, not translations.",
            },
            {
              icon: "🎧",
              title: "Listen Often",
              desc: "Use Brain Soaking mode to immerse yourself in English sounds.",
            },
          ].map((tip) => (
            <Card key={tip.title} className="text-center">
              <span className="block text-3xl mb-3">{tip.icon}</span>
              <h3 className="font-semibold text-text-primary mb-2">
                {tip.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {tip.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

export function Progress() {
  const [activeTab, setActiveTab] = useState<"words" | "callan">("words");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [callanSummary, setCallanSummary] = useState<CallanProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [callanLoading, setCallanLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [progressData, statsData] = await Promise.all([
          progressApi.getUserProgress(),
          progressApi.getStats(),
        ]);

        setStatistics(progressData.statistics);
        setDailyStats(statsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "callan" && !callanSummary) {
      const fetchCallanStats = async () => {
        setCallanLoading(true);
        try {
          const summary = await callanProgressApi.getSummary();
          setCallanSummary(summary);
        } catch (error) {
          console.error("Error fetching callan stats:", error);
        } finally {
          setCallanLoading(false);
        }
      };

      fetchCallanStats();
    }
  }, [activeTab, callanSummary]);

  const getLevelLabel = (level: number): string => {
    const labels: { [key: number]: string } = {
      0: "New",
      1: "Learning",
      2: "Familiar",
      3: "Good",
      4: "Strong",
      5: "Mastered",
    };
    return labels[level] || "Unknown";
  };

  const getLevelColor = (level: number): string => {
    const colors: { [key: number]: string } = {
      0: "bg-gray-400",
      1: "bg-red-400",
      2: "bg-orange-400",
      3: "bg-yellow-400",
      4: "bg-green-400",
      5: "bg-emerald-500",
    };
    return colors[level] || "bg-gray-400";
  };

  if (loading) {
    return (
      <Container size="lg" className="py-10">
        <Card className="text-center py-12">
          <div className="text-text-muted animate-pulse">
            Loading your progress...
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-10">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Your Progress
        </h1>
        <p className="text-text-secondary">
          Track your English learning journey
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setActiveTab("words")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "words"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            単語学習
          </button>
          <button
            onClick={() => setActiveTab("callan")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "callan"
                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            カランメソッド
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "words" ? (
        <WordProgressContent
          statistics={statistics}
          dailyStats={dailyStats}
          getLevelLabel={getLevelLabel}
          getLevelColor={getLevelColor}
        />
      ) : (
        <CallanProgressSection summary={callanSummary} loading={callanLoading} />
      )}
    </Container>
  );
}

export default Progress;
