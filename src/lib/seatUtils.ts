import { Seat } from '@/types'

export interface SeatRow {
  rowNum: number
  class: string
  seats: (Seat | null)[]
}

/**
 * Column map for standard aircraft layout:
 * A, B, C, [Aisle], D, E, F → indices 0–6 (index 3 = aisle)
 */
const COL_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 4, E: 5, F: 6 }

export const COLUMN_LETTERS = ['A', 'B', 'C', '', 'D', 'E', 'F'] as const

/**
 * Parses a flat list of seats into a sorted array of SeatRows,
 * each containing a 7-column array (3 left + aisle + 3 right).
 */
export function parseSeatsIntoRows(seats: Seat[]): SeatRow[] {
  const rowsMap: Record<number, SeatRow> = {}

  seats.forEach((seat) => {
    const rowNum = parseInt(seat.seat_number)
    const colLetter = seat.seat_number.replace(/[0-9]/g, '')
    const colIndex = COL_MAP[colLetter]

    if (colIndex === undefined) return

    if (!rowsMap[rowNum]) {
      rowsMap[rowNum] = {
        rowNum,
        class: seat.class,
        seats: Array(7).fill(null),
      }
    }
    rowsMap[rowNum].seats[colIndex] = seat
  })

  return Object.values(rowsMap).sort((a, b) => a.rowNum - b.rowNum)
}
