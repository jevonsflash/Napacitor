/**
 * @napacitor/contacts 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { ContactsPlugin } from './definitions';

const Contacts = registerPlugin<ContactsPlugin>('Contacts', {
  web: () => import('./web').then((m) => new m.ContactsWeb()),
});

export * from './definitions';
export { Contacts };
