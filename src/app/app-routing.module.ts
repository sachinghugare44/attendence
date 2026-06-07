import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./auth/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'member-dashboard',
    loadChildren: () => import('./member-dashboard/member-dashboard.module').then(m => m.MemberDashboardPageModule)
  },
  {
    path: 'member-dashboard-history',
    loadChildren: () => import('./member-dashboard-history/member-dashboard-history.module').then(m => m.MemberDashboardHistoryPageModule)
  },
  {
    path: 'admin-dashboard',
    loadChildren: () => import('./admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardPageModule)
  },
  {
    path: 'team-member-details',
    loadChildren: () => import('./team-member-details/team-member-details.module').then(m => m.TeamMemberDetailsPageModule)
  },
  {
    path: 'all-member-leave-counts',
    loadChildren: () => import('./all-member-leave-counts/all-member-leave-counts.module').then(m => m.AllMemberLeaveCountsPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
