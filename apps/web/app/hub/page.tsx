import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardStreaks } from '~/hub/_components/dashboard-streaks';

export default function HubPage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />

      <PageBody>
        <DashboardStreaks />
      </PageBody>
    </>
  );
}
