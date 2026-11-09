/**
 * 개선 로직 빠른 검증.
 * 실행: npx tsx scripts/verify-retention.ts
 */
import assert from 'node:assert/strict'
import {
  addDaysToDateStr,
  weekdayOfDateStr,
  formatCountdown,
  getMsUntilNextMidnightKST,
  getSundayWeekDates,
  getLastNDates,
  getTodayKST,
} from '../lib/date-utils'
import { getTodayFortune, getFortuneScaleLabel } from '../lib/fortune'
import { streaksFromHistory, rolledBackMax, updateStreakState } from '../lib/game-logic'
import type { BattleOutcome } from '../lib/game-logic'
import {
  getNextAttendanceMilestone,
  getUnlockedAttendanceBadges,
  detectRareEvents,
  getTomorrowHint,
  getHonorific,
  isAttendanceMilestone,
} from '../lib/milestones'
import type { StreakState, TodayBattle } from '../types'

function emptyStreak(partial: Partial<StreakState>): StreakState {
  return {
    current_win_streak: 0,
    current_lose_streak: 0,
    current_draw_streak: 0,
    max_win_streak: 0,
    max_lose_streak: 0,
    max_draw_streak: 0,
    total_wins: 0,
    total_losses: 0,
    total_draws: 0,
    total_plays: 0,
    last_streak_achieved_at: null,
    updated_at: '',
    current_same_num_streak: 0,
    max_same_num_streak: 0,
    last_user_roll: null,
    total_rematch_wins: 0,
    total_rematch_losses: 0,
    total_rematch_draws: 0,
    roll_count_1: 0,
    roll_count_2: 0,
    roll_count_3: 0,
    roll_count_4: 0,
    roll_count_5: 0,
    roll_count_6: 0,
    current_attendance_streak: 0,
    max_attendance_streak: 0,
    last_play_date: null,
    ...partial,
  }
}

assert.equal(addDaysToDateStr('2026-08-23', 1), '2026-08-24')
assert.equal(addDaysToDateStr('2026-08-23', -29), '2026-07-25')
assert.equal(weekdayOfDateStr('2026-08-23'), 0)
assert.equal(weekdayOfDateStr('2026-08-24'), 1)
assert.equal(formatCountdown(3661000), '01:01:01')
assert.deepEqual(getSundayWeekDates('2026-08-23'), [
  '2026-08-23',
  '2026-08-24',
  '2026-08-25',
  '2026-08-26',
  '2026-08-27',
  '2026-08-28',
  '2026-08-29',
])
assert.equal(getLastNDates('2026-08-23', 3).at(-1), '2026-08-23')
assert.equal(getLastNDates('2026-08-23', 3)[0], '2026-08-21')
assert.match(getTodayKST(new Date('2026-08-23T15:00:00Z')), /^\d{4}-\d{2}-\d{2}$/)
assert.ok(getMsUntilNextMidnightKST(new Date('2026-08-23T03:00:00Z')) > 0)

const mon = getTodayFortune(5, 'win', '2026-08-24')
const fri = getTodayFortune(5, 'lose', '2026-08-28')
assert.equal(mon.keyword, '한 걸음')
assert.notEqual(mon.line, fri.line)
assert.match(mon.note, /이긴/)
assert.match(fri.note, /진 날/)
assert.equal(getFortuneScaleLabel(4), '●●●●○○')

assert.deepEqual(getNextAttendanceMilestone(0), { target: 1, remain: 1 })
assert.deepEqual(getNextAttendanceMilestone(7), { target: 14, remain: 7 })
assert.equal(getNextAttendanceMilestone(100), null)
assert.ok(isAttendanceMilestone(7))
assert.equal(isAttendanceMilestone(8), false)
assert.deepEqual(getUnlockedAttendanceBadges(7, 7), [1, 3, 7])
assert.equal(getHonorific(7, 7), '매일 오는')

const doubleBattle: TodayBattle = {
  id: '1',
  user_id: 'u',
  battle_date: '2026-08-23',
  user_roll: 4,
  ai_roll: 4,
  result: 'draw',
  has_rematch: false,
  rematch_user_roll: null,
  rematch_ai_roll: null,
  rematch_result: null,
  final_result: 'draw',
  created_at: '',
  rematched_at: null,
}

const events = detectRareEvents(
  doubleBattle,
  emptyStreak({
    current_draw_streak: 1,
    max_draw_streak: 1,
    total_draws: 1,
    total_plays: 1,
    current_same_num_streak: 3,
    max_same_num_streak: 3,
    last_user_roll: 4,
    roll_count_4: 1,
    current_attendance_streak: 3,
    max_attendance_streak: 3,
    last_play_date: '2026-08-23',
  }),
)
assert.ok(events.some((event) => event.key === 'double'))
assert.ok(events.some((event) => event.key === 'same_num'))

const rematchBattle: TodayBattle = {
  ...doubleBattle,
  user_roll: 2,
  ai_roll: 5,
  result: 'lose',
  has_rematch: true,
  rematch_user_roll: 6,
  rematch_ai_roll: 1,
  rematch_result: 'win',
  final_result: 'win',
}
const comeback = detectRareEvents(rematchBattle, emptyStreak({ roll_count_6: 2 }), true)
assert.ok(comeback.some((event) => event.key === 'comeback'))
assert.ok(comeback.some((event) => event.key === 'extreme'))

const hint = getTomorrowHint(
  true,
  emptyStreak({
    current_win_streak: 2,
    max_win_streak: 2,
    total_wins: 2,
    total_plays: 2,
    current_attendance_streak: 2,
    max_attendance_streak: 2,
    last_user_roll: 5,
    roll_count_5: 2,
    last_play_date: '2026-08-23',
  }),
)
assert.match(hint ?? '', /연승 3/)

// 재대결 연승 복구: 5연승 뒤 1차 패배 → 재대결 승리 = 6연승
const past: BattleOutcome[] = ['lose', 'win', 'win', 'win', 'win', 'win']
const before = streaksFromHistory(past)
assert.equal(before.current.win, 5)
assert.equal(before.max.win, 5)
assert.equal(before.current.lose, 0)
const afterRematchWin = updateStreakState(
  emptyStreak({ current_win_streak: before.current.win, max_win_streak: before.max.win }),
  'win',
)
assert.equal(afterRematchWin.current_win_streak, 6)
assert.equal(afterRematchWin.max_win_streak, 6)

// 1차에서 올라간 최고 기록은 되돌리고, 원래 더 높던 기록은 그대로 둔다
assert.equal(rolledBackMax(5, 4, 4, true), 4)
assert.equal(rolledBackMax(9, 4, 9, true), 9)
assert.equal(rolledBackMax(5, 4, 4, false), 5)
assert.deepEqual(streaksFromHistory([]).current, { win: 0, lose: 0, draw: 0 })

console.log('verify-retention: ok')
