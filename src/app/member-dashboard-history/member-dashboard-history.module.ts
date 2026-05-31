import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MemberDashboardHistoryPage } from './member-dashboard-history.page';
import { RouterModule, Routes } from '@angular/router';
const routes: Routes = [
  { path: '', component: MemberDashboardHistoryPage }
];
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [MemberDashboardHistoryPage]
})
export class MemberDashboardHistoryPageModule {}
