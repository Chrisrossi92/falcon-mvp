import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

const router = createBrowserRouter([
  { path: "/", element: <div style={{ padding: 16 }}>Home OK</div> },
]);

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

