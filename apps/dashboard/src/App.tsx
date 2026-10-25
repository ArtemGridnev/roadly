import { createBrowserRouter, RouterProvider } from 'react-router'
import { Toaster } from './components/ui/sonner'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
