// PRESSURE - Shopping Spree Mode Tutorial

import { TutorialStep } from '../modes/types';

export const SHOPPING_SPREE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '👗',
    iconColor: '#ec4899',
    title: 'Tap to Buy',
    subtitle: 'YOUR MOVE',
    demo: 'shopping-group',
    body: 'Tap any item to instantly buy every connected tile of the same type. The whole group is yours!\n\nYou need at least 2 touching same-item tiles to make a purchase. Solo items stay put.',
  },
  {
    icon: '💰',
    iconColor: '#f59e0b',
    title: 'Know Your Prices',
    subtitle: 'EARN CASH',
    demo: 'shopping-values',
    body: 'Every item has a base value per tile:\n💄 Lipstick = $10 · 👗 Dress = $15 · 👠 Heels = $20 · 👜 Handbag = $25 · 💎 Diamond = $50\n\nBigger groups multiply your earnings: 5+ tiles = 2×, 7+ = 3×, 10+ = 4× — go for the mega haul.',
  },
  {
    icon: '⚡',
    iconColor: '#fbbf24',
    title: 'Flash Sale — Act Fast!',
    subtitle: 'LIMITED TIME',
    demo: 'shopping-flash',
    body: 'A random item can go on FLASH SALE for 3× its value — but only for 3 taps!\n\nWhen you see the ⚡ alert, drop everything and clear that item before the deal expires.',
  },
  {
    icon: '🛒',
    iconColor: '#22c55e',
    title: 'Fill Your Cart',
    subtitle: 'BONUS REWARDS',
    demo: 'shopping-cart',
    body: 'Every 10 items you buy triggers a $50 cart bonus — on top of what you already earned.\n\nClear big groups to rack up cart bonuses fast and watch your cash explode.',
  },
  {
    icon: '🛍️',
    iconColor: '#ec4899',
    title: 'Spend Smart, Win Big',
    subtitle: "LET'S GO",
    demo: 'shopping-ready',
    body: 'Reach the cash target before your taps run out. Prioritize 💎 diamonds, catch every flash sale, and chain cart bonuses.\n\nHappy shopping!',
  },
];