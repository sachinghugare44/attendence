import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: false
})
export class AdminDashboardPage implements OnInit {
  quickActions = [
    {
      title: 'Team Members Details',
      description: 'View profile, role, contact details, and attendance status.',
      icon: 'people-outline',
      route: '/team-member-details',
      accent: 'blue'
    },
    {
      title: 'View Leave Counts',
      description: 'Track leave and attendance counts by month and member.',
      icon: 'calendar-number-outline',
      route: '',
      accent: 'teal'
    },
    {
      title: 'View Attendance History',
      description: 'Open detailed attendance history and daily status updates.',
      icon: 'time-outline',
      route: '/member-dashboard-history',
      accent: 'violet'
    }
  ];

  recentActivity = [
    { name: 'Amit Sharma', status: 'Present marked for today', state: 'updated', time: '2 min ago' },
    { name: 'Neha Patel', status: 'Leave requested for tomorrow', state: 'pending', time: '12 min ago' },
    { name: 'Rahul Verma', status: 'WFH updated with remark', state: 'updated', time: '18 min ago' },
    { name: 'Priya Singh', status: 'Attendance pending review', state: 'pending', time: '1 hour ago' }
  ];
  responseData: any;
  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.getAllApiUSerByMobile();
    const mobile = localStorage.getItem('mobile');
    const password = localStorage.getItem('name');
    const usertype = localStorage.getItem('usertype');

      if (usertype === '2' && mobile != undefined ) {
      } 
      else {
        alert('Unauthorized access. Please log in as admin.');
        this.logout();
      // this.router.navigate(['/login']);
      return;
    }
    
  }
  openRoute(route: string) {
    if(route === ''){
      alert('This feature is coming soon!');
      return;
    }
    this.router.navigate([route]);
  }

  getActivityIcon(state: string) {
    return state === 'updated' ? 'checkmark-done-circle-outline' : 'ellipse-outline';
  }

   getAllApiUSerByMobile() {
    const mobile = localStorage.getItem('mobile');
    if (!mobile) {
      return;
    }
    this.apiService.getUserByMobile(mobile).subscribe({
      next: (response: any) => {
        this.responseData = response.data;
        console.log('User details:', this.responseData);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

   logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
