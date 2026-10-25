import type { FeatureRequest, RequestStatus } from '@roadly/shared'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { REQUEST_STATUSES } from '../../feature-requests/constants/request-status'
import { StatusPill } from '../../feature-requests/components/StatusPill'
import { useMoveRequest } from '../hooks/use-move-request'

export function RequestStatusSelect({ request }: { request: FeatureRequest }) {
  const moveRequest = useMoveRequest()

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="request-status">Status</Label>
      <Select
        value={request.status}
        onValueChange={(status) => moveRequest(request, status as RequestStatus)}
      >
        <SelectTrigger id="request-status" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REQUEST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              <StatusPill status={status} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
