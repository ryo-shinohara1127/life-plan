export type RoutineItem = {
  title: string
  start: string
  end: string
  categoryName: string | null
  /** 指定した場合、その曜日(0=日〜6=土)のみ有効。未指定は毎日。 */
  weekdays?: number[]
}

const WORKOUT_DAYS = [0, 2, 4, 6] // 日・火・木・土

export const dailyRoutine: RoutineItem[] = [
  { title: 'ニュース', start: '08:00', end: '08:30', categoryName: null },
  { title: 'AI学習', start: '08:30', end: '11:30', categoryName: 'AI' },
  { title: '読書', start: '11:30', end: '12:30', categoryName: '読書' },
  { title: '筋トレ', start: '14:00', end: '16:00', categoryName: '筋トレ', weekdays: WORKOUT_DAYS },
  {
    title: '自由時間',
    start: '14:00',
    end: '16:00',
    categoryName: null,
    weekdays: [1, 3, 5],
  },
  { title: '写真', start: '16:00', end: '16:15', categoryName: '写真' },
  { title: 'コーヒーソムリエ', start: '16:15', end: '16:30', categoryName: 'コーヒー' },
  { title: '歌', start: '16:30', end: '16:45', categoryName: '歌' },
  { title: 'note執筆', start: '18:00', end: '18:30', categoryName: null },
]

export function routineForWeekday(weekday: number): RoutineItem[] {
  return dailyRoutine.filter((item) => !item.weekdays || item.weekdays.includes(weekday))
}
