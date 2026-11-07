export const en = {
  status: {
    BACKLOG: 'Backlog',
    PLANNED: 'Planned',
    IN_PROGRESS: 'In progress',
    SHIPPED: 'Shipped',
  },
  panel: {
    feedback: 'Feedback',
    open: 'Open Roadly feedback',
    close: 'Close Roadly',
    back: 'Back',
  },
  tabs: {
    label: 'Widget sections',
    requests: { label: 'Requests', title: 'Feature requests' },
    mine: { label: 'My requests', title: 'My requests' },
  },
  list: {
    loadErrorTitle: "We couldn't load the requests",
    loadErrorDescription: 'The connection to Roadly failed.',
    tryAgain: 'Try again',
    sortLabel: 'Sort requests',
    sort: { top: 'Most voted', newest: 'Newest' },
    emptyTitle: 'No feature requests yet',
    emptyDescription: 'Be the first to tell the team what to build next.',
    emptyMineTitle: "You haven't requested anything yet",
    emptyMineDescription: 'Requests you submit will show up here with their status.',
    upvote: (count: number) => (count === 1 ? 'Upvote, 1 vote' : `Upvote, ${count} votes`),
  },
  detail: {
    title: 'Request',
    missingTitle: 'This request is no longer available',
    missingDescription: 'It may have been removed by the team.',
  },
  newRequest: {
    title: 'New request',
    sent: 'Request sent',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Export reports to CSV',
    titleError: 'Add a short title.',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What are you trying to do, and what gets in the way today?',
    descriptionError: 'Describe what you need and why.',
    identifyFailed: "We couldn't identify your account, so requests can't be sent right now.",
    sendFailed: "Your request wasn't sent. Check your connection and try again.",
    submit: 'Send request',
    submitting: 'Sending…',
  },
}

export type Messages = typeof en
