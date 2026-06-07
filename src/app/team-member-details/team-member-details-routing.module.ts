import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeamMemberDetailsPage } from './team-member-details.page';

const routes: Routes = [
  { path: '', component: TeamMemberDetailsPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeamMemberDetailsPageRoutingModule {}
