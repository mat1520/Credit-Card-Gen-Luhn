import { CardGenerator } from '../js/app.js';

describe('CardGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new CardGenerator();
    });

    test('Luhn algorithm validation', () => {
        // Test valid card numbers
        expect(generator.luhnCheck('4532015112830366')).toBe(true); // Valid Visa
        expect(generator.luhnCheck('5555555555554444')).toBe(true); // Valid Mastercard
        
        // Test invalid card numbers
        expect(generator.luhnCheck('4532015112830367')).toBe(false);
        expect(generator.luhnCheck('5555555555554445')).toBe(false);
    });

    test('Card number generation', () => {
        const bin = '453201';
        const cardNumber = generator.generateLuhnNumber(bin);
        
        expect(cardNumber.length).toBe(16);
        expect(cardNumber.startsWith(bin)).toBe(true);
        expect(generator.luhnCheck(cardNumber)).toBe(true);
    });

    test('CVV generation', () => {
        const cvv = generator.generateCVV();
        
        expect(cvv.length).toBe(3);
        expect(parseInt(cvv)).toBeGreaterThanOrEqual(100);
        expect(parseInt(cvv)).toBeLessThanOrEqual(999);
    });

    test('Expiry date generation', () => {
        const expiry = generator.generateExpiryDate();
        const [month, year] = expiry.split('/');
        
        expect(month.length).toBe(2);
        expect(year.length).toBe(2);
        expect(parseInt(month)).toBeGreaterThanOrEqual(1);
        expect(parseInt(month)).toBeLessThanOrEqual(12);
    });

    test('Card type detection', () => {
        expect(generator.detectCardType('4532015112830366')).toBe('Visa');
        expect(generator.detectCardType('5555555555554444')).toBe('Mastercard');
        expect(generator.detectCardType('378282246310005')).toBe('American Express');
        expect(generator.detectCardType('6011111111111117')).toBe('Discover');
        expect(generator.detectCardType('1234567890123456')).toBe('Desconocido');
    });
}); 