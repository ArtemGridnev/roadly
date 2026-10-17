import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/routes'
import { makeStore } from '@/store'

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  render(
    <Provider store={makeStore()}>
      <RouterProvider router={router} />
    </Provider>,
  )

  return router
}
