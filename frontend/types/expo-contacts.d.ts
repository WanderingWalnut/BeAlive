declare module 'expo-contacts' {
  export const Fields: {
    PhoneNumbers: string;
  };

  export function requestPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;

  export function getContactsAsync(options?: { fields?: string[]; pageSize?: number }): Promise<{ data?: Array<any> }>;

  export type Contact = {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phoneNumbers?: Array<{ id?: string; number: string }>;
  };
}
