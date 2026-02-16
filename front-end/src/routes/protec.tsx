import { createFileRoute } from '@tanstack/react-router'
import LayoutProtected from '../Layouts/Protected'

export const Route = createFileRoute('/protec')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <LayoutProtected>
      <div>Hello "/protec"!</div>
    </LayoutProtected>
  )
}
