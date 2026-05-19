import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { NotFound } from './routes/NotFound';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <Layout><NotFound /></Layout>,
      children: [
        { index: true, element: <Home /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: '/calendar',
  },
);
