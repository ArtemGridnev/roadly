import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { routes } from '@/routes'
import { makeStore } from '@/store'
import { ThemeProvider } from '@/theme/ThemeProvider'

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  render(
    <Provider store={makeStore()}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </Provider>,
  )

  return router
}
