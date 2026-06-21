import { describe, expect, it } from 'vitest';
import { encodeState } from './encode';
import type { RobotState } from './types';

describe('encodeState', () => {
  it('encodes robot positions in red, blue, yellow, green, black order', () => {
    const robots: RobotState = {
      red: 0,
      blue: 6,
      yellow: 34,
      green: 120,
      black: 200,
    };

    expect(encodeState(robots)).toBe('0,6,34,120,200');
  });

  it('does not depend on object property insertion order', () => {
    const robots = {
      green: 120,
      yellow: 34,
      black: 200,
      blue: 6,
      red: 0,
    } satisfies RobotState;

    expect(encodeState(robots)).toBe('0,6,34,120,200');
  });
});
