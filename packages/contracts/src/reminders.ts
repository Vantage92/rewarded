// /api/v1/reminders (architecture §6.3 e-mailherinnering, §8.2).
import { z } from 'zod';
import { NoContent, Token } from './common.ts';
import { defineRoutes } from './route.ts';

export const ReminderUnsubscribeRequest = z.strictObject({ token: Token });

export const reminderRoutes = defineRoutes({
  'reminders.unsubscribe': {
    module: 'reminders', method: 'POST', path: '/reminders/unsubscribe', auth: ['public'],
    body: ReminderUnsubscribeRequest, response: NoContent, responseKind: 'empty', status: [204], errors: ['LINK_INVALID'], spec: 'arch §8.2',
  },
});
