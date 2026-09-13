import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import Cheatsheet from './pages/Cheatsheet'
import Home from './pages/Home'
import Lesson from './pages/Lesson'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'patterns', element: <Cheatsheet /> },
        { path: ':partId/:chapterId/:lessonId', element: <Lesson /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') },
)
