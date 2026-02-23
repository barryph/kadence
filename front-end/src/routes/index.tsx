import { createFileRoute } from '@tanstack/react-router'
import LayoutProtected from '../Layouts/Protected'
import Dashboard from '../components/Dashboard/dashboard';

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <LayoutProtected>
      <Dashboard />
    </LayoutProtected>
  )
}
