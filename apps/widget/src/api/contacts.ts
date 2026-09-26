import { useMutation } from '@tanstack/react-query'
import type { Contact, CreateContactInput } from '@roadly/shared'
import { apiRequest } from './client'

interface IdentifyContactParams {
  widgetKey: string
  input: CreateContactInput
}

export function useIdentifyContact() {
  return useMutation({
    mutationFn: ({ widgetKey, input }: IdentifyContactParams) =>
      apiRequest<Contact>('/widget/contacts', {
        method: 'POST',
        body: input,
        widgetKey,
      }),
  })
}
