import { Card } from "./ui";
import ProgressBar from "./ProgressBar";
import type { CallanProgressSummary } from "../types";

interface CallanProgressSectionProps {
  summary: CallanProgressSummary | null;
  loading?: boolean;
}

export function CallanProgressSection({
  summary,
  loading = false,
}: CallanProgressSectionProps) {
  if (loading) {
    return (
      <Card className="text-center py-12">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-muted">データを取得できませんでした</p>
      </Card>
    );
  }

  const hasProgress =
    summary.totalLessons > 0 || summary.practicedQAItems > 0;

  if (!hasProgress) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-muted text-lg">まだ練習を始めていません</p>
        <p className="text-text-secondary mt-2">
          カランメソッドのレッスンを始めて、進捗を確認しましょう
        </p>
      </Card>
    );
  }

  const lessonProgress =
    summary.totalLessons > 0
      ? Math.round((summary.completedLessons / summary.totalLessons) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <span className="block text-3xl md:text-4xl font-bold text-primary mb-1">
            {summary.completedLessons}
          </span>
          <span className="text-sm text-text-muted">
            / {summary.totalLessons} レッスン完了
          </span>
        </Card>

        <Card className="text-center">
          <span className="block text-3xl md:text-4xl font-bold text-primary mb-1">
            {summary.practicedQAItems}
          </span>
          <span className="text-sm text-text-muted">
            / {summary.totalQAItems} Q&A練習済
          </span>
        </Card>

        <Card className="text-center">
          <span className="block text-3xl md:text-4xl font-bold text-primary mb-1">
            {summary.streakDays}
          </span>
          <span className="text-sm text-text-muted">日連続学習</span>
        </Card>

        <Card className="text-center">
          <span className="block text-3xl md:text-4xl font-bold text-primary mb-1">
            {summary.byMode.qa.accuracy}%
          </span>
          <span className="text-sm text-text-muted">Q&A正答率</span>
        </Card>
      </section>

      {/* Lesson Progress */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          レッスン進捗
        </h2>
        <Card>
          <div className="flex justify-between mb-2">
            <span className="font-medium text-text-primary">レッスン完了率</span>
            <span className="text-sm text-text-muted">
              {summary.completedLessons}/{summary.totalLessons} ({lessonProgress}
              %)
            </span>
          </div>
          <ProgressBar
            current={summary.completedLessons}
            total={summary.totalLessons || 1}
            color="blue"
          />
        </Card>
      </section>

      {/* Mode Statistics */}
      <section>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          モード別統計
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Q&A Mode */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">Q&A</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">練習回数</span>
                <span className="font-medium">{summary.byMode.qa.total}回</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">正答数</span>
                <span className="font-medium">
                  {summary.byMode.qa.correct}回
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">正答率</span>
                <span className="font-medium text-green-600">
                  {summary.byMode.qa.accuracy}%
                </span>
              </div>
            </div>
          </Card>

          {/* Shadowing Mode */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">
              シャドーイング
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">練習回数</span>
                <span className="font-medium">
                  {summary.byMode.shadowing.total}回
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">完了数</span>
                <span className="font-medium">
                  {summary.byMode.shadowing.practiced}回
                </span>
              </div>
            </div>
          </Card>

          {/* Dictation Mode */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">
              ディクテーション
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">練習回数</span>
                <span className="font-medium">
                  {summary.byMode.dictation.total}回
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">正答数</span>
                <span className="font-medium">
                  {summary.byMode.dictation.correct}回
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">正答率</span>
                <span className="font-medium text-green-600">
                  {summary.byMode.dictation.accuracy}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Streak Banner */}
      {summary.streakDays > 0 && (
        <Card className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 text-center py-4">
          <span className="text-2xl">🔥</span>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400 ml-2">
            {summary.streakDays}日連続学習中！
          </span>
        </Card>
      )}
    </div>
  );
}

export default CallanProgressSection;
