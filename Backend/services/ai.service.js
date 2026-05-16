const axios = require('axios');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const pickRuleBasedRecommendation = (options = []) => {
    const validOptions = options.filter((option) => Number.isFinite(Number(option.fare)));

    if (validOptions.length === 0) {
        return {
            recommendedType: null,
            message: 'Compare the ride options and choose the one that fits your trip best.',
            source: 'rule',
        };
    }

    const scoredOptions = validOptions.map((option) => {
        const fare = Number(option.fare);
        const eta = Number(option.estimatedPickupMinutes || 20);
        const availableCaptains = Number(option.availableCaptains || 0);
        const availabilityBonus = option.isAvailable || availableCaptains > 0 ? 80 : 0;

        return {
            ...option,
            score: availabilityBonus + Math.max(0, 100 - fare / 10) + Math.max(0, 40 - eta),
        };
    });

    const best = scoredOptions.sort((a, b) => b.score - a.score)[0];
    const reasons = [];

    if (best.availableCaptains > 0) {
        reasons.push(`${best.availableCaptains} captain${best.availableCaptains === 1 ? '' : 's'} nearby`);
    }

    if (best.estimatedPickupMinutes) {
        reasons.push(`${best.estimatedPickupMinutes} min pickup`);
    }

    reasons.push(`Rs. ${best.fare} fare`);

    return {
        recommendedType: best.type,
        message: `${best.name || best.type} looks best for this trip because it has ${reasons.join(', ')}.`,
        source: 'rule',
    };
};

const parseGeminiJson = (text) => {
    const cleanedText = String(text || '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
    const match = cleanedText.match(/\{[\s\S]*\}/);

    if (!match) {
        return null;
    }

    try {
        return JSON.parse(match[0]);
    } catch (error) {
        return null;
    }
};

module.exports.getRideRecommendation = async ({ pickup, destination, options }) => {
    const fallback = pickRuleBasedRecommendation(options);

    if (!process.env.GEMINI_API_KEY) {
        return {
            ...fallback,
            message: `${fallback.message} Add GEMINI_API_KEY to enable Gemini wording.`,
        };
    }

    const prompt = `
You are GoNexi's ride suggestion assistant.
Recommend exactly one ride option for the passenger.
Use only this data. Keep the message under 22 words.
Return strict JSON only:
{"recommendedType":"car|moto|auto","message":"short reason"}

Pickup: ${pickup}
Destination: ${destination}
Options: ${JSON.stringify(options)}
`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
            {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 90,
                    responseMimeType: 'application/json',
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': process.env.GEMINI_API_KEY,
                },
                timeout: 8000,
            },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = parseGeminiJson(text);

        if (!parsed?.recommendedType || !parsed?.message) {
            return fallback;
        }

        return {
            recommendedType: parsed.recommendedType,
            message: parsed.message,
            source: 'gemini',
        };
    } catch (error) {
        console.error('Gemini recommendation error:', error.response?.data || error.message);
        return fallback;
    }
};
