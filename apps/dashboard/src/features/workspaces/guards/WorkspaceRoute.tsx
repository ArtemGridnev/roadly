import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link, Outlet, useParams } from 'react-router'
import { LoadError } from '@/components/LoadError'
import { StandaloneLayout } from '@/components/StandaloneLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { AppDispatch } from '@/store'
import { writeLastWorkspace } from '../utils/last-workspace'
import { setActiveWorkspace } from '../store/workspace-slice'
import { useGetWorkspacesQuery } from '../api/workspaces-api'

export function WorkspaceRoute() {
  const { slug } = useParams()
  const { data: workspaces, isFetching, refetch } = useGetWorkspacesQuery()
  const dispatch = useDispatch<AppDispatch>()
  const workspace = workspaces?.find((candidate) => candidate.slug === slug)

  useEffect(() => {
    if (workspace) {
      dispatch(setActiveWorkspace(workspace.id))
      writeLastWorkspace(workspace.slug)
    }
  }, [dispatch, workspace])

  if (workspace) {
    return <Outlet context={workspace} />
  }

  if (isFetching) {
    return null
  }

  return (
    <StandaloneLayout>
      {workspaces ? <WorkspaceNotFound /> : <LoadError onRetry={refetch} />}
    </StandaloneLayout>
  )
}

function WorkspaceNotFound() {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-semibold">{t('workspaces.notFound.title')}</h1>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {t('workspaces.notFound.description')}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to="/">{t('workspaces.notFound.link')}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
