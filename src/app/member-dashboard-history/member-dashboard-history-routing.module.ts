import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MemberDashboardHistoryPage } from './member-dashboard-history.page';

const routes: Routes = [
  {
    path: '',
    component: MemberDashboardHistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberDashboardHistoryPageRoutingModule {}
