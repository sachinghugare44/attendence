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
  attendanceHistories: Record<string, any[]> = {};
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

          this.attendanceHistories[user.mobile] = history;
          this.memberStats.push(stat);

        },

        error: (err) => {
          console.log(err);
          this.attendanceHistories[user.mobile] = [];
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

    const selectedUsers =
      this.selectedMember === 'all'
        ? this.users
        : this.users.filter(u => u.mobile == this.selectedMember);

    const memberHeaders = selectedUsers.map(user => user.name);
    const dateRows = this.getMonthDates(this.selectedMonth);

    worksheet.mergeCells('A1', String.fromCharCode(67 + memberHeaders.length) + '1');
    const title = worksheet.getCell('A1');
    title.value = 'Attendance Report';
    title.font = {
      size: 20,
      bold: true
    };
    title.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    worksheet.getRow(1).height = 30;

    worksheet.getCell('A3').value = 'Month';
    worksheet.getCell('B3').value = this.selectedMonthName;
    worksheet.getCell('A4').value = 'Member Filter';
    worksheet.getCell('B4').value =
      this.selectedMember == 'all'
        ? 'All Members'
        : this.memberOptions.find(x => x.value == this.selectedMember)?.label;

    worksheet.getCell('D3').value = 'Generated On';
    worksheet.getCell('E3').value = new Date().toLocaleDateString('en-GB');

    worksheet.getCell('A6').value = 'Date';
    worksheet.getCell('B6').value = 'Day';
    memberHeaders.forEach((name, index) => {
      worksheet.getCell(6, index + 3).value = name;
    });

    worksheet.getRow(6).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    dateRows.forEach((dateObj, rowIndex) => {
      const rowIndexInSheet = 7 + rowIndex;
      const rowValues = [dateObj.dateLabel, dateObj.dayLabel];

      selectedUsers.forEach(user => {
        const history = this.attendanceHistories[user.mobile] || [];
        const attendanceForDate = history.find((item: any) => {
          const normalizedItemDate = this.normalizeAttendanceDate(item.date);
          return normalizedItemDate === dateObj.dateValue;
        });

        if (!attendanceForDate && (dateObj.dayLabel === 'Saturday' || dateObj.dayLabel === 'Sunday')) {
          rowValues.push('Holiday');
        } else {
          rowValues.push(this.mapStatusLabel(attendanceForDate?.status));
        }
      });

      const row = worksheet.addRow(rowValues);
      row.eachCell(cell => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    worksheet.columns = [
      { width: 18 },
      { width: 14 },
      ...memberHeaders.map(() => ({ width: 18 }))
    ];

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 6
      }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Attendance_${this.selectedMonthName}.xlsx`);
  }

  private getMonthDates(month: number): { dateValue: string; dateLabel: string; dayLabel: string }[] {
    const year = new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: { dateValue: string; dateLabel: string; dayLabel: string }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateLabel = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${String(year).slice(-2)}`;
      const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'long' });
      dates.push({ dateValue, dateLabel, dayLabel });
    }

    return dates;
  }

  private mapStatusLabel(status?: string): string {
    switch (status) {
      case 'G':
        return 'Present';
      case 'L':
        return 'Leave';
      case 'WFH':
        return 'WFH';
      case 'DH':
      case 'WO':
        return 'Holiday';
      case 'O':
        return 'Other';
      default:
        return '';
    }
  }

  private normalizeAttendanceDate(dateValue: any): string {
    if (!dateValue) {
      return '';
    }

    const value = String(dateValue).trim();
    const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      return isoMatch[0];
    }

    const dmyMatch = value.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2,4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1];
      const month = dmyMatch[2];
      let year = dmyMatch[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
