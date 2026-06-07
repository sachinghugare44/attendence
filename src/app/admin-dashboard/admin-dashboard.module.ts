import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard.page';
import { AdminDashboardPageRoutingModule } from './admin-dashboard-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, AdminDashboardPageRoutingModule],
  declarations: [AdminDashboardPage]
})
export class AdminDashboardPageModule {}
