import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AllMemberLeaveCountsPage } from './all-member-leave-counts.page';
import { AllMemberLeaveCountsPageRoutingModule } from './all-member-leave-counts-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, AllMemberLeaveCountsPageRoutingModule],
  declarations: [AllMemberLeaveCountsPage]
})
export class AllMemberLeaveCountsPageModule {}
