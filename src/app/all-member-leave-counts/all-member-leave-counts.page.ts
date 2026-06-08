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
  memberStats: any[] = [];

users: any[] = [];

memberOptions: any[] = [
];
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
    this.loadUsers();
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

  loadUsers() {

  this.apiService.getUsers().subscribe({

    next: (res: any) => {

      this.users = res.data || res;

      this.memberOptions = [
        {
          value: 'all',
          label: 'All Members'
        }
      ];

      this.users.forEach((user: any) => {

        this.memberOptions.push({
          value: user.mobile,
          label: user.name
        });

      });

      this.loadAttendanceData();

    },

    error: (err) => {
      console.log(err);
    }

  });

}

loadAttendanceData() {

  const year = new Date().getFullYear();

  this.memberStats = [];

  const selectedUsers =
    this.selectedMember === 'all'
      ? this.users
      : this.users.filter(
          u => u.mobile == this.selectedMember
        );

  selectedUsers.forEach((user: any) => {

    this.apiService
      .getUserAttendanceHistory(
        user.mobile,
        year,
        this.selectedMonth
      )
      .subscribe({

        next: (res: any) => {

          const history = res.data || [];

          const stat = {
            name: user.name,
            mobile: user.mobile,

            G: 0,
            L: 0,
            WFH: 0,
            DH: 0,
            WO: 0,
            O: 0
          };

          history.forEach((row: any) => {

            switch (row.status) {

              case 'G':
                stat.G++;
                break;

              case 'L':
                stat.L++;
                break;

              case 'WFH':
                stat.WFH++;
                break;

              case 'DH':
                stat.DH++;
                break;

              case 'WO':
                stat.WO++;
                break;

              case 'O':
                stat.O++;
                break;
            }

          });

          this.memberStats.push(stat);

        },

        error: (err) => {
          console.log(err);
        }

      });

  });

}

get summaryTotals() {

  return this.memberStats.reduce(

    (total, member) => {

      total.G += member.G;
      total.L += member.L;
      total.WFH += member.WFH;
      total.DH += member.DH;
      total.WO += member.WO;
      total.O += member.O;

      return total;

    },

    {
      G: 0,
      L: 0,
      WFH: 0,
      DH: 0,
      WO: 0,
      O: 0
    }

  );

}


}
