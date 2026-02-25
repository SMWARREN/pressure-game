// PRESSURE - Shopping Spree Mode Tutorial Steps

import { TutorialStep } from '../types';

export const SHOPPING_SPREE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🛍️',
    iconColor: '#ec4899',
    title: 'Shop & Match',
    subtitle: 'YOUR GOAL',
    demo: 'shopping-group',
    body: 'Tap groups of 2+ same items to "buy" them and earn cash. Different items have different values!',
  },
  {
    icon: '💰',
    iconColor: '#f59e0b',
    title: 'Item Values',
    subtitle: 'PRICE TAGS',
    demo: 'shopping-values',
    body: '💄 = $10  👗 = $15  👠 = $20  👜 = $25  💎 = $50\n\nDiamonds are rare and valuable!',
  },
  {
    icon: '⚡',
    iconColor: '#fbbf24',
    title: 'Flash Sales',
    subtitle: 'BONUS TIME',
    demo: 'shopping-flash',
    body: 'Randomly, an item goes on flash sale for 3× value! Watch for the golden glow.',
  },
  {
    icon: '🛒',
    iconColor: '#22c55e',
    title: 'Cart Bonus',
    subtitle: 'BULK REWARDS',
    demo: 'shopping-cart',
    body: 'Every 10 items you buy gives a $50 bonus! Keep shopping to stack rewards.',
  },
  {
    icon: '🦹',
    iconColor: '#ef4444',
    title: 'Thieves!',
    subtitle: 'WATCH OUT',
    demo: 'shopping-thief',
    body: 'In Unlimited mode, thieves sneak onto items! Match 3+ nearby items (worlds 1–2) or 4+ (worlds 3–4) to scare them away.',
  },
  {
    icon: '✨',
    iconColor: '#fbbf24',
    title: 'Luxury Items',
    subtitle: 'EXCLUSIVE FINDS',
    demo: 'shopping-unlock',
    body: 'Match 5+ items to unlock a rare luxury find: 🎀=$20 👒=$25 🧣=$30 💍=$45 🧥=$35 🕶️=$25. Worth 2× until they appear evenly on the board!',
  },
];
