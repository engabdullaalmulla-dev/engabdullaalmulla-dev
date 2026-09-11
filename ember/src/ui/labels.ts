import type { Difficulty } from '../../shared/types';

/** One set of names for the bots, used wherever a difficulty is shown. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Forgetful',
  normal: 'Steady',
  sharp: 'Merciless',
};

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'sharp'];
