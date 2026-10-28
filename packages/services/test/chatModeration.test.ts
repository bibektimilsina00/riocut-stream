import { describe, expect, it } from 'vitest';
import { maskProfanity, moderateChatMessage } from '../src/chatModeration';

describe('chat moderation', () => {
    it('masks English and romanized Hindi/Nepali abuse, leaves normal words alone', () => {
        expect(maskProfanity('what the fuck')).not.toContain('fuck');
        expect(maskProfanity('f u c k this')).not.toMatch(/f u c k/);
        expect(maskProfanity('you muji')).toBe('you m***');
        expect(maskProfanity('chutiyaaa ref')).not.toContain('chutiya');
        expect(maskProfanity('computing the run rate')).toBe('computing the run rate');
        expect(maskProfanity('great shot Pokhara')).toBe('great shot Pokhara');
    });

    it('blocks links, duplicates, bursts and fast repeats', () => {
        let t = 1_000_000;
        expect(moderateChatMessage('a', '1.1.1.1', 'join www.spam.xyz', t)).toMatchObject({ ok: false });
        expect(moderateChatMessage('a', '1.1.1.1', 'goooooooal!!!!!!', t)).toEqual({ ok: true, text: 'goooal!!!' });
        expect(moderateChatMessage('a', '1.1.1.1', 'next', t + 500)).toMatchObject({ ok: false }); // under 2s gap
        expect(moderateChatMessage('a', '1.1.1.1', 'goooooooal!!!!!!', (t += 3000))).toMatchObject({ ok: false }); // duplicate
        for (let i = 0; i < 5; i++) moderateChatMessage('b', '2.2.2.2', `msg ${i}`, (t += 2500));
        expect(moderateChatMessage('b', '2.2.2.2', 'one more', (t += 2500))).toMatchObject({ ok: false }); // >5 in 30s
    });

    it('caps one IP across rotating guest ids', () => {
        let t = 5_000_000;
        const results = Array.from({ length: 14 }, (_, i) => moderateChatMessage(`guest${i}`, '9.9.9.9', `hello ${i}`, (t += 1000)));
        expect(results.filter((r) => r.ok)).toHaveLength(12);
    });
});
