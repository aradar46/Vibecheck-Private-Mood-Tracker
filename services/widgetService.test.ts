import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getMoodEmoji } from './widgetService.ts';
import { MOODS } from '../constants.ts';


describe('widgetService', () => {
    describe('getMoodEmoji', () => {
        test('should return correct emoji for valid mood values', () => {
            MOODS.forEach(mood => {
                assert.strictEqual(getMoodEmoji(mood.value), mood.emoji);
            });
        });

        test('should return default emoji for invalid mood values', () => {
            assert.strictEqual(getMoodEmoji(0), '😐');
            assert.strictEqual(getMoodEmoji(6), '😐');
            assert.strictEqual(getMoodEmoji(-1), '😐');
            assert.strictEqual(getMoodEmoji(3.5), '😐');
        });

        test('should return default emoji for NaN or undefined', () => {
            // @ts-ignore - testing runtime behavior
            assert.strictEqual(getMoodEmoji(NaN), '😐');
            // @ts-ignore - testing runtime behavior
            assert.strictEqual(getMoodEmoji(undefined), '😐');
        });
    });
});
