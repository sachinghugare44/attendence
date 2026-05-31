import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { from } from 'rxjs';
import { concatMap, finalize, toArray } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-member-dashboard',
  templateUrl: './member-dashboard.page.html',
  styleUrls: ['./member-dashboard.page.scss'],
  standalone: false
})
export class MemberDashboardPage implements OnInit {
  currentMonthIndex = new Date().getMonth() + 1;
  months = MONTHS;
  selectedMonthIndex: number | null = null;
  selectedMonthName = '';
  selectionMode: 'single' | 'multiple' = 'single';
  selectedDay: number | null = null;
  selectedDateStr: string | null = null;
  selectedDateDisplay = '';
  selectedDayName = '';
  selectedCalendarDate: string | null = null;
  selectedDates: string[] = [];
  selectedDatesDisplay: string[] = [];
  status = '';
  remark = '';
  isAttendanceModalOpen = false;
  isSubmitting = false;
  isConfettiVisible = false;
  pendingHistoryMonth: number | null = null;
  modalStep: 'calendar' | 'status' = 'calendar';
  responseData: any;
  private confettiTimer: number | null = null;

  statusOptions = [
    { label: 'Present', value: 'P', icon: 'checkmark-circle-outline' },
    { label: 'Leave', value: 'L', icon: 'calendar-clear-outline' },
    { label: 'WFH', value: 'WFH', icon: 'home-outline' },
    { label: 'Holiday', value: 'H', icon: 'sunny-outline' }
  ];

  monthsk: any[] = [
    { name: 'January', image: '/assets/months_All/01_january.png', index: 1 },
    { name: 'February', image: '/assets/months_All/02_february.png', index: 2 },
    { name: 'March', image: '/assets/months_All/03_march.png', index: 3 },
    { name: 'April', image: '/assets/months_All/04_april.png', index: 4 },
    { name: 'May', image: '/assets/months_All/05_may.png', index: 5 },
    { name: 'June', image: '/assets/months_All/06_june.png', index: 6 },
    { name: 'July', image: '/assets/months_All/07_july.png', index: 7 },
    { name: 'August', image: '/assets/months_All/08_august.png', index: 8 },
    { name: 'September', image: '/assets/months_All/09_september.png', index: 9 },
    { name: 'October', image: '/assets/months_All/10_october.png', index: 10 },
    { name: 'November', image: '/assets/months_All/11_november.png', index: 11 },
    { name: 'December', image: '/assets/months_All/12_december.png', index: 12 }
  ];

  constructor(private router: Router, private apiService: ApiService, private toastController: ToastController) {}

  ngOnInit() {
    const mobile = localStorage.getItem('mobile');
    const password = localStorage.getItem('name');

    if (!mobile || !password) {
      this.router.navigate(['/login']);
      return;
    }

    this.getAllApiUSerByMobile();
  }

  openMonth(monthIdx: number) {
    this.openMonthDetails(this.months[monthIdx], monthIdx + 1);
  }

  openMonthHistory(monthName: string, monthIndex: number, event?: MouseEvent) {
    event?.preventDefault();
    if (!this.isMonthAccessible(monthIndex)) {
      return;
    }
    this.router.navigate(['/member-dashboard-history'], {
      queryParams: { month: monthIndex, monthName }
    });
  }

  openMonthDetails(monthName: string, monthIndex: number) {
    if (!this.isMonthAccessible(monthIndex)) {
      return;
    }

    this.selectedMonthName = monthName;
    this.selectedMonthIndex = monthIndex;
    this.resetSelection();
    this.selectionMode = 'single';
    this.modalStep = 'calendar';
    this.isAttendanceModalOpen = true;
  }

  closeAttendanceModal(resetMonth: boolean = true) {
    this.isAttendanceModalOpen = false;
    if (resetMonth) {
      this.selectedMonthIndex = null;
      this.selectedMonthName = '';
    }
    this.resetSelection();
    if (resetMonth) {
      this.selectionMode = 'single';
    }
    this.pendingHistoryMonth = null;
    this.isSubmitting = false;
  }

  onAttendanceModalDidDismiss() {
    if (this.pendingHistoryMonth !== null) {
      const month = this.pendingHistoryMonth;
      this.pendingHistoryMonth = null;
      this.resetSelection();
      this.router.navigate(['/member-dashboard-history'], {
        queryParams: { month }
      });
      return;
    }

    this.closeAttendanceModal();
  }

  showCalendarStep() {
    this.modalStep = 'calendar';
    this.status = '';
    this.remark = '';
  }

  getMonthMinDate(monthIdx: number): string {
    const year = new Date().getFullYear();
    return `${year}-${monthIdx.toString().padStart(2, '0')}-01`;
  }

  getMonthMaxDate(monthIdx: number): string {
    const year = new Date().getFullYear();
    const daysInMonth = new Date(year, monthIdx, 0).getDate();
    return `${year}-${monthIdx.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
  }

  onDateChange(event: any) {
    if (!event?.detail?.value) {
      return;
    }

    const rawValue = event.detail.value as string;
    const dateValue = rawValue.split('T')[0];
    const date = new Date(dateValue);

    if (this.selectionMode === 'multiple') {
      this.selectedCalendarDate = dateValue;
      return;
    }

    this.setSingleDate(dateValue);
    this.modalStep = 'status';
  }

  selectStatus(status: string) {
    this.status = status;
  }

  enableMultipleSelection() {
    this.selectionMode = 'multiple';
    this.modalStep = 'calendar';
    this.status = '';
    this.remark = '';
    this.selectedCalendarDate = this.selectedDateStr || this.selectedCalendarDate;
  }

  enableSingleSelection() {
    this.selectionMode = 'single';
    this.selectedDates = [];
    this.selectedDatesDisplay = [];
    this.selectedCalendarDate = null;
    this.status = '';
    this.remark = '';
    this.modalStep = 'calendar';
  }

  addSelectedDate() {
    if (!this.selectedCalendarDate || this.selectedDates.includes(this.selectedCalendarDate)) {
      return;
    }

    this.selectedDates = [...this.selectedDates, this.selectedCalendarDate].sort();
    this.selectedDatesDisplay = this.selectedDates.map((dateValue) => this.formatDate(dateValue));
    this.selectedCalendarDate = null;
    this.selectedDateStr = null;
    this.selectedDateDisplay = '';
    this.selectedDayName = '';
  }

  removeSelectedDate(dateValue: string) {
    this.selectedDates = this.selectedDates.filter((item) => item !== dateValue);
    this.selectedDatesDisplay = this.selectedDates.map((item) => this.formatDate(item));
  }

  goToStatusStep() {
    if (this.selectionMode === 'multiple') {
      if (!this.selectedDates.length) {
        return;
      }
    } else if (!this.selectedDateStr) {
      return;
    }

    this.modalStep = 'status';
  }

  submitStatus() {
    if (!this.selectedMonthIndex || !this.status) {
      return;
    }

    const datesToSubmit = this.selectionMode === 'multiple'
      ? this.selectedDates
      : this.selectedDateStr
        ? [this.selectedDateStr]
        : [];

    if (!datesToSubmit.length) {
      return;
    }

    const basePayload = {
      userMobile: localStorage.getItem('mobile'),
      status: this.status,
      note: this.remark
    };

    this.isSubmitting = true;
    from(datesToSubmit)
      .pipe(
        concatMap((date) => this.apiService.createAttendance({ ...basePayload, date })),
        toArray(),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (resp) => {
          console.log('Attendance marked successfully:', resp);
          this.presentToast('Attendance marked successfully!', 'success');
          this.playConfetti();
          this.pendingHistoryMonth = this.selectedMonthIndex;
          window.setTimeout(() => {
            this.isAttendanceModalOpen = false;
          }, 1200);
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
        }
      });
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

  getBackgroundPosition(index: number): string {
    const col = index % 4;
    const row = Math.floor(index / 4);
    return `${(col / 3) * 100}% ${(row / 2) * 100}%`;
  }

  isMonthAccessible(monthIndex: number): boolean {
    return monthIndex <= this.currentMonthIndex;
  }

  private resetSelection() {
    this.selectedDay = null;
    this.selectedDateStr = null;
    this.selectedDateDisplay = '';
    this.selectedDayName = '';
    this.selectedCalendarDate = null;
    this.selectedDates = [];
    this.selectedDatesDisplay = [];
    this.status = '';
    this.remark = '';
    this.modalStep = 'calendar';
  }

  private setSingleDate(dateValue: string) {
    const date = new Date(dateValue);
    this.selectedDay = date.getDate();
    this.selectedDateStr = dateValue;
    this.selectedDateDisplay = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    this.selectedDayName = date.toLocaleDateString('en-IN', { weekday: 'long' });
    this.status = '';
    this.remark = '';
  }

  private formatDate(dateValue: string) {
    return new Date(dateValue).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color,
      cssClass: 'auth-toast',
      buttons: [{ text: 'Close', role: 'cancel' }]
    });

    await toast.present();
  }

  private playConfetti() {
    if (this.confettiTimer) {
      window.clearTimeout(this.confettiTimer);
    }

    this.isConfettiVisible = true;
    this.confettiTimer = window.setTimeout(() => {
      this.isConfettiVisible = false;
      this.confettiTimer = null;
    }, 2400);
  }
}
