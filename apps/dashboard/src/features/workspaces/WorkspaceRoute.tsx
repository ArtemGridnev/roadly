import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet, useParams } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { AppDispatch, RootState } from '@/store'
import { writeLastWorkspace } from './last-workspace'
import { setActiveWorkspace } from './workspace-slice'
import { useGetWorkspacesQuery } from './workspaces-api'

export function WorkspaceRoute() {
  const { slug } = useParams()
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId)
  const dispatch = useDispatch<AppDispatch>()
  const workspace = workspaces?.find((candidate) => candidate.slug === slug)

  useEffect(() => {
    if (workspace) {
      dispatch(setActiveWorkspace(workspace.id))
      writeLastWorkspace(workspace.slug)
    }
  }, [dispatch, workspace])

  if (workspace) {
    return activeWorkspaceId === workspace.id ? <Outlet /> : null
  }

  if (isFetching) {
    return null
  }

  if (workspaces) {
    return <WorkspaceNotFound />
  }

  return <LoadError onRetry={refetch} />
}

function WorkspaceNotFound() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">Workspace not found</h1>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        It doesn't exist, or you're not a member of it.
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to="/">Go to your workspaces</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
