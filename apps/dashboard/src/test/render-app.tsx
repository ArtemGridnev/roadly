import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import { routes } from '@/routes'
import { makeStore } from '@/store'
import { ThemeProvider } from '@/theme/ThemeProvider'

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  render(
    <Provider store={makeStore()}>
      <ThemeProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
          <Toaster />
        </LanguageProvider>
      </ThemeProvider>
    </Provider>,
  )

  return router
}
