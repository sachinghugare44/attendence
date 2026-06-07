import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-member-leave-counts',
  templateUrl: './all-member-leave-counts.page.html',
  styleUrls: ['./all-member-leave-counts.page.scss'],
  standalone: false
})
export class AllMemberLeaveCountsPage implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedMember = 'all';
  responseData  : any;
  monthOptions = [
    { value: 1, label: 'Jan', name: 'January' },
    { value: 2, label: 'Feb', name: 'February' },
    { value: 3, label: 'Mar', name: 'March' },
    { value: 4, label: 'Apr', name: 'April' },
    { value: 5, label: 'May', name: 'May' },
    { value: 6, label: 'Jun', name: 'June' },
    { value: 7, label: 'Jul', name: 'July' },
    { value: 8, label: 'Aug', name: 'August' },
    { value: 9, label: 'Sep', name: 'September' },
    { value: 10, label: 'Oct', name: 'October' },
    { value: 11, label: 'Nov', name: 'November' },
    { value: 12, label: 'Dec', name: 'December' }
  ];

  memberOptions = [
    { value: 'all', label: 'All Members' },
    { value: 'amit', label: 'Amit Sharma' },
    { value: 'neha', label: 'Neha Patel' },
    { value: 'rahul', label: 'Rahul Verma' },
    { value: 'priya', label: 'Priya Singh' }
  ];

  memberStats = [
    { name: 'Amit Sharma', P: 18, L: 2, WFH: 1, H: 0 },
    { name: 'Neha Patel', P: 16, L: 4, WFH: 0, H: 1 },
    { name: 'Rahul Verma', P: 20, L: 1, WFH: 0, H: 0 },
    { name: 'Priya Singh', P: 17, L: 3, WFH: 1, H: 0 }
  ];
  constructor(private router: Router,
              private apiService: ApiService
  ) { }
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
    this.getAllApiUSerByMobile();
  }
  get selectedMonthName() {
    return this.monthOptions.find(item => item.value === this.selectedMonth)?.name || '';
  }

  get filteredMemberStats() {
    if (this.selectedMember === 'all') {
      return this.memberStats;
    }
    const selectedName = this.memberOptions.find(item => item.value === this.selectedMember)?.label;
    return this.memberStats.filter(member => member.name === selectedName);
  }

  get summaryTotals() {
    return this.memberStats.reduce((totals, member) => {
      totals.P += member.P;
      totals.L += member.L;
      totals.WFH += member.WFH;
      totals.H += member.H;
      return totals;
    }, { P: 0, L: 0, WFH: 0, H: 0 });
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
