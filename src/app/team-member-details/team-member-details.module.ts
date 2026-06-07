import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TeamMemberDetailsPage } from './team-member-details.page';
import { TeamMemberDetailsPageRoutingModule } from './team-member-details-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, TeamMemberDetailsPageRoutingModule],
  declarations: [TeamMemberDetailsPage]
})
export class TeamMemberDetailsPageModule {}
