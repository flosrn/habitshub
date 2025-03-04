import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardDemo } from '~/hub/_components/dashboard-demo';

export default function HubPage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />

      <PageBody>
        <DashboardDemo />
      </PageBody>
    </>
  );
}
