// PRESSURE - Voltage Mode Tutorial Steps

import { TutorialStep } from '../types';

export const VOLTAGE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '⚡',
    iconColor: '#eab308',
    title: 'Charge & Discharge',
    subtitle: 'YOUR GOAL',
    demo: 'voltage-cell',
    body: 'Cells charge up over time. Tap anywhere to discharge the entire grid and score points equal to the total charge!',
  },
  {
    icon: '📊',
    iconColor: '#22c55e',
    title: 'Watch the Levels',
    subtitle: 'CHARGE BUILDS',
    demo: 'voltage-charge',
    body: 'Each cell shows its charge level with bars (▁▂▃▄▅▆▇). Higher charge = more points when you discharge. Wait for bigger scores!',
  },
  {
    icon: '👆',
    iconColor: '#f59e0b',
    title: 'Tap Anywhere',
    subtitle: 'GLOBAL DISCHARGE',
    demo: 'voltage-discharge',
    body: 'Tap ANY tile to discharge ALL cells at once. Timing is everything — discharge too early and you lose potential points!',
  },
  {
    icon: '🔥',
    iconColor: '#ef4444',
    title: 'Hot & Cold Cells',
    subtitle: 'RISK VS REWARD',
    demo: 'voltage-hotcold',
    body: '🔥 Hot cells charge 2× faster but overload sooner. ❄️ Cold cells charge slowly and safely. Balance your strategy!',
  },
  {
    icon: '💀',
    iconColor: '#dc2626',
    title: 'Avoid Overload!',
    subtitle: 'GAME OVER',
    demo: 'voltage-ready',
    body: "If any cell reaches max charge (8), it overloads and you lose! Don't get greedy — discharge before disaster strikes!",
  },
];
