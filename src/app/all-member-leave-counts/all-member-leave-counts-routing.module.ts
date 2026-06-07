import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllMemberLeaveCountsPage } from './all-member-leave-counts.page';

const routes: Routes = [
  { path: '', component: AllMemberLeaveCountsPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AllMemberLeaveCountsPageRoutingModule {}
