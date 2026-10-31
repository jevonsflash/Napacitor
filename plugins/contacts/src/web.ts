/**
 * @napacitor/contacts 浏览器实现。
 * 读取全部联系人在浏览器无对应能力;选取联系人经实验性
 * Contact Picker API(仅部分 Chromium 浏览器支持,不支持时抛错)。
 */
import type { ContactInfo } from './definitions';

/** 浏览器实验性 Contact Picker API(Chromium)。 */
interface WebContactsPicker {
  select(properties: string[], options?: { multiple?: boolean }): Promise<WebContact[]>;
  getProperties(): Promise<string[]>;
}

interface WebContact {
  name?: string[];
  email?: string[];
  tel?: string[];
}

export class ContactsWeb {
  async getContacts(): Promise<ContactInfo[]> {
    throw new Error('Contacts.getContacts:仅原生平台可用');
  }

  async pickContact(): Promise<ContactInfo | null> {
    const picker = this.getPicker();
    if (!picker) {
      throw new Error('Contacts.pickContact:仅原生平台可用');
    }

    const properties = await picker.getProperties();
    const wanted = ['name', 'email', 'tel'].filter((p) => properties.includes(p));
    const contacts = await picker.select(wanted, { multiple: false });
    if (!contacts || contacts.length === 0) {
      return null;
    }

    const contact = contacts[0];
    return {
      id: '',
      displayName: contact.name?.join(' ') ?? '',
      emails: (contact.email ?? []).map((emailAddress) => ({ emailAddress })),
      phones: (contact.tel ?? []).map((phoneNumber) => ({ phoneNumber })),
    };
  }

  private getPicker(): WebContactsPicker | undefined {
    return (navigator as Navigator & { contacts?: WebContactsPicker }).contacts;
  }
}
