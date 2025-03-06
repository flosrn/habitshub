import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardHub } from '~/hub/_components/dashboard-hub';

export default function HubPage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />

      <PageBody>
        <DashboardHub />
      </PageBody>
    </>
  );
}
