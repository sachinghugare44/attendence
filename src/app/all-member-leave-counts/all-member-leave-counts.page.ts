import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
  userActivityPanel: any[] = [];

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
    this.loadUserActivityPanel();
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

loadUserActivityPanel() {
  this.apiService.getUsers().subscribe({
    next: (res: any) => {
      const users = res.data || res;
      const previousMonth = this.selectedMonth === 1 ? 12 : this.selectedMonth - 1;
      const year = this.selectedMonth === 1 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      const activityData: any[] = [];

      let completedRequests = 0;

      users.forEach((user: any) => {
        this.apiService.getUserAttendanceHistory(user.mobile, year, previousMonth).subscribe({
          next: (historyRes: any) => {
            const history = historyRes.data || [];
            const leaveCount = history.filter((h: any) => 
              h.status === 'WFH' || h.status === 'L' || h.status === 'O'
            ).length;

            const stars = this.calculateStarRating(leaveCount);
            const status = leaveCount === 0 ? 'BEST' : 'GOOD';

            activityData.push({
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              image: user.profileImage || null,
              leaveCount: leaveCount,
              stars: stars,
              status: status
            });

            completedRequests++;
            if (completedRequests === users.length) {
              this.userActivityPanel = activityData.sort((a, b) => b.stars - a.stars);
            }
          },
          error: (err) => {
            console.error(`Error fetching history for ${user.mobile}`, err);
            completedRequests++;
            if (completedRequests === users.length) {
              this.userActivityPanel = activityData.sort((a, b) => b.stars - a.stars);
            }
          }
        });
      });
    },
    error: (err) => {
      console.error('Error loading users', err);
    }
  });
}

calculateStarRating(leaveCount: number): number {
  if (leaveCount === 0) {
    return 5;
  } else if (leaveCount >= 1) {
    return 3;
  }
  return 3;
}

exportToExcel() {

  const workbook = XLSX.utils.book_new();

  // Summary Data
  const summary = [
    ["Attendance Report"],
    [],
    ["Month", this.selectedMonthName],
    [
      "Present",
      this.summaryTotals.G,
      "Leave",
      this.summaryTotals.L,
      "WFH",
      this.summaryTotals.WFH,
      "Holiday",
      this.summaryTotals.DH,
      "Weekend",
      this.summaryTotals.WO,
      "Other",
      this.summaryTotals.O
    ],
    []
  ];

  // Table Header
  const table = [
    ["Member", "Present", "Leave", "WFH", "Holiday", "Weekend", "Other"]
  ];

  // Table Rows
  this.memberStats.forEach(m => {

    table.push([
      m.name,
      m.G,
      m.L,
      m.WFH,
      m.DH,
      m.WO,
      m.O
    ]);

  });

  const data = [...summary, ...table];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Column Width
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  });

  const blob = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );

  saveAs(
    blob,
    `Attendance_${this.selectedMonthName}_${new Date().getFullYear()}.xlsx`
  );

}
}
