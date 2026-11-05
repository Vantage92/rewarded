// /api/v1/surveys (architecture §8.2; spec §7.4). Item and answer codes only, one short free field.
import { z } from 'zod';
import { Empty, SurveyMoment } from './common.ts';
import { defineRoutes } from './route.ts';

const ItemCode = z.string().regex(/^[A-Z][A-Z0-9_]{0,15}$/);
const AnswerCode = z.string().regex(/^[a-z0-9_]{1,24}$/);
export const SurveyItem = z.strictObject({
  code: ItemCode,
  kind: z.enum(['likert5', 'likert7', 'choice', 'minutes', 'free_short']),
  options: z.array(AnswerCode).max(12).optional(),
  requires_wellbeing_consent: z.boolean(),
});
export const SurveyDueResponse = z.strictObject({
  survey: z.strictObject({ moment: SurveyMoment, version: z.string().max(32), items: z.array(SurveyItem).max(40) }).optional(),
});
export const SurveyAnswerRequest = z.strictObject({
  items: z.array(z.strictObject({ code: ItemCode, answer: z.union([AnswerCode, z.number().int().min(0).max(1440), z.string().trim().max(200)]) })).max(40),
  skipped: z.boolean(),
  wellbeing_consent: z.boolean().optional(),
});
export const SurveyMomentParam = z.strictObject({ moment: SurveyMoment });

export const surveyRoutes = defineRoutes({
  'surveys.due': {
    module: 'surveys', method: 'GET', path: '/surveys/due', auth: ['student'],
    response: SurveyDueResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2, spec §7.4',
  },
  'surveys.answer': {
    module: 'surveys', method: 'POST', path: '/surveys/:moment', auth: ['student'],
    params: SurveyMomentParam, body: SurveyAnswerRequest, response: Empty, responseKind: 'json', status: [201],
    errors: ['NOT_DUE'], spec: 'arch §8.2, spec §7.4',
  },
});

// Inferred types (output side) for every schema above.
export type SurveyItem = z.output<typeof SurveyItem>;
export type SurveyDueResponse = z.output<typeof SurveyDueResponse>;
export type SurveyAnswerRequest = z.output<typeof SurveyAnswerRequest>;
export type SurveyMomentParam = z.output<typeof SurveyMomentParam>;
