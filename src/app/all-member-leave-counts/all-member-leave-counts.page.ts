import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';
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

async exportToExcel() {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  worksheet.properties.defaultRowHeight = 25;

  // Title
  worksheet.mergeCells('A1:G1');

  const title = worksheet.getCell('A1');
  title.value = 'Attendance Dashboard Report';
  title.font = {
    size: 20,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };

  title.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };

  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' }
  };

  worksheet.getRow(1).height = 35;

  // Filters
  worksheet.getCell('A3').value = 'Month';
  worksheet.getCell('B3').value = this.selectedMonthName;

  worksheet.getCell('D3').value = 'Member';

  worksheet.getCell('E3').value =
    this.selectedMember == 'all'
      ? 'All Members'
      : this.memberOptions.find(x => x.value == this.selectedMember)?.label;

  // Summary Row

  const summary = [
    {
      text: 'Present',
      value: this.summaryTotals.G,
      color: '00B050'
    },
    {
      text: 'Leave',
      value: this.summaryTotals.L,
      color: 'ED7D31'
    },
    {
      text: 'WFH',
      value: this.summaryTotals.WFH,
      color: '5B9BD5'
    },
    {
      text: 'Holiday',
      value: this.summaryTotals.DH,
      color: 'FFC000'
    },
    {
      text: 'Weekend',
      value: this.summaryTotals.WO,
      color: '9E480E'
    },
    {
      text: 'Other',
      value: this.summaryTotals.O,
      color: 'E83E8C'
    }
  ];

  let col = 1;

  summary.forEach(item => {

    worksheet.mergeCells(5, col, 6, col);

    const cell = worksheet.getCell(5, col);

    cell.value = item.text + '\n' + item.value;

    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 14
    };

    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: item.color }
    };

    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' }
    };

    worksheet.getColumn(col).width = 18;

    col++;

  });

  // Table Header

  const headerRow = worksheet.addRow([]);

  // headerRow.number = 8;

  worksheet.getRow(8).values = [
    'Member',
    'Present',
    'Leave',
    'WFH',
    'Holiday',
    'Weekend',
    'Other'
  ];

  worksheet.getRow(8).eachCell(cell => {

    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };

    cell.alignment = {
      horizontal: 'center'
    };

    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };

  });

  // Table Data

  this.memberStats.forEach(member => {

    const row = worksheet.addRow([
      member.name,
      member.G,
      member.L,
      member.WFH,
      member.DH,
      member.WO,
      member.O
    ]);

    row.eachCell(cell => {

      cell.alignment = {
        horizontal: 'center'
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };

    });

  });

  worksheet.autoFilter = {
    from: 'A8',
    to: 'G8'
  };

  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 8
    }
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    `Attendance_${this.selectedMonthName}.xlsx`
  );

}

}
